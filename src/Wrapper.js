import { Pointer, CString } from './types';
import { Encoder, Decoder } from './encoding';
import { assert } from './misc';
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


function areValid(types) {
  return types.every(type =>
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
    // Keep internal info behind the DATA symbol, try to minimize footprint so
    // wrapped function names don't conflict with whats already here.(Like if
    // someone had a method called "memory()", it would've been a problem)
    // Same strategy with the "__" prefixed object methods.
    const dialect = opts.dialect && opts.dialect.toLowerCase();

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
      assert(fn !== 'exports', '`exports` is a reserved wrapper name');
      assert(fn !== 'utils', '`utils` is a reserved wrapper name');
      assert(fn !== 'imports', '`imports` is a reserved wrapper method name');
      assert(fn !== 'fetch', '`fetch` is a reserved wrapper method name');
      assert(fn !== 'use', '`use` is a reserved wrapper method name');

      // validate arg types
      assert(argTypes.every(arg => !!arg), `'${fn}' has undefined types`);
      assert(areValid([returnType]), `'${fn}' has invalid types`);
      assert(areValid(argTypes), `'${fn}' has invalid types`);

      this[DATA].signatures.add({ fnName: fn, returnType, argTypes });
    });

    // exposing some methods via `.utils`
    this.utils = {
      readString:   this.__readString.bind(this),
      writeString:  this.__writeString.bind(this),
      writeArray:   this.__writeArray.bind(this),
      readStruct:   this.__readStruct.bind(this),
      writeStruct:  this.__readStruct.bind(this),
      readPointer:  this.__readPointer.bind(this),
      writePointer: this.__readPointer.bind(this),

      allocate: function(value) {
        assert('ref' in value, 'This method is for Pointer / Structs / CStrings');

        (value instanceof Pointer || value instanceof CString)
          ? this.__writePointer(value)
          : this.__writeStruct(value);
      }.bind(this),

      free: function(value) {
        ('ref' in value)
          ? this.__free(value.ref())
          : this.__free(value);
      }.bind(this),
    };

    this.exports = null;
    this.__free = this.__free.bind(this); // convenience bind
  }

  // takes an import object or a function what will produce a import object
  imports(arg, applyDefaults = true) {
    const wrap = (...args) => {
      // function to wrap is always the last argument
      const fn = args.pop();
      // two argument formats (this might be a bad idea):
      //   * with return type: wrap([returnType, [...argTypes]], fn)
      //   * no return type: wrap(arg1, arg2, ..., fn)
      //
      const types = (Array.isArray(args[0])) ? args[0] : [null, args];
      // detructure into appropriate vars
      const [returnType, argTypes = []] = types;

      assert(areValid(argTypes), `Import has invalid types: ${argTypes}`);
      assert(areValid([returnType]), `Import has invalid types: ${returnType}`);

      return (...raw) => {
        const value = fn(...raw.map((r, i) => this.__out(r, argTypes[i])));

        if (returnType && returnType !== 'void') {
          return this.__in(value, returnType);
        }
      };
    };

    const env = {
      // wasm-glue (rust)
      print:  wrap('string', str => console.log(str)),
      eprint: wrap('string', str => console.error(str)),

      trace: wrap('string', (str) => {
        throw new Error(str);
      }),

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

    const obj = (typeof arg === 'function')
      ? arg(wrap)
      : arg;

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
      const ffi_args = args.map((arg, i) => this.__in(arg, argTypes[i], stack));

      let value;

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
    assert(!!type, 'No arg type was specified for function');

    if (type === 'number' || numbers.has(type)) return value;
    if (type === 'boolean' || type === 'bool') return !!value;
    if (type === 'string') return this.__writeString(value, stack);
    if (type === 'array') return this.__writeArray(value, stack);
    if (type.isStruct) return this.__writeStruct(value);
    if (type.isPointer) return this.__writePointer(value);

    throw new Error(`Unknown type: \n${JSON.stringify(type)}`);
  }

  // wrap a variable heading out of a wasm function
  __out(value, type) {
    assert(!!type, 'No arg type was specified for function');

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

  __readString(ptr) {
    const memory = new Uint8Array(this[DATA].memory.buffer);

    if (this[DATA].isAssemblyScript) {
      const len = this.__view().getUint32(ptr, true);
      const start = ptr + 4; // header
      const end = start + (len << 1); // 2 bytes per char

      return (new TextDecoder('utf-16')).decode(memory.subarray(start, end));
    }

    // find end of string (null byte)
    let end = ptr;
    while (memory[end]) ++end;

    // subarray uses same underlying ArrayBuffer
    return (new Decoder()).decode(memory.subarray(ptr, end));
  }

  __writeString(str, stack) {
    const buf = (this[DATA].isAssemblyScript)
      ? (new Encoder('utf-16')).encode(str)
      : (new Encoder('utf-8')).encode(str);

    const len = (this[DATA].isAssemblyScript)
      ? buf.byteLength + 4  // assemblyscript header
      : buf.byteLength + 1; // null terminating byte

    const ptr = this.__allocate(len);
    if (stack) stack.push(ptr);

    const memory = new Uint8Array(this[DATA].memory.buffer);

    if (this[DATA].isAssemblyScript) {
      this.__view().setUint32(ptr, buf.byteLength, true);
      memory.set(buf, ptr + 4);
    } else {
      memory.set(buf, ptr);
      memory[ptr + len - 1] = 0;
    }

    return ptr;
  }

  __writeArray(arg, stack) {
    assert(arg instanceof ArrayBuffer || ArrayBuffer.isView(arg),
      'Argument must be an ArrayBuffer or a TypedArry (like Uint8Array)');

    const arr = (!ArrayBuffer.isView(arg)) ? new Uint8Array(arg) : arg;

    const len = (this[DATA].isAssemblyScript)
      ? arr.byteLength + 16 /* Array/ArrayBuffer header */
      : arr.byteLength;

    const ptr = this.__allocate(len);
    if (stack) stack.push(ptr);

    const memory = new Uint8Array(this[DATA].memory.buffer);
    const data = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);

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
    const struct = StructType.read(view, this.__free);

    return struct;
  }

  __writeStruct(struct) {
    // if struct has already been allocated:
    if (struct.ref()) return struct.ref();

    const StructType = struct.constructor;
    const ptr = this.__allocate(StructType.width);
    const view = this.__view(ptr, StructType.width);

    const allocPointers = (sub) => {
      sub.constructor.fields.forEach((field, name) => {
        if (field.type.isStruct && sub[name]) {
          allocPointers(sub[name]);
        }

        if (field.type.isPointer && sub[name]) {
          this.__writePointer(sub[name]);
        }
      });
    };

    allocPointers(struct);
    StructType.write(view, struct, this.__free);

    return ptr;
  }

  __readPointer(ptr, ptrType) {
    assert(!!ptrType, 'No pointer type given');

    // get the size of what the pointer points to
    const view = this.__view(ptr, ptrType.type.width);

    // handle pointer of a pointer cases (structs are pointers too here)
    if (ptrType.type.isStruct || ptrType.type.isPointer) {
      return ptrType.read(view, this.__free);
    }

    const pointer = new Pointer(ptrType.type);
    pointer.attach(view, this.__free);

    return pointer;
  }

  __writePointer(pointer) {
    if (pointer.ref()) return pointer.ref();

    // allocate space for what the pointer points to
    const addr = this.__allocate(pointer.type.width);
    const view = this.__view(addr, pointer.type.width);

    // attach wasm memory to pointer and write the pointed-to data
    pointer.attach(view, this.__free);

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
