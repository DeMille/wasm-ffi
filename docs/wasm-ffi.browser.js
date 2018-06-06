var ffi =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 5);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return types; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return CustomType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return Pointer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return StringPointer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return parseType; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__misc__ = __webpack_require__(1);



// Makes a type of a given size.
// Optional read / write methods, just gives a DataView by default.
class CustomType {
  constructor(size, opts = {}) {
    Object(__WEBPACK_IMPORTED_MODULE_0__misc__["c" /* assert */])(!isNaN(size), 'Type size must be a number, given: %s', size);

    this.width = size;
    this.alignment = ('alignment' in opts) ? opts.alignment : size;

    if (opts.read) this.read = opts.read;
    if (opts.write) this.write = opts.write;
  }

  read(view) {
    return view;
  }

  write(view, value) {
    Object(__WEBPACK_IMPORTED_MODULE_0__misc__["c" /* assert */])(value instanceof ArrayBuffer || ArrayBuffer.isView(value),
      'Value must be an `ArrayBuffer` or a `DataView` (like `Uint8Array`)');

    Object(__WEBPACK_IMPORTED_MODULE_0__misc__["f" /* toUint8Array */])(view).set(Object(__WEBPACK_IMPORTED_MODULE_0__misc__["f" /* toUint8Array */])(value));
  }
}


class SignedInteger {
  constructor(width) {
    this.width = width;
    this.alignment = width;

    const get = `getInt${width * 8}`;
    const set = `setInt${width * 8}`;

    this.read = view => view[get](0, true /* little-endian */);
    this.write = (view, value) => view[set](0, value, true /* little-endian */);
  }
}


class UnsignedInteger {
  constructor(width) {
    this.width = width;
    this.alignment = width;

    const get = `getUint${width * 8}`;
    const set = `setUint${width * 8}`;

    this.read = view => view[get](0, true /* little-endian */);
    this.write = (view, value) => view[set](0, value, true /* little-endian */);
  }
}


const types = {};

types.void = {
  width: 0,
  alignment: 0,
  read: () => null,
  write: () => {},
};

types.int8 = new SignedInteger(1);
types.int16 = new SignedInteger(2);
types.int32 = new SignedInteger(4);
types.uint8 = new UnsignedInteger(1);
types.uint16 = new UnsignedInteger(2);
types.uint32 = new UnsignedInteger(4);

types.int64 = new CustomType(8);
types.uint64 = new CustomType(8);

types.float = {
  width: 4,
  alignment: 4,

  read(view) {
    return view.getFloat32(0, true /* little-endian */);
  },

  write(view, value) {
    view.setFloat32(0, value, true /* little-endian */);
  },
};

types.double = {
  width: 8,
  alignment: 8,

  read(view) {
    return view.getFloat64(0, true /* little-endian */);
  },

  write(view, value) {
    view.setFloat64(0, value, true /* little-endian */);
  },
};

types.bool = {
  width: 1,
  alignment: 1,

  read(view) {
    return !!view.getInt8(0);
  },

  write(view, value) {
    view.setInt8(0, (!!value) ? 1 : 0);
  },
};


// A pointer to some other data type in memory
class Pointer {
  constructor(type, value) {
    this.type = parseType(type);
    this.view = null;
    this.wrapper = null;

    this._temp = value;
  }

  size() {
    return this.type.width;
  }

  commit() {
    if (this._temp) {
      this.type.write(this.view, this._temp, this.wrapper);
    }
  }

  ref() {
    return (this.view) ? this.view.byteOffset : 0;
  }

  deref() {
    Object(__WEBPACK_IMPORTED_MODULE_0__misc__["c" /* assert */])(this.view, 'Trying to deref an unallocated pointer');
    return this.type.read(this.view, this.wrapper);
  }

  set(value) {
    if (this.view) {
      this.type.write(this.view, value, this.wrapper);
    } else {
      this._temp = value;
    }
  }

  free() {
    Object(__WEBPACK_IMPORTED_MODULE_0__misc__["c" /* assert */])(this.view, 'Cant free pointer: unallocated / already freed');

    this.wrapper.free(this.ref(), this.type.width);
    this.view = null;
  }

  toString() {
    return (this.ref())
      ? `Pointer( ${this.deref()} )`
      : 'Pointer( null )';
  }
}

types.pointer = function(typedef) {
  const type = parseType(typedef);

  return {
    type,
    width: 4,
    alignment: 4,
    isPointer: true,

    read(view, wrapper) {
      const addr = view.getUint32(0, true /* little-endian */);
      const data = new DataView(view.buffer, addr, type.width);

      const pointer = new Pointer(type);
      pointer.view = data;
      pointer.wrapper = wrapper;

      return pointer;
    },

    write(view, value, wrapper) {
      Object(__WEBPACK_IMPORTED_MODULE_0__misc__["c" /* assert */])(value instanceof Pointer, `Trying to write ${value} as a pointer`);

      if (!value.ref()) wrapper.writePointer(value);
      view.setUint32(0, value.ref(), true /* little-endian */);
    },
  };
};


class StringPointer {
  constructor(value) {
    this.view = null;
    this.wrapper = null;

    this._tempStr = value;
    this._tempBuf = null;
    this._width = null;
  }

  size() {
    this._tempBuf = this.wrapper.encodeString(this._tempStr);
    this._width = this._tempBuf.byteLength;

    return this._width;
  }

  commit() {
    Object(__WEBPACK_IMPORTED_MODULE_0__misc__["c" /* assert */])(!!this.view, 'Cant commit StringPointer, no view!');

    if (this._tempBuf) {
      const memory = new Uint8Array(this.view.buffer);
      memory.set(this._tempBuf, this.view.byteOffset);
    }
  }

  ref() {
    return (this.view) ? this.view.byteOffset : 0;
  }

  deref() {
    Object(__WEBPACK_IMPORTED_MODULE_0__misc__["c" /* assert */])(this.view, 'Trying to deref an unallocated StringPointer');
    return this.wrapper.decodeString(this.view);
  }

  free() {
    Object(__WEBPACK_IMPORTED_MODULE_0__misc__["c" /* assert */])(!!this.view, 'Cant free StringPointer: unallocated / already freed');
    this.wrapper.free(this.ref(), this._width);
    this.view = null;
  }
}

Object.defineProperty(StringPointer.prototype, 'value', {
  enumerable: true,

  get() {
    return this.deref();
  },
});

Object(__WEBPACK_IMPORTED_MODULE_0__misc__["b" /* addStringFns */])(StringPointer);


types.string = {
  width: 4,
  alignment: 4,
  isPointer: true,

  read(view, wrapper) {
    const addr = view.getUint32(0, true /* little-endian */);

    const pointer =  new StringPointer();
    pointer.view = wrapper.readStringView(addr);
    pointer.wrapper = wrapper;

    return pointer;
  },

  write(view, value, wrapper) {
    if (typeof value === 'string') {
      value = new StringPointer(value);
    }

    if (!value.ref()) wrapper.writePointer(value);
    view.setUint32(0, value.ref(), true /* little-endian */);
  },
};


// An array (of known size) of sub-types.
class ArrayType {
  constructor(type, length) {
    this.type = type;
    this.length = length;

    this.width = type.width * length;
    this.alignment = type.alignment;
  }

  read(view, wrapper) {
    const arr = [];

    for (let i = 0; i <= this.length - 1; i++) {
      const subview = Object(__WEBPACK_IMPORTED_MODULE_0__misc__["g" /* vslice */])(view, i * this.type.width, this.type.width);
      arr.push(this.type.read(subview, wrapper));
    }

    return arr;
  }

  write(view, values, wrapper) {
    Object(__WEBPACK_IMPORTED_MODULE_0__misc__["c" /* assert */])(values.length === this.length,
      'Values length does not match struct array length');

    values.forEach((value, i) => {
      const subview = Object(__WEBPACK_IMPORTED_MODULE_0__misc__["g" /* vslice */])(view, i * this.type.width, this.type.width);
      this.type.write(subview, value, wrapper);
    });
  }
}


// Maps other names to base types
//
// Some questionable decisions:
//  - char = uint8 (I mean, what do you do, really)
//  - long = int32 (windows=32, linux=64, wasm is 32bit right now, so...)
//
const aliases = {
  u8: types.uint8,
  u16: types.uint16,
  u32: types.uint32,
  u64: types.uint64,
  i8: types.int8,
  i16: types.int16,
  i32: types.int32,
  i64: types.int64,
  f32: types.float,
  f64: types.double,
  char: types.uint8,
  uchar: types.uint8,
  schar: types.int8,
  short: types.int16,
  ushort: types.uint16,
  int: types.int32,
  uint: types.uint32,
  long: types.int32,
  ulong: types.uint32,
  longlong: types.uint64,
  ulonglong: types.uint64,
  size_t: types.uint32,
  usize: types.uint32,
};


function parseTypeString(str) {
  const name = str.toLowerCase();

  if (name in types) return types[name];
  if (name in aliases) return aliases[name];

  throw new Error(`Parsing unknown type '${str}'`);
}


// parse a type from some type definition.
// may be a string, an actual type, or an array of types
function parseType(typedef) {
  if (typeof typedef === 'string') {
    return parseTypeString(typedef);
  }

  if (Array.isArray(typedef)) {
    Object(__WEBPACK_IMPORTED_MODULE_0__misc__["c" /* assert */])(typedef.length === 2,
      'Array type needs 2 arguments: [type, length], given: \n%s', typedef);

    const type = parseType(typedef[0]);
    const length = typedef[1];

    return new ArrayType(type, length);
  }

  // make sure its an ok type interface
  const errMsg = "Given argument type isn't a proper 'type' interface: \n%s";
  Object(__WEBPACK_IMPORTED_MODULE_0__misc__["c" /* assert */])('width' in typedef, errMsg, typedef);
  Object(__WEBPACK_IMPORTED_MODULE_0__misc__["c" /* assert */])('alignment' in typedef, errMsg, typedef);
  Object(__WEBPACK_IMPORTED_MODULE_0__misc__["c" /* assert */])('read' in typedef, errMsg, typedef);
  Object(__WEBPACK_IMPORTED_MODULE_0__misc__["c" /* assert */])('write' in typedef, errMsg, typedef);

  return typedef;
}





/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["c"] = assert;
/* harmony export (immutable) */ __webpack_exports__["g"] = vslice;
/* harmony export (immutable) */ __webpack_exports__["f"] = toUint8Array;
/* harmony export (immutable) */ __webpack_exports__["d"] = isNil;
/* harmony export (immutable) */ __webpack_exports__["b"] = addStringFns;
/* harmony export (immutable) */ __webpack_exports__["a"] = addArrayFns;
/* harmony export (immutable) */ __webpack_exports__["e"] = makeIterable;
// simple assert, throws if assertion fails
// also matches args to %s formatters
function assert(condition, errMsg, ...args) {
  if (condition) return;
  if (!args || !args.length) throw new Error(errMsg);

  let msg = '';
  let strings;

  try {
    strings = args.map(arg => JSON.stringify(arg, null, 2));
  } catch (e) {
    throw new Error(errMsg);
  }

  errMsg.split('%s').forEach((part) => {
    msg += part;
    if (strings.length) msg += strings.pop();
  });

  throw new Error(msg);
}


// takes a subslice of a DataView
function vslice(view, start, length) {
  return new DataView(view.buffer, view.byteOffset + start, length);
}


function toUint8Array(arr) {
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}


function isNil(thing) {
  return thing === null || typeof thing === 'undefined';
}


const has = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
const isFunction = thing => (typeof thing === 'function');


function addStringFns(StringLike) {
  assert(!!has(StringLike.prototype, 'value'), 'Missing `value` property');

  Object.getOwnPropertyNames(String.prototype).forEach((prop) => {
    if (has(StringLike.prototype, prop)) return;
    if (!isFunction(String.prototype[prop])) return;

    StringLike.prototype[prop] = function(...args) {
      return this.value[prop](...args);
    };
  });
}


function addArrayFns(ArrayLike) {
  assert(!!has(ArrayLike.prototype, 'values'), 'Missing `values` property');

  Object.getOwnPropertyNames(Array.prototype).forEach((prop) => {
    if (has(ArrayLike.prototype, prop)) return;
    if (!isFunction(Array.prototype[prop])) return;

    ArrayLike.prototype[prop] = function(...args) {
      return this.values[prop](...args);
    };
  });
}


function makeIterable(ArrayLike) {
  assert(!!has(ArrayLike.prototype, 'values'), 'Missing `values` property');
  assert(!!has(ArrayLike.prototype, 'length'), 'Missing `length` property');

  ArrayLike.prototype[Symbol.iterator] = function() {
    const values = this.values;
    const length = this.length;
    let i = 0;

    return {
      next() {
        return (i < length)
          ? { value: values[i++], done: false }
          : { done: true };
      }
    };
  };
}


/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return encode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return decode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return encodeUTF8; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return decodeUTF8; });
function encodeUTF16(str) {
  const buf = new ArrayBuffer(str.length * 2); // 2 per char
  const arr = new Uint16Array(buf);

  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i);
  }

  return new Uint8Array(buf);
}

function decodeUTF16(buf) {
  const len = buf.byteLength;
  const num = (len % 2) ? ((len + 1) / 2) : (len / 2);
  const pts = new Uint16Array(buf.buffer, buf.byteOffset, num);

  return String.fromCharCode(...pts);
}

// utf8 decode/encode adapted from the buffer module
// @ github.com/feross/buffer
//
function encodeUTF8(str) {
  let codePoint;
  let leadSurrogate = null;
  let units = Infinity;

  const bytes = [];

  for (let i = 0; i < str.length; ++i) {
    codePoint = str.charCodeAt(i);

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue;

        } else if (i + 1 === str.length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue;
        }

        // valid lead
        leadSurrogate = codePoint;
        continue;
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        leadSurrogate = codePoint;
        continue;
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
    }

    leadSurrogate = null;

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break;
      bytes.push(codePoint);

    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break;
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      );

    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break;
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );

    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break;
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );

    } else {
      throw new Error('Invalid code point');
    }
  }

  return Uint8Array.from(bytes);
}


function decodeUTF8(buf) {
  const start = 0; // view.byteOffset;
  const end = buf.length;

  const pts = [];
  let i = start;

  while (i < end) {
    const firstByte = buf[i];
    let codePoint = null;

    let bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1;

    if (i + bytesPerSequence <= end) {
      let secondByte, thirdByte, fourthByte, tempCodePoint;

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }
          break;
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint;
            }
          }
          break;
        default:
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD;
      bytesPerSequence = 1;
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      pts.push(codePoint >>> 10 & 0x3FF | 0xD800);
      codePoint = 0xDC00 | codePoint & 0x3FF;
    }

    pts.push(codePoint);
    i += bytesPerSequence;
  }

  // Based on http://stackoverflow.com/a/22747272/680742, the browser with
  // the lowest limit is Chrome, with 0x10000 args.
  // We go 1 magnitude less, for safety
  const MAX = 0x1000;

  if (pts.length <= MAX) {
    return String.fromCharCode.call(String, ...pts); // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  let str = '';
  let j = 0;

  while (j < pts.length) {
    str += String.fromCharCode.call(String, ...pts.slice(j, j += MAX));
  }

  return str;
}


function encode(str, type) {
  if (type === 'utf-16') return encodeUTF16(str);

  return (typeof TextEncoder !== 'undefined')
    ? (new TextEncoder()).encode(str)
    : encodeUTF8(str);
}


function decode(str, type) {
  if (type === 'utf-16') return decodeUTF16(str);

  return (typeof TextDecoder !== 'undefined')
    ? (new TextDecoder()).decode(str)
    : decodeUTF8(str);
}





/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__types__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__misc__ = __webpack_require__(1);




const DATA = (typeof Symbol !== 'undefined')
  ? Symbol.for('struct-data')
  : '__data';


class AbstractStructType {
  constructor(obj) {
    // structs can be made with any object keys
    // hide internal info behind the data symbol so you can still have
    // struct fields like `.view`
    this[DATA] = {
      temp: {},
      view: null,
      wrapper: null,
    };

    if (obj) {
      Object.entries(obj).forEach(([key, value]) => {
        Object(__WEBPACK_IMPORTED_MODULE_1__misc__["c" /* assert */])(key in this, `Can't set value, struct missing field '${key}'`);
        this[key] = value;
      });
    }
  }

  ref() {
    return (this[DATA].view) ? this[DATA].view.byteOffset : 0;
  }

  free(internal = false) {
    Object(__WEBPACK_IMPORTED_MODULE_1__misc__["c" /* assert */])(!!this[DATA].wrapper,
      'Cant free struct, either: unallocated / already freed / sub-struct');

    // frees any pointers contained in the struct
    const freePointers = (struct) => {
      struct.constructor.fields.forEach((field, name) => {
        if (field.type.isPointer) struct[name].free();
        if (field.type.isStruct) freePointers(struct[name]);
      });
    };

    if (internal) freePointers(this);

    this[DATA].wrapper.free(this.ref(), this.constructor.width);
    this[DATA].wrapper = null;
    this[DATA].view = null;
  }

  toString() {
    let out = '{\n';

    const stringify = (struct) => {
      const fields = struct.constructor.fields;
      const proto = struct.constructor.prototype;

      fields.forEach((field, name) => {
        out += `  ${name}: ${struct[name]},\n`;
      });

      Object.getOwnPropertyNames(proto).forEach((name) => {
        if (fields.has(name)) return;

        const value = struct[name];

        if (typeof value !== 'function') {
          out += `  ${name}: ${value},\n`;
        }
      });
    };

    stringify(this);

    if (out.length <= 80) {
      out = out.replace(/\n/g, '')    // remove line breaks
               .replace(/ {2}/g, ' ') // collapse whitespace
               .replace(/,$/g, ' ');  // trailing comma
    }

    out += '}';

    return out;
  }

  dataview(name) {
    const view = this[DATA].view;
    Object(__WEBPACK_IMPORTED_MODULE_1__misc__["c" /* assert */])(!!view, "Struct hasn't been written yet, can't get dataview");

    if (!name) return view;

    const StructType = this.constructor;
    const field = StructType.fields.get(name);
    Object(__WEBPACK_IMPORTED_MODULE_1__misc__["c" /* assert */])(!!field, `Field '${name}' doesn't exist on struct`);

    return Object(__WEBPACK_IMPORTED_MODULE_1__misc__["g" /* vslice */])(view, field.offset, field.type.width);
  }

  static read(view, wrapper) {
    const StructType = this;

    const struct = new StructType();
    struct[DATA].view = view;
    struct[DATA].wrapper = wrapper;

    return struct;
  }

  static write(view, struct, wrapper) {
    const StructType = this;

    if (Object(__WEBPACK_IMPORTED_MODULE_1__misc__["d" /* isNil */])(struct) || !struct.constructor.isStruct) {
      struct = new StructType(struct);
    }

    StructType.fields.forEach((field, name) => {
      const type = field.type;
      let value = struct[name];

      if (typeof value !== 'undefined') {
        if (type.isStruct && (Object(__WEBPACK_IMPORTED_MODULE_1__misc__["d" /* isNil */])(value) || !value.constructor.isStruct)) {
          value = new type(value);
        }

        const fieldView = Object(__WEBPACK_IMPORTED_MODULE_1__misc__["g" /* vslice */])(view, field.offset, type.width);
        type.write(fieldView, value, wrapper);
      }
    });

    struct[DATA].view = view;
    struct[DATA].wrapper = wrapper;
  }
}


// Creates a new class that will create new struct instances
// (this returns a constructor)
class Struct {
  constructor(fields = {}, opt = {}) {
    // preserve field insertion order with [[OwnPropertyKeys]]
    const names = Object.getOwnPropertyNames(fields);

    // check for field name conflicts
    ['ref', 'free', 'dataview'].forEach(name =>
      Object(__WEBPACK_IMPORTED_MODULE_1__misc__["c" /* assert */])(!(names in names), `Field '${name}' is a reserved method name`));

    // keep metadata on the constructor itself
    class StructType extends AbstractStructType {}
    StructType.fields = new Map();
    StructType.packed = ('packed' in opt) ? !!opt.packed : false;
    StructType.alignment = opt.alignment || 0;
    StructType.isStruct = true;

    let offset = 0;

    // get type/size/alignment for each field
    names.forEach((name) => {
      const type = Object(__WEBPACK_IMPORTED_MODULE_0__types__["d" /* parseType */])(fields[name]);

      if (!opt.alignment && type.alignment > StructType.alignment) {
        StructType.alignment = type.alignment;
      }

      if (!StructType.packed && offset % type.alignment !== 0) {
        offset += type.alignment - (offset % type.alignment);
      }

      StructType.fields.set(name, { name, offset, type });
      offset += type.width;
    });

    StructType.width = (offset % StructType.alignment)
      ? offset + StructType.alignment - (offset % StructType.alignment)
      : offset;

    // define getter / setter behavior for each field
    // these will read / write each field to memory according to its type
    StructType.fields.forEach((field, name) => {
      Object.defineProperty(StructType.prototype, name, {
        enumerable: true,

        get() {
          if (!this[DATA].view) {
            return this[DATA].temp[name];
          }

          const view = Object(__WEBPACK_IMPORTED_MODULE_1__misc__["g" /* vslice */])(this[DATA].view, field.offset, field.type.width);
          return field.type.read(view, this[DATA].wrapper);
        },

        set(value) {
          if (!this[DATA].view) {
            this[DATA].temp[name] = value;
            return;
          }

          const view = Object(__WEBPACK_IMPORTED_MODULE_1__misc__["g" /* vslice */])(this[DATA].view, field.offset, field.type.width);
          field.type.write(view, value, this[DATA].wrapper);
        },
      });
    });

    return StructType;
  }
}


/* harmony default export */ __webpack_exports__["a"] = (Struct);


/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = demangleStack;
// Rust demangle logic adpated from Alex Crichton's ructc-demangle:
// http://alexcrichton.com/rustc-demangle/src/rustc_demangle/lib.rs.html
const symbols = [
  [/^_\$/, '$'],
  [/\$C\$/g, ','],
  [/\$SP\$/g, '@'],
  [/\$BP\$/g, '*'],
  [/\$RF\$/g, '&'],
  [/\$LT\$/g, '<'],
  [/\$GT\$/g, '>'],
  [/\$LP\$/g, '('],
  [/\$RP\$/g, ')'],
  [/\$u7e\$/g, '~'],
  [/\$u20\$/g, ' '],
  [/\$u27\$/g, "'"],
  [/\$u5b\$/g, '['],
  [/\$u5d\$/g, ']'],
  [/\$u7b\$/g, '{'],
  [/\$u7d\$/g, '}'],
  [/\$u3b\$/g, ';'],
  [/\$u2b\$/g, '+'],
  [/\$u22\$/g, '"'],
  [/\.\./g, '::'],
];

function isHash(str) {
  return str.length &&
    str[0] === 'h' &&
    str.split('').slice(1).every(char => /[0-9a-f]/i.test(char));
}

// replaces all symbols in string, returning a new string
function replaceAllSymbols(str) {
  return symbols.reduce(
    (result, [re, char]) => result.replace(re, char),
    str
  );
}

// Basic rust demangle rules:
// - starts with "ZN | _ZN | __ZN" and ends in "E"
// - name is made up of chunks. chunks are length prefixed
//
// Bails early if string isn't a valid rust mangle
//
function demangle(mangled = '') {
  const startsWith = sub => mangled.indexOf(sub) === 0;
  const endsWith = sub => mangled.slice(-1) === sub;
  let inner;

  if (!endsWith('E')) return mangled;

  if (startsWith('ZN')) inner = mangled.slice(2, -1);
  else if (startsWith('_ZN')) inner = mangled.slice(3, -1);
  else if (startsWith('__ZN')) inner = mangled.slice(4, -1);

  if (!inner) return mangled;

  const chars = inner.split('');
  const labels = [];
  let label = '';
  let digits = '';
  let length = 0;

  chars.forEach((char) => {
    // add characters to label while length marker > 0
    if (length) {
      label += char;
      length--;

    // otherwise, this label is complete and we start on the next
    } else {
      if (label) {
        labels.push(label);
        label = '';
      }

      // build length prefix, one digit at a time until we hit non-digit
      if (/[0-9]/.test(char)) {
        digits += char;
      } else {
        length = parseInt(digits, 10); // parse # the collected string
        digits = '';   // clear for next time
        label += char; // add first char to label
        length--;      // decrement
      }
    }
  });

  // make sure last label is included
  labels.push(label);

  // if the last element is a hash, exclude it so the result is more readable
  if (isHash(labels.slice(-1)[0])) labels.pop();

  // replace symbol markers in labels with the actual symbols before joining
  return labels.map(replaceAllSymbols).join('::');
}


// Tries to demangle an error stack on an Error object.
// Only demangles rust right now.
//
function demangleStack(err) {
  // matches error stack line patterns in chrome and firefox
  // chrome: "at function_name (..."
  // firefox: "function_name @ ..."
  const re = /(?:at (.+) \()|(?:(.+)<?@)/;

  // replaces matches, if found, with the demangled identifier
  err.stack = err.stack
    .split('\n')
    .map(line => line.replace(re, (_, m1, m2) => `at ${demangle(m1 || m2)} (`))
    .join('\n');

  return err;
}


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "CString", function() { return CString; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_encodeUTF8", function() { return _encodeUTF8; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_decodeUTF8", function() { return _decodeUTF8; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Wrapper__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Struct__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__demangle__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__rust__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__assemblyscript__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__types__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__encoding__ = __webpack_require__(2);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Wrapper", function() { return __WEBPACK_IMPORTED_MODULE_0__Wrapper__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "cwrap", function() { return __WEBPACK_IMPORTED_MODULE_0__Wrapper__["c"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "ccall", function() { return __WEBPACK_IMPORTED_MODULE_0__Wrapper__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Struct", function() { return __WEBPACK_IMPORTED_MODULE_1__Struct__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "types", function() { return __WEBPACK_IMPORTED_MODULE_5__types__["e"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "CustomType", function() { return __WEBPACK_IMPORTED_MODULE_5__types__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Pointer", function() { return __WEBPACK_IMPORTED_MODULE_5__types__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "StringPointer", function() { return __WEBPACK_IMPORTED_MODULE_5__types__["c"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "demangle", function() { return __WEBPACK_IMPORTED_MODULE_2__demangle__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "rust", function() { return __WEBPACK_IMPORTED_MODULE_3__rust__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "assemblyscript", function() { return __WEBPACK_IMPORTED_MODULE_4__assemblyscript__["a"]; });








const _encodeUTF8 = __WEBPACK_IMPORTED_MODULE_6__encoding__["d" /* encodeUTF8 */];
const _decodeUTF8 = __WEBPACK_IMPORTED_MODULE_6__encoding__["b" /* decodeUTF8 */];

const CString = __WEBPACK_IMPORTED_MODULE_5__types__["c" /* StringPointer */];

/* harmony default export */ __webpack_exports__["default"] = ({
  Wrapper: __WEBPACK_IMPORTED_MODULE_0__Wrapper__["a" /* Wrapper */],
  cwrap: __WEBPACK_IMPORTED_MODULE_0__Wrapper__["c" /* cwrap */],
  ccall: __WEBPACK_IMPORTED_MODULE_0__Wrapper__["b" /* ccall */],
  Struct: __WEBPACK_IMPORTED_MODULE_1__Struct__["a" /* default */],
  types: __WEBPACK_IMPORTED_MODULE_5__types__["e" /* types */],
  CustomType: __WEBPACK_IMPORTED_MODULE_5__types__["a" /* CustomType */],
  Pointer: __WEBPACK_IMPORTED_MODULE_5__types__["b" /* Pointer */],
  StringPointer: __WEBPACK_IMPORTED_MODULE_5__types__["c" /* StringPointer */],
  CString, // deprecated
  demangle: __WEBPACK_IMPORTED_MODULE_2__demangle__["a" /* default */],
  rust: __WEBPACK_IMPORTED_MODULE_3__rust__["a" /* default */],
  assemblyscript: __WEBPACK_IMPORTED_MODULE_4__assemblyscript__["a" /* default */],
  _encodeUTF8,
  _decodeUTF8,
});




/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Wrapper; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return cwrap; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return ccall; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__types__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__encoding__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__misc__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__demangle__ = __webpack_require__(4);






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
        Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(fn !== name, '`%s` is a reserved wrapper name', name));

      // validate arg types
      Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(argTypes.every(arg => !!arg), '`%s` has undefined types', fn);
      Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(areValid([returnType]), '`%s` has invalid types', fn);
      Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(areValid(argTypes), '`%s` has invalid types', fn);

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
        Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(typeof value.ref === 'function',
          "Can't allocate '%s' This method is for Pointer & Structs", value);

        (value instanceof __WEBPACK_IMPORTED_MODULE_0__types__["b" /* Pointer */] || value instanceof __WEBPACK_IMPORTED_MODULE_0__types__["c" /* StringPointer */])
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

      Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(areValid(argTypes), `Import has invalid types: ${argTypes}`);
      Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(areValid([returnType]), `Import has invalid types: ${returnType}`);

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
    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(instance instanceof WebAssembly.Instance,
      '.use(instance) requires a WebAssembly.Instance');

    this.__link(instance);
    return this;
  }

  __link(instance) {
    const memory = this[DATA].memory ||
                   instance.exports.memory ||
                   (this[DATA].imports.env && this[DATA].imports.env.memory);

    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(!!memory, '' +
      'Wrapper needs access to your WebAssemmbly memory. It looks for this in' +
      'either your `imports.env.memory` or `exports.env.memory`. If you don\'t' +
      'use either, you need to add it in the options with `new Wrapper`');

    this.exports = instance.exports;
    this[DATA].instance = instance;
    this[DATA].memory = memory;

    this[DATA].signatures.forEach(({ fnName, returnType, argTypes }) => {
      const fn = this.exports[fnName];
      Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(!!fn, `Fn '${fnName}' missing from wasm exports`);

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
        throw Object(__WEBPACK_IMPORTED_MODULE_3__demangle__["a" /* default */])(err);
      }

      stack.forEach(ptr => this.__free(ptr));

      if (returnType && returnType !== 'void') {
        return this.__out(value, returnType);
      }
    };
  }

  // wrap a variable heading into a wasm function
  __in(value, type, stack) {
    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(!!type, 'No arg type was specified for this function');

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
    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(!!type, 'No arg type was specified for this function');

    if (type === 'number' || numbers.has(type)) return value;
    if (type === 'boolean' || type === 'bool') return !!value;
    if (type === 'string') return this.__readString(value);
    if (type.isStruct) return this.__readStruct(value, type);
    if (type.isPointer) return this.__readPointer(value, type);

    throw new Error(`Unknown type: \n${JSON.stringify(type)}`);
  }

  __allocate(size) {
    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(!!this.exports.allocate && !!this.exports.deallocate,
      "Missing allocate/deallocate fns in wasm exports, can't allocate memory");

    const ptr = this.exports.allocate(size);
    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(!!ptr, 'allocate failed');

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
      ? Object(__WEBPACK_IMPORTED_MODULE_1__encoding__["c" /* encode */])(str, 'utf-16')
      : Object(__WEBPACK_IMPORTED_MODULE_1__encoding__["c" /* encode */])(str);

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
    const buf = Object(__WEBPACK_IMPORTED_MODULE_2__misc__["f" /* toUint8Array */])(view);

    return (this[DATA].isAssemblyScript)
      ? Object(__WEBPACK_IMPORTED_MODULE_1__encoding__["a" /* decode */])(buf.subarray(4), 'utf-16')
      : Object(__WEBPACK_IMPORTED_MODULE_1__encoding__["a" /* decode */])(buf.subarray(0, -1));
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
    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(arg instanceof ArrayBuffer || ArrayBuffer.isView(arg),
      'Argument must be an ArrayBuffer or a TypedArray (like Uint8Array)');

    const arr = (!ArrayBuffer.isView(arg)) ? new Uint8Array(arg) : arg;

    const len = (this[DATA].isAssemblyScript)
      ? arr.byteLength + 16 /* Array/ArrayBuffer header */
      : arr.byteLength;

    const ptr = this.__allocate(len);
    if (stack) stack.push(ptr);

    const memory = new Uint8Array(this[DATA].memory.buffer);
    const data = Object(__WEBPACK_IMPORTED_MODULE_2__misc__["f" /* toUint8Array */])(arr);

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
    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(!!StructType, 'No struct StructType given');

    const view = this.__view(ptr, StructType.width);
    const struct = StructType.read(view, this.utils);

    return struct;
  }

  __writeStruct(value, Type) {
    // if struct has already been allocated:
    if (!Object(__WEBPACK_IMPORTED_MODULE_2__misc__["d" /* isNil */])(value) && value.ref && value.ref()) return value.ref();

    const StructType = Type || value.constructor;
    const ptr = this.__allocate(StructType.width);
    const view = this.__view(ptr, StructType.width);

    StructType.write(view, value, this.utils);

    return ptr;
  }

  __readPointer(ptr, ptrType) {
    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(!!ptrType, 'No pointer type given');

    // get the size of what the pointer points to
    const view = this.__view(ptr, ptrType.type.width);

    // handle pointer of a pointer cases (structs are pointers too here)
    if (ptrType.type.isStruct || ptrType.type.isPointer) {
      return ptrType.read(view, this.utils);
    }

    const pointer = new __WEBPACK_IMPORTED_MODULE_0__types__["b" /* Pointer */](ptrType.type);
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
  Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(instance instanceof WebAssembly.Instance,
    '.cwrap() requires a ready WebAssembly.Instance');

  const wrapper = new Wrapper({ [fnName]: [returnType, argTypes] });
  wrapper.use(instance);

  return wrapper[fnName].bind(wrapper);
}

function ccall(instance, fnName, returnType = null, argTypes = [], ...args) {
  Object(__WEBPACK_IMPORTED_MODULE_2__misc__["c" /* assert */])(instance instanceof WebAssembly.Instance,
    '.ccall() requires a ready WebAssembly.Instance');

  const wrapper = new Wrapper({ [fnName]: [returnType, argTypes] });
  wrapper.use(instance);

  return wrapper[fnName].call(wrapper, ...args);
}





/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Struct__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__types__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__encoding__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__misc__ = __webpack_require__(1);






// get the symbol for struct-data since we need access here
const DATA = (typeof Symbol !== 'undefined')
  ? Symbol.for('struct-data')
  : '__data';


function RustTuple(tupleTypes, values) {
  const fields = {};

  tupleTypes.forEach((type, i) => {
    fields[i] = Object(__WEBPACK_IMPORTED_MODULE_1__types__["d" /* parseType */])(type);
  });

  const Tuple = new __WEBPACK_IMPORTED_MODULE_0__Struct__["a" /* default */](fields);

  return (values)
    ? new Tuple(values)
    : Tuple;
}


function RustVector(typedef, initialValues) {
  const type = Object(__WEBPACK_IMPORTED_MODULE_1__types__["d" /* parseType */])(typedef);

  const Base = new __WEBPACK_IMPORTED_MODULE_0__Struct__["a" /* default */]({
    ptr: __WEBPACK_IMPORTED_MODULE_1__types__["e" /* types */].pointer(type),
    cap: 'usize',
    length: 'usize',
    /* values */
  });

  Object.defineProperty(Base.prototype, 'values', {
    enumerable: true,

    get() {
      const memory = this[DATA].view.buffer;
      const wrapper = this[DATA].wrapper;

      const arrayType = Object(__WEBPACK_IMPORTED_MODULE_1__types__["d" /* parseType */])([type, this.length]);
      const view = new DataView(memory, this.ptr.ref(), arrayType.width);

      return arrayType.read(view, wrapper);
    },

    set(values) {
      this.ptr = new __WEBPACK_IMPORTED_MODULE_1__types__["b" /* Pointer */]([type, values.length], values);
      this.length = values.length;
      this.cap = values.length;
    },
  });

  Object(__WEBPACK_IMPORTED_MODULE_3__misc__["a" /* addArrayFns */])(Base);
  Object(__WEBPACK_IMPORTED_MODULE_3__misc__["e" /* makeIterable */])(Base);

  class Vector extends Base {
    constructor(values) {
      super();
      if (values) this.values = values;
    }

    free() {
      super.free(true); // free ptr data
    }
  }

  return (initialValues)
    ? new Vector(initialValues)
    : Vector;
}


function RustSlice(typedef, initialValues) {
  const type = Object(__WEBPACK_IMPORTED_MODULE_1__types__["d" /* parseType */])(typedef);

  const Base = new __WEBPACK_IMPORTED_MODULE_0__Struct__["a" /* default */]({
    ptr: __WEBPACK_IMPORTED_MODULE_1__types__["e" /* types */].pointer(type),
    length: 'usize',
    /* values */
  });

  Object.defineProperty(Base.prototype, 'values', {
    enumerable: true,

    get() {
      const memory = this[DATA].view.buffer;
      const wrapper = this[DATA].wrapper;

      const arrayType = Object(__WEBPACK_IMPORTED_MODULE_1__types__["d" /* parseType */])([type, this.length]);
      const view = new DataView(memory, this.ptr.ref(), arrayType.width);

      return arrayType.read(view, wrapper);
    },

    set(values) {
      this.ptr = new __WEBPACK_IMPORTED_MODULE_1__types__["b" /* Pointer */]([type, values.length], values);
      this.length = values.length;
    },
  });

  Object(__WEBPACK_IMPORTED_MODULE_3__misc__["a" /* addArrayFns */])(Base);
  Object(__WEBPACK_IMPORTED_MODULE_3__misc__["e" /* makeIterable */])(Base);

  class Slice extends Base {
    constructor(values) {
      super();
      if (values) this.values = values;
    }

    free() {
      super.free(true); // free ptr data
    }
  }

  return (initialValues)
    ? new Slice(initialValues)
    : Slice;
}


function RustString() {
  const Base = new __WEBPACK_IMPORTED_MODULE_0__Struct__["a" /* default */]({
    ptr: __WEBPACK_IMPORTED_MODULE_1__types__["e" /* types */].pointer('u8'),
    length: 'usize',
    cap: 'usize',
    /* value */
  });

  Object.defineProperty(Base.prototype, 'value', {
    enumerable: true,

    get() {
      const memory = this[DATA].view.buffer;
      const buf = new Uint8Array(memory, this.ptr.ref(), this.length);

      return Object(__WEBPACK_IMPORTED_MODULE_2__encoding__["a" /* decode */])(buf);
    },

    set(str) {
      const buf = Object(__WEBPACK_IMPORTED_MODULE_2__encoding__["c" /* encode */])(str);

      this.ptr = new __WEBPACK_IMPORTED_MODULE_1__types__["b" /* Pointer */](['u8', buf.length], buf);
      this.length = buf.length;
      this.cap    = buf.length;
    },
  });

  Object(__WEBPACK_IMPORTED_MODULE_3__misc__["b" /* addStringFns */])(Base);

  class _RustString extends Base {
    constructor(value) {
      super();
      if (value) this.value = value;
    }

    free() {
      super.free(true); // free ptr data
    }
  }

  return _RustString;
}


function RustStr() {
  const Base = new __WEBPACK_IMPORTED_MODULE_0__Struct__["a" /* default */]({
    ptr: __WEBPACK_IMPORTED_MODULE_1__types__["e" /* types */].pointer('u8'),
    length: 'usize',
    /* value */
  });

  Object.defineProperty(Base.prototype, 'value', {
    enumerable: true,

    get() {
      const memory = this[DATA].view.buffer;
      const buf = new Uint8Array(memory, this.ptr.ref(), this.length);

      return Object(__WEBPACK_IMPORTED_MODULE_2__encoding__["a" /* decode */])(buf);
    },

    set(str) {
      const buf = Object(__WEBPACK_IMPORTED_MODULE_2__encoding__["c" /* encode */])(str);

      this.ptr = new __WEBPACK_IMPORTED_MODULE_1__types__["b" /* Pointer */](['u8', buf.length], buf);
      this.length = buf.length;
    },
  });

  Object(__WEBPACK_IMPORTED_MODULE_3__misc__["b" /* addStringFns */])(Base);

  class _RustStr extends Base {
    constructor(value) {
      super();
      if (value) this.value = value;
    }

    free() {
      super.free(true); // free ptr data
    }
  }

  return _RustStr;
}


function RustOption(typedef, isNonNullable = false, tagSize) {
  const type = Object(__WEBPACK_IMPORTED_MODULE_1__types__["d" /* parseType */])(typedef);
  let discriminant;

  if (tagSize) discriminant = __WEBPACK_IMPORTED_MODULE_1__types__["e" /* types */][`uint${tagSize * 8}`];
  else if (type.alignment === 1) discriminant = 'uint8';
  else if (type.alignment === 2) discriminant = 'uint16';
  else discriminant = 'uint32';

  const fields = (isNonNullable)
    ? { value: type }
    : { discriminant, value: type };

  const Base = new __WEBPACK_IMPORTED_MODULE_0__Struct__["a" /* default */](fields);

  class OptionType extends Base {
    constructor(value) {
      super();
      this.value = value;
      this.discriminant = (Object(__WEBPACK_IMPORTED_MODULE_3__misc__["d" /* isNil */])(value)) ? 0 : 1;
    }

    static some(value) {
      return new OptionType(value);
    }

    static none() {
      return new OptionType();
    }

    isSome() {
      return ('discriminant' in fields) ? !!this.discriminant : !!this.value;
    }

    isNone() {
      return !this.isSome();
    }

    expect(msg) {
      if (!this.isSome()) throw new Error(msg);
      return this.value;
    }

    unwrap() {
      if (!this.isSome()) throw new Error('Error unwrapping none');
      return this.value;
    }

    unwrapOr(defaultValue) {
      return (this.isSome()) ? this.value : defaultValue;
    }

    unwrapOrElse(fn) {
      return (this.isSome()) ? this.value : fn();
    }
  }

  return OptionType;
}


function RustEnum(obj, tagSize = 4) {
  const variants = Object.getOwnPropertyNames(obj);
  const vtypes = variants.map(name => Object(__WEBPACK_IMPORTED_MODULE_1__types__["d" /* parseType */])(obj[name]));
  const discriminant = __WEBPACK_IMPORTED_MODULE_1__types__["e" /* types */][`uint${tagSize * 8}`];

  const StructType = new __WEBPACK_IMPORTED_MODULE_0__Struct__["a" /* default */]({
    discriminant,
    /* value */
  });

  class Enum extends StructType {
    constructor(variant) {
      super();
      if (variant) this._set(variant);
    }

    _set(variant) {
      Object(__WEBPACK_IMPORTED_MODULE_3__misc__["c" /* assert */])(Object.keys(variant).length === 1, 'Enum value must be a variant');

      const [name, value] = Object.entries(variant)[0];

      this.discriminant = variants.indexOf(name);
      this.value = value;
    }

    tag() {
      const tag = this.discriminant;
      Object(__WEBPACK_IMPORTED_MODULE_3__misc__["c" /* assert */])(tag <= variants.length, 'Enum discriminant > than # of variants');
      return tag;
    }

    free(internal = false) {
      const type = vtypes[this.tag()];

      if (internal && type.isPointer || type.isStruct) {
        this.value.free(internal);
      }

      this[DATA].wrapper.free(this.ref(), Enum.width);
      this[DATA].wrapper = null;
      this[DATA].view = null;
    }

    name() {
      return variants[this.tag()];
    }

    is(name) {
      return (variants.indexOf(name) === this.tag());
    }

    match(arms) {
      const name = variants[this.tag()];
      const val = this.value;

      if (name in arms) {
        return (typeof arms[name] === 'function') ? arms[name](val) : arms[name];
      }

      if ('_' in arms) {
        return (typeof arms._ === 'function') ? arms._(val) : arms._;
      }
    }

    static write(view, struct, wrapper) {
      if (Object(__WEBPACK_IMPORTED_MODULE_3__misc__["d" /* isNil */])(struct) || !struct.constructor.isStruct) {
        struct = new Enum(struct);
      }

      const tag = struct.tag();
      const type = vtypes[tag];
      let value = (struct.ref()) ? struct.value : struct[DATA].temp.value;

      if (type.isStruct && (Object(__WEBPACK_IMPORTED_MODULE_3__misc__["d" /* isNil */])(value) || !value.constructor.isStruct)) {
        value = new type(value);
      }

      const field_1 = Object(__WEBPACK_IMPORTED_MODULE_3__misc__["g" /* vslice */])(view, 0, discriminant.width);
      discriminant.write(field_1, tag);

      const field_2 = Object(__WEBPACK_IMPORTED_MODULE_3__misc__["g" /* vslice */])(view, discriminant.width, type.width);
      type.write(field_2, value, wrapper);

      struct[DATA].view = view;
      struct[DATA].wrapper = wrapper;
    }
  }

  Object.defineProperty(Enum.prototype, 'value', {
    enumerable: true,

    get() {
      const memory = this[DATA].view.buffer;
      const wrapper = this[DATA].wrapper;

      const type = vtypes[this.tag()];
      const addr = this.ref() + discriminant.width;
      const view = new DataView(memory, addr, type.width);

      return type.read(view, wrapper);
    },

    set(value) {
      this[DATA].temp.value = value;
    },
  });

  const width = discriminant.width + Math.max(...vtypes.map(t => t.width));
  const align = Math.max(...vtypes.map(t => t.alignment), discriminant.alignment);

  Enum.width = (width % align)
    ? width + align - (width % align)
    : width;

  return Enum;
}


const rust = {
  tuple:  RustTuple,
  vector: RustVector,
  slice:  RustSlice,
  string: RustString(),
  str:    RustStr(),
  enum:   RustEnum,
  option: RustOption,

  some: function ctor(type, value, ...opts) {
    return new (RustOption(type, ...opts))(value);
  },
  none: function ctor(type, ...opts) {
    return new (RustOption(type, ...opts))();
  },

  // deprecated
  Tuple: RustTuple,
  Vector: RustVector,
  Slice: RustSlice,
  String: RustString(),
  Str: RustStr(),
  Option: function ctor(type, value, ...opts) {
    return new (RustOption(type, ...opts))(value);
  },
  Some: function ctor(type, value, ...opts) {
    return new (RustOption(type, ...opts))(value);
  },
  None: function ctor(type, ...opts) {
    return new (RustOption(type, ...opts))();
  },
};


/* harmony default export */ __webpack_exports__["a"] = (rust);


/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Struct__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__types__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__misc__ = __webpack_require__(1);





// get the symbol for struct-data since we need access here
const DATA = (typeof Symbol !== 'undefined')
  ? Symbol.for('struct-data')
  : '__data';


function ASArrayBuffer(typedef, n) {
  const type = Object(__WEBPACK_IMPORTED_MODULE_1__types__["d" /* parseType */])(typedef);

  return new __WEBPACK_IMPORTED_MODULE_0__Struct__["a" /* default */]({
    byteLength: 'usize',
    _:          'usize', // allocator alignment?
    values:     [type, n],
  });
}


function ASArray(typedef, initialValues) {
  const type = Object(__WEBPACK_IMPORTED_MODULE_1__types__["d" /* parseType */])(typedef);

  const Base = new __WEBPACK_IMPORTED_MODULE_0__Struct__["a" /* default */]({
    ptr: __WEBPACK_IMPORTED_MODULE_1__types__["e" /* types */].pointer('void'),
    length: 'usize',
    /* buffer */
    /* values */
  });

  Object.defineProperty(Base.prototype, 'buffer', {
    enumerable: true,

    get() {
      const memory = this[DATA].view.buffer;
      const wrapper = this[DATA].wrapper;

      const AB = new ASArrayBuffer(type, this.length);
      const view = new DataView(memory, this.ptr.ref(), AB.width);

      return AB.read(view, wrapper);
    },
  });

  Object.defineProperty(Base.prototype, 'values', {
    enumerable: true,

    get() {
      return this.buffer.values;
    },

    set(values) {
      const n = values.length;
      const byteLength = n * type.width;

      const AB = new ASArrayBuffer(type, n);
      const buf = new AB({ byteLength, values });

      this.ptr = new __WEBPACK_IMPORTED_MODULE_1__types__["b" /* Pointer */](AB, buf);
      this.length = n;
    },
  });

  Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* addArrayFns */])(Base);
  Object(__WEBPACK_IMPORTED_MODULE_2__misc__["e" /* makeIterable */])(Base);

  class _Array extends Base {
    constructor(values) {
      super();
      if (values) this.values = values;
    }

    free() {
      super.free(true); // free buffer_ too
    }

    dataview(field) {
      if (field === 'buffer') return this.buffer.dataview();
      if (field === 'values') return this.buffer.dataview('values');

      return super.dataview(field);
    }
  }

  return (initialValues)
    ? new _Array(initialValues)
    : _Array;
}


/* harmony default export */ __webpack_exports__["a"] = ({
  array: ASArray,
});


/***/ })
/******/ ]);