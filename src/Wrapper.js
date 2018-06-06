import { Pointer, StringPointer } from './types';
import { encode, decode } from './encoding';
import { assert, isNil, toUint8Array } from './misc';
import demangle from './demangle';


const numbers = new Set([
  'int8', 'int16', 'int32', 'int64',
  'uint8', 'uint16', 'uint32', 'uint64',
  'float', 'double',
  'u8', 'u16', 'u32', 'u64',
  'i8', 'i16', 'i32', 'i64',
  'f32', 'f64',
  'schar', 'short', 'int', 'long',
  'char', 'uchar', 'ushort', 'uint', 'ulong',
  'size_t',
  'usize',
]);


function areValid(argTypes) {
  return argTypes.every(type =>
    type === null ||
    type === undefined ||
    type === 'void' ||
    type === 'number' ||
    type === 'boolean' ||
    type === 'bool' ||
    type === 'string' ||
    type === 'array' ||
    numbers.has(type) ||
    type.isStruct ||
    type.isPointer);
}


// a node fetch polyfill that won't trigger webpack
// idea borrowed from:
// https://github.com/dcodeIO/webassembly/blob/master/src/index.js#L223
let fs;
function fetch_polyfill(file) {
  return new Promise((resolve, reject) => {
    (fs || (fs = eval('equire'.replace(/^/, 'r'))('fs'))).readFile(
      file,
      function(err, data) {
        return (err)
          ? reject(err)
          : resolve({
              arrayBuffer: () => Promise.resolve(data),
              ok: true,
            });
      }
    );
  });
}


const fetchFn = (typeof fetch === 'function' && fetch) || fetch_polyfill;


// gets the wasm at a url and instantiates it.
// checks if streaming instantiation is available and uses that
function fetchAndInstantiate(url, imports) {
  return fetchFn(url)
    .then((resp) => {
      if (!resp.ok) {
        throw new Error(`Got a ${resp.status} fetching wasm @ ${url}`);
      }

      const wasm = 'application/wasm';
      const type = resp.headers && resp.headers.get('content-type');

      return (WebAssembly.instantiateStreaming && type === wasm)
        ? WebAssembly.instantiateStreaming(resp, imports)
        : resp.arrayBuffer().then(buf => WebAssembly.instantiate(buf, imports));
    })
    .then(result => result.instance);
}


const DATA = (typeof Symbol !== 'undefined')
  ? Symbol.for('wrapper-data')
  : '__data';


class Wrapper {
  constructor(signatures, opts = {}) {
    const dialect = opts.dialect && opts.dialect.toLowerCase();

    // Keep internal info behind the DATA symbol so wrapped function names
    // won't cause conflicts
    this[DATA] = {
      instance: null,
      imports: null,
      signatures: new Set(),
      allocations: new Map(),
      memory: opts.memory,
      debug: !!opts.debug,
      isAssemblyScript: dialect === 'assemblyscript',
    };

    Object.entries(signatures).forEach(([fn, [returnType, argTypes = []]]) => {
      // check for name collisions:
      ['exports', 'imports', 'utils', 'fetch', 'use'].forEach(name =>
        assert(fn !== name, '`%s` is a reserved wrapper name', name));

      // validate arg types
      assert(argTypes.every(arg => !!arg), '`%s` has undefined types', fn);
      assert(areValid([returnType]), '`%s` has invalid types', fn);
      assert(areValid(argTypes), '`%s` has invalid types', fn);

      this[DATA].signatures.add({ fnName: fn, returnType, argTypes });
    });

    // exposing some methods via `.utils`
    this.utils = {
      encodeString:   this.__encodeString.bind(this),
      decodeString:   this.__decodeString.bind(this),
      readStringView: this.__readStringView.bind(this),
      readString:     this.__readString.bind(this),
      writeString:    this.__writeString.bind(this),
      writeArray:     this.__writeArray.bind(this),
      readStruct:     this.__readStruct.bind(this),
      writeStruct:    this.__writeStruct.bind(this),
      readPointer:    this.__readPointer.bind(this),
      writePointer:   this.__writePointer.bind(this),

      allocate: function(value) {
        assert(typeof value.ref === 'function',
          "Can't allocate '%s' This method is for Pointer & Structs", value);

        (value instanceof Pointer || value instanceof StringPointer)
          ? this.__writePointer(value)
          : this.__writeStruct(value);
      }.bind(this),

      free: function(value) {
        (typeof value.ref === 'function')
          ? this.__free(value.ref())
          : this.__free(value);
      }.bind(this),
    };

    this.exports = null;
  }

  // takes an import object or a function what will produce a import object
  imports(importArg, applyDefaults = true) {
    const wrap = (...fnConfig) => {
      // function to wrap is always the last argument
      const fn = fnConfig.pop();
      // two argument formats (this might be a bad idea):
      //   1) with return type: wrap([returnType, [...argTypes]], fn)
      //   2) no return type: wrap(arg1, arg2, ..., fn)
      //
      // detructure into appropriate vars
      const [returnType, argTypes = []] = (Array.isArray(fnConfig[0]))
        ? fnConfig[0]       // 1st format
        : [null, fnConfig]; // 2nd format

      assert(areValid(argTypes), `Import has invalid types: ${argTypes}`);
      assert(areValid([returnType]), `Import has invalid types: ${returnType}`);

      return (...args) => {
        const ffi_args = argTypes.map((type, i) => this.__out(args[i], type));

        if (args.length > argTypes.length) {
          ffi_args.push(...args.slice(argTypes.length - args.length));
        }

        const value = fn(...ffi_args);

        if (returnType && returnType !== 'void') {
          return this.__in(value, returnType);
        }
      };
    };

    const env = {
      // wasm-glue
      print:  wrap('string', (str, ...args) => console.log(str, ...args)),
      eprint: wrap('string', (str, ...args) => console.error(str, ...args)),
      trace:  wrap('string', (str) => { throw new Error(str); }),

      // assemblyscript
      abort: wrap('string', 'string', 'number', 'number', (msg, file, line, col) => {
        throw new Error(`${msg} @ ${file}:${line}:${col}`);
      }),

      // <webassembly.h>
      _abort(errCode) {
        throw new Error(`Aborting, error code: ${errCode}`);
      },

      _exit(exitCode) {
        if (exitCode) throw new Error(`Exit error code: ${exitCode}`);
      },

      _grow() {},
    };

    const obj = (typeof importArg === 'function')
      ? importArg(wrap)
      : importArg;

    if (applyDefaults) obj.env = Object.assign(env, obj.env);
    this[DATA].imports = obj;

    return obj;
  }

  fetch(url) {
    const imports = this[DATA].imports || this.imports({});

    return fetchAndInstantiate(url, imports).then((instance) => {
      this.__link(instance);
      return this;
    });
  }

  use(instance) {
    assert(instance instanceof WebAssembly.Instance,
      '.use(instance) requires a WebAssembly.Instance');

    this.__link(instance);
    return this;
  }

  __link(instance) {
    const memory = this[DATA].memory ||
                   instance.exports.memory ||
                   (this[DATA].imports.env && this[DATA].imports.env.memory);

    assert(!!memory, '' +
      'Wrapper needs access to your WebAssemmbly memory. It looks for this in' +
      'either your `imports.env.memory` or `exports.env.memory`. If you don\'t' +
      'use either, you need to add it in the options with `new Wrapper`');

    this.exports = instance.exports;
    this[DATA].instance = instance;
    this[DATA].memory = memory;

    this[DATA].signatures.forEach(({ fnName, returnType, argTypes }) => {
      const fn = this.exports[fnName];
      assert(!!fn, `Fn '${fnName}' missing from wasm exports`);

      this[fnName] = this.__wrap(fn, argTypes, returnType);
    });
  }

  __wrap(fn, argTypes, returnType) {
    return function(...args) {
      const stack = [];
      const ffi_args = argTypes.map((type, i) => this.__in(args[i], type, stack));
      let value;

      if (args.length > argTypes.length) {
        ffi_args.push(...args.slice(argTypes.length - args.length));
      }

      try {
        value = fn(...ffi_args);
      } catch (err) {
        throw demangle(err);
      }

      stack.forEach(ptr => this.__free(ptr));

      if (returnType && returnType !== 'void') {
        return this.__out(value, returnType);
      }
    };
  }

  // wrap a variable heading into a wasm function
  __in(value, type, stack) {
    assert(!!type, 'No arg type was specified for this function');

    if (type === 'number' || numbers.has(type)) return value;
    if (type === 'boolean' || type === 'bool') return !!value;
    if (type === 'string') return this.__writeString(value, stack);
    if (type === 'array') return this.__writeArray(value, stack);
    if (type.isStruct) return this.__writeStruct(value, type);
    if (type.isPointer) return this.__writePointer(value);

    throw new Error(`Unknown type: \n${JSON.stringify(type)}`);
  }

  // wrap a variable heading out of a wasm function
  __out(value, type) {
    assert(!!type, 'No arg type was specified for this function');

    if (type === 'number' || numbers.has(type)) return value;
    if (type === 'boolean' || type === 'bool') return !!value;
    if (type === 'string') return this.__readString(value);
    if (type.isStruct) return this.__readStruct(value, type);
    if (type.isPointer) return this.__readPointer(value, type);

    throw new Error(`Unknown type: \n${JSON.stringify(type)}`);
  }

  __allocate(size) {
    assert(!!this.exports.allocate && !!this.exports.deallocate,
      "Missing allocate/deallocate fns in wasm exports, can't allocate memory");

    const ptr = this.exports.allocate(size);
    assert(!!ptr, 'allocate failed');

    if (this[DATA].debug) console.log('Alloc: %s (size=%s)', ptr, size);
    this[DATA].allocations.set(ptr, size);

    return ptr;
  }

  __free(ptr, optSize) {
    const size = optSize || this[DATA].allocations.get(ptr);
    if (this[DATA].debug) console.log('Free: %s (size=%s)', ptr, size);

    this.exports.deallocate(ptr, size);
    this[DATA].allocations.delete(ptr);
  }

  __view(start, length) {
    return new DataView(this[DATA].memory.buffer, start, length);
  }

  __encodeString(str) {
    const encoded = (this[DATA].isAssemblyScript)
      ? encode(str, 'utf-16')
      : encode(str);

    const len = (this[DATA].isAssemblyScript)
      ? encoded.byteLength + 4  // assemblyscript header
      : encoded.byteLength + 1; // null terminating byte

    const buf = new Uint8Array(new ArrayBuffer(len));

    if (this[DATA].isAssemblyScript) {
      const header = encoded.byteLength / 2;
      (new DataView(buf.buffer)).setUint32(0, header, true);
      buf.set(encoded, 4);
    } else {
      buf.set(encoded, 0);
      buf[len - 1] = 0;
    }

    return buf;
  }

  __decodeString(view) {
    const buf = toUint8Array(view);

    return (this[DATA].isAssemblyScript)
      ? decode(buf.subarray(4), 'utf-16')
      : decode(buf.subarray(0, -1));
  }

  __readStringView(ptr) {
    // length prefixed
    if (this[DATA].isAssemblyScript) {
      const strlen = this.__view().getUint32(ptr, true); // header
      const len = 4 + (strlen * 2);

      return this.__view(ptr, len);
    }

    // null terminated
    const memory = new Uint8Array(this[DATA].memory.buffer);

    let end = ptr;
    while (memory[end]) ++end;

    return this.__view(ptr, (end - ptr + 1));
  }

  __readString(ptr) {
    return this.__decodeString(this.__readStringView(ptr));
  }

  __writeString(str, stack) {
    const buf = this.__encodeString(str);

    const ptr = this.__allocate(buf.byteLength);
    if (stack) stack.push(ptr);

    const memory = new Uint8Array(this[DATA].memory.buffer);
    memory.set(buf, ptr);

    return ptr;
  }

  __writeArray(arg, stack) {
    assert(arg instanceof ArrayBuffer || ArrayBuffer.isView(arg),
      'Argument must be an ArrayBuffer or a TypedArray (like Uint8Array)');

    const arr = (!ArrayBuffer.isView(arg)) ? new Uint8Array(arg) : arg;

    const len = (this[DATA].isAssemblyScript)
      ? arr.byteLength + 16 /* Array/ArrayBuffer header */
      : arr.byteLength;

    const ptr = this.__allocate(len);
    if (stack) stack.push(ptr);

    const memory = new Uint8Array(this[DATA].memory.buffer);
    const data = toUint8Array(arr);

    if (this[DATA].isAssemblyScript) {
      this.__view().setUint32(ptr + 0, ptr + 8, true);        // arraybuffer ptr
      this.__view().setUint32(ptr + 4, arr.length, true);     // array length
      this.__view().setUint32(ptr + 8, arr.byteLength, true); // byteLength
      memory.set(data, ptr + 16);                             // contents
    } else {
      memory.set(data, ptr);
    }

    return ptr;
  }

  __readStruct(ptr, StructType) {
    assert(!!StructType, 'No struct StructType given');

    const view = this.__view(ptr, StructType.width);
    const struct = StructType.read(view, this.utils);

    return struct;
  }

  __writeStruct(value, Type) {
    // if struct has already been allocated:
    if (!isNil(value) && value.ref && value.ref()) return value.ref();

    const StructType = Type || value.constructor;
    const ptr = this.__allocate(StructType.width);
    const view = this.__view(ptr, StructType.width);

    StructType.write(view, value, this.utils);

    return ptr;
  }

  __readPointer(ptr, ptrType) {
    assert(!!ptrType, 'No pointer type given');

    // get the size of what the pointer points to
    const view = this.__view(ptr, ptrType.type.width);

    // handle pointer of a pointer cases (structs are pointers too here)
    if (ptrType.type.isStruct || ptrType.type.isPointer) {
      return ptrType.read(view, this.utils);
    }

    const pointer = new Pointer(ptrType.type);
    pointer.view = view;
    pointer.wrapper = this.utils;

    return pointer;
  }

  __writePointer(pointer) {
    if (pointer.ref()) return pointer.ref();

    pointer.wrapper = this.utils;

    // allocate space for what the pointer points to
    const size = pointer.size();
    const addr = this.__allocate(size);
    const view = this.__view(addr, size);

    pointer.view = view;
    pointer.commit();

    return addr;
  }
}


function cwrap(instance, fnName, returnType = null, argTypes = []) {
  assert(instance instanceof WebAssembly.Instance,
    '.cwrap() requires a ready WebAssembly.Instance');

  const wrapper = new Wrapper({ [fnName]: [returnType, argTypes] });
  wrapper.use(instance);

  return wrapper[fnName].bind(wrapper);
}

function ccall(instance, fnName, returnType = null, argTypes = [], ...args) {
  assert(instance instanceof WebAssembly.Instance,
    '.ccall() requires a ready WebAssembly.Instance');

  const wrapper = new Wrapper({ [fnName]: [returnType, argTypes] });
  wrapper.use(instance);

  return wrapper[fnName].call(wrapper, ...args);
}


export { Wrapper, cwrap, ccall };
