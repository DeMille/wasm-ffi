module.exports =
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
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return CustomType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return Pointer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return CString; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return parseType; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__encoding__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__misc__ = __webpack_require__(2);




// Makes a type of a given size.
// Optional read / write methods, just gives a DataView by default.
class CustomType {
  constructor(size, opts = {}) {
    Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])(!isNaN(size), 'Type size must be a number, given: %s', size);

    this.width = size;
    this.alignment = ('alignment' in opts) ? opts.alignment : size;

    if (opts.read) this.read = opts.read;
    if (opts.write) this.write = opts.write;
  }

  read(view) {
    return view;
  }

  write(view, value) {
    Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])(value instanceof ArrayBuffer || ArrayBuffer.isView(value),
      'Value must be an `ArrayBuffer` or a `DataView` (like `Uint8Array`)');

    const buf = (ArrayBuffer.isView(value))
      ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
      : new Uint8Array(value);

    const uint8 = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);

    uint8.set(buf);
  }
}


class Signed {
  constructor(width) {
    this.width = width;
    this.alignment = width;

    const get = `getInt${width * 8}`;
    const set = `setInt${width * 8}`;

    this.read = view => view[get](0, true /* little-endian */);
    this.write = (view, value) => view[set](0, value, true /* little-endian */);
  }
}


class Unsigned {
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

types.int8 = new Signed(1);
types.int16 = new Signed(2);
types.int32 = new Signed(4);
types.uint8 = new Unsigned(1);
types.uint16 = new Unsigned(2);
types.uint32 = new Unsigned(4);

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
    this._free = null;
    this._temp = value;
  }

  attach(view, free) {
    this.view = view;
    this._free = free;

    if (this._temp) this.set(this._temp);
  }

  ref() {
    return (this.view) ? this.view.byteOffset : 0;
  }

  deref() {
    Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])(this.view, 'Trying to deref an unallocated pointer');
    return this.type.read(this.view, this._free);
  }

  set(value) {
    if (this.view) {
      this.type.write(this.view, value, this._free);
    } else {
      this._temp = value;
    }
  }

  free() {
    Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])(this.view, 'Cant free pointer: unallocated / already freed');

    this._free(this.ref(), this.type.width);
    this._free = null;
    this.view = null;
  }
}

types.pointer = function(typedef) {
  const type = parseType(typedef);

  return {
    type,
    width: 4,
    alignment: 4,
    isPointer: true,

    read(view, free) {
      const addr = view.getUint32(0, true /* little-endian */);

      const pointer = new Pointer(type);
      pointer.view = new DataView(view.buffer, addr, type.width);
      pointer._free = free;

      return pointer;
    },

    write(view, value) {
      Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])(value instanceof Pointer, `Trying to write ${value} as a pointer`);
      Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])(value.ref(), 'Cant write pointer, hasnt been allocated yet');
      view.setUint32(0, value.ref(), true /* little-endian */);
    },
  };
};


// A pointer to a null-terminated string
class CString {
  constructor(value, free) {
    this.type = {
      isPointer: true,
      width: null,
    };
    this.view = null;
    this._temp = null;
    this._free = null;

    if (typeof value === 'string') {
      this._temp = (new __WEBPACK_IMPORTED_MODULE_0__encoding__["b" /* Encoder */]()).encode(value);
      this.type.width = this._temp.byteLength + 1;
    }

    if (value instanceof DataView) {
      this.view = value;
      this._free = free;
      this.type.width = value.byteLength;
    }
  }

  attach(view, free) {
    this.view = view;
    this._free = free;

    if (this._temp) {
      const memory = new Uint8Array(view.buffer);

      memory.set(this._temp, view.byteOffset);
      memory[view.byteOffset + this.type.width - 1] = 0;
    }
  }

  ref() {
    return (this.view) ? this.view.byteOffset : 0;
  }

  deref() {
    Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])(this.view, 'Trying to deref an unallocated CString');

    const memory = new Uint8Array(this.view.buffer);
    const addr = this.view.byteOffset;
    const end = addr + this.type.width - 1;

    // `subarray` uses the same underlying ArrayBuffer
    const buf = new Uint8Array(memory.subarray(addr, end));
    const str = (new __WEBPACK_IMPORTED_MODULE_0__encoding__["a" /* Decoder */]()).decode(buf);

    return str;
  }

  free() {
    Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])(!!this.view, 'Cant free cstring: unallocated / already freed');

    this._free(this.ref(), this.type.width);
    this._free = null;
    this.view = null;
  }

  valueOf() {
    return this.deref();
  }

  toString() {
    return this.deref();
  }
}

types.string = {
  width: 4,
  alignment: 4,
  isPointer: true,

  read(view, free) {
    const memory = new Uint8Array(view.buffer);
    const addr = view.getUint32(0, true /* little-endian */);
    let end = addr;

    // find null byte
    while (memory[end]) ++end;

    const length = end - addr + 1;
    const data = new DataView(view.buffer, addr, length);

    return new CString(data, free);
  },

  write(view, value) {
    Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])(value instanceof CString, 'value must be a `CString`');
    Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])(value.ref(), 'Cant write CString, hasnt been allocated yet');
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

  read(view, free) {
    const arr = [];

    for (let i = 0; i <= this.length - 1; i++) {
      const subview = Object(__WEBPACK_IMPORTED_MODULE_1__misc__["b" /* vslice */])(view, i * this.type.width, this.type.width);
      arr.push(this.type.read(subview, free));
    }

    return arr;
  }

  write(view, values) {
    Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])(values.length === this.length,
      'Values length does not match struct array length');

    values.forEach((value, i) => {
      const subview = Object(__WEBPACK_IMPORTED_MODULE_1__misc__["b" /* vslice */])(view, i * this.type.width, this.type.width);
      this.type.write(subview, value);
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
    Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])(typedef.length === 2,
      'Array type needs 2 arguments: [type, length], given: \n%s', typedef);

    const type = parseType(typedef[0]);
    const length = typedef[1];

    return new ArrayType(type, length);
  }

  // make sure its an ok type interface
  const errMsg = "Given argument type isn't a proper 'type' interface: \n%s";
  Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])('width' in typedef, errMsg, typedef);
  Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])('alignment' in typedef, errMsg, typedef);
  Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])('read' in typedef, errMsg, typedef);
  Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])('write' in typedef, errMsg, typedef);

  return typedef;
}





/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return Encoder; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Decoder; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return encodeUTF8; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return decodeUTF8; });
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


class EncoderPolyfill {
  encode(str) {
    return encodeUTF8(str);
  }
}

class DecoderPolyfill {
  decode(view) {
    return decodeUTF8(view);
  }
}


const Encoder = (typeof TextEncoder !== 'undefined')
  ? TextEncoder
  : EncoderPolyfill;

const Decoder = (typeof TextDecoder !== 'undefined')
  ? TextDecoder
  : DecoderPolyfill;





/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = assert;
/* harmony export (immutable) */ __webpack_exports__["b"] = vslice;
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


/***/ }),
/* 3 */
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
  if (label) labels.push(label);

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
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__types__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__misc__ = __webpack_require__(2);




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
      free: null,
    };

    if (obj) {
      Object.entries(obj).forEach(([key, value]) => {
        // check for name conflicts
        Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])(key in this, `Struct missing field '${key}'`);
        Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])(key !== 'ref', 'Field `ref` is a reserved method name');
        Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])(key !== 'free', 'Field `free` is a reserved method name');
        // this should trigger the get/setter behavior
        this[key] = value;
      });
    }
  }

  ref() {
    return (this[DATA].view) ? this[DATA].view.byteOffset : 0;
  }

  free(recursive = false) {
    Object(__WEBPACK_IMPORTED_MODULE_1__misc__["a" /* assert */])(!!this[DATA].free,
      'Cant free struct, either: unallocated / already freed / sub-struct');

    // frees any pointers contained in the struct
    const freePointers = (struct) => {
      struct.constructor.fields.forEach((field, name) => {
        if (field.type.isPointer) struct[name].free();
        if (field.type.isStruct) freePointers(struct[name]);
      });
    };

    if (recursive) freePointers(this);

    this[DATA].free(this.ref(), this.constructor.width);
    this[DATA].free = null;
    this[DATA].view = null;
  }

  toString() {
    let out = '{\n';

    const stringify = (struct) => {
      struct.constructor.fields.forEach((field, name) => {
        out += `  ${name}: `;

        if (field.type.isPointer) out += struct[name].deref();
        else out += struct[name].toString();

        out += ',\n';
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

  static read(view, free) {
    const StructType = this;

    const struct = new StructType();
    struct[DATA].view = view;
    struct[DATA].free = free;

    return struct;
  }

  static write(view, struct, free) {
    const StructType = this;

    StructType.fields.forEach((field, name) => {
      const value = struct[name];

      if (typeof value !== 'undefined') {
        const fieldView = Object(__WEBPACK_IMPORTED_MODULE_1__misc__["b" /* vslice */])(view, field.offset, field.type.width);
        field.type.write(fieldView, value);
      }
    });

    struct[DATA].view = view;
    if (free) struct[DATA].free = free;
  }
}


// Creates a new class that will create new struct instances
// (this returns a constructor)
class Struct {
  constructor(fields = {}, opt = {}) {
    class StructType extends AbstractStructType {}

    // keep metadata on the struct constructor itself
    StructType.fields = new Map();
    StructType.packed = ('packed' in opt) ? !!opt.packed : false;
    StructType.alignment = opt.alignment || 0;
    StructType.isStruct = true;

    let offset = 0;

    // preserve field insertion order with [[OwnPropertyKeys]]
    Object.getOwnPropertyNames(fields).forEach((name) => {
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

          const view = Object(__WEBPACK_IMPORTED_MODULE_1__misc__["b" /* vslice */])(this[DATA].view, field.offset, field.type.width);
          return field.type.read(view, this[DATA].free);
        },

        set(value) {
          // fudging for ease of use:
          if (typeof value === 'string' && field.type === __WEBPACK_IMPORTED_MODULE_0__types__["e" /* types */].string) {
            value = new __WEBPACK_IMPORTED_MODULE_0__types__["a" /* CString */](value);
          }

          if (!this[DATA].view) {
            this[DATA].temp[name] = value;
            return;
          }

          const view = Object(__WEBPACK_IMPORTED_MODULE_1__misc__["b" /* vslice */])(this[DATA].view, field.offset, field.type.width);
          field.type.write(view, value);
        },
      });
    });

    return StructType;
  }
}


/* harmony default export */ __webpack_exports__["a"] = (Struct);


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_encodeUTF8", function() { return _encodeUTF8; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_decodeUTF8", function() { return _decodeUTF8; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Wrapper__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Struct__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__demangle__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__types__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__rust__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__encoding__ = __webpack_require__(1);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Wrapper", function() { return __WEBPACK_IMPORTED_MODULE_0__Wrapper__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "cwrap", function() { return __WEBPACK_IMPORTED_MODULE_0__Wrapper__["c"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "ccall", function() { return __WEBPACK_IMPORTED_MODULE_0__Wrapper__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Struct", function() { return __WEBPACK_IMPORTED_MODULE_1__Struct__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "types", function() { return __WEBPACK_IMPORTED_MODULE_3__types__["e"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Pointer", function() { return __WEBPACK_IMPORTED_MODULE_3__types__["c"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "CustomType", function() { return __WEBPACK_IMPORTED_MODULE_3__types__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "CString", function() { return __WEBPACK_IMPORTED_MODULE_3__types__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "demangle", function() { return __WEBPACK_IMPORTED_MODULE_2__demangle__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "rust", function() { return __WEBPACK_IMPORTED_MODULE_4__rust__["a"]; });







const _encodeUTF8 = __WEBPACK_IMPORTED_MODULE_5__encoding__["d" /* encodeUTF8 */];
const _decodeUTF8 = __WEBPACK_IMPORTED_MODULE_5__encoding__["c" /* decodeUTF8 */];


/* harmony default export */ __webpack_exports__["default"] = ({
  Wrapper: __WEBPACK_IMPORTED_MODULE_0__Wrapper__["a" /* Wrapper */],
  cwrap: __WEBPACK_IMPORTED_MODULE_0__Wrapper__["c" /* cwrap */],
  ccall: __WEBPACK_IMPORTED_MODULE_0__Wrapper__["b" /* ccall */],
  Struct: __WEBPACK_IMPORTED_MODULE_1__Struct__["a" /* default */],
  types: __WEBPACK_IMPORTED_MODULE_3__types__["e" /* types */],
  Pointer: __WEBPACK_IMPORTED_MODULE_3__types__["c" /* Pointer */],
  CustomType: __WEBPACK_IMPORTED_MODULE_3__types__["b" /* CustomType */],
  CString: __WEBPACK_IMPORTED_MODULE_3__types__["a" /* CString */],
  demangle: __WEBPACK_IMPORTED_MODULE_2__demangle__["a" /* default */],
  rust: __WEBPACK_IMPORTED_MODULE_4__rust__["a" /* default */],
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
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__encoding__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__misc__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__demangle__ = __webpack_require__(3);






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
      Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(fn !== 'exports', '`exports` is a reserved wrapper name');
      Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(fn !== 'utils', '`utils` is a reserved wrapper name');
      Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(fn !== 'imports', '`imports` is a reserved wrapper method name');
      Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(fn !== 'fetch', '`fetch` is a reserved wrapper method name');
      Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(fn !== 'use', '`use` is a reserved wrapper method name');

      // validate arg types
      Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(argTypes.every(arg => !!arg), `'${fn}' has undefined types`);
      Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(areValid([returnType]), `'${fn}' has invalid types`);
      Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(areValid(argTypes), `'${fn}' has invalid types`);

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
        Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])('ref' in value, 'This method is for Pointer / Structs / CStrings');

        (value instanceof __WEBPACK_IMPORTED_MODULE_0__types__["c" /* Pointer */] || value instanceof __WEBPACK_IMPORTED_MODULE_0__types__["a" /* CString */])
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

      Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(areValid(argTypes), `Import has invalid types: ${argTypes}`);
      Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(areValid([returnType]), `Import has invalid types: ${returnType}`);

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
    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(instance instanceof WebAssembly.Instance,
      '.use(instance) requires a WebAssembly.Instance');

    this.__link(instance);
    return this;
  }

  __link(instance) {
    const memory = this[DATA].memory ||
                   instance.exports.memory ||
                   (this[DATA].imports.env && this[DATA].imports.env.memory);

    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(!!memory, '' +
      'Wrapper needs access to your WebAssemmbly memory. It looks for this in' +
      'either your `imports.env.memory` or `exports.env.memory`. If you don\'t' +
      'use either, you need to add it in the options with `new Wrapper`');

    this.exports = instance.exports;
    this[DATA].instance = instance;
    this[DATA].memory = memory;

    this[DATA].signatures.forEach(({ fnName, returnType, argTypes }) => {
      const fn = this.exports[fnName];
      Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(!!fn, `Fn '${fnName}' missing from wasm exports`);

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
    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(!!type, 'No arg type was specified for function');

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
    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(!!type, 'No arg type was specified for function');

    if (type === 'number' || numbers.has(type)) return value;
    if (type === 'boolean' || type === 'bool') return !!value;
    if (type === 'string') return this.__readString(value);
    if (type.isStruct) return this.__readStruct(value, type);
    if (type.isPointer) return this.__readPointer(value, type);

    throw new Error(`Unknown type: \n${JSON.stringify(type)}`);
  }

  __allocate(size) {
    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(!!this.exports.allocate && !!this.exports.deallocate,
      "Missing allocate/deallocate fns in wasm exports, can't allocate memory");

    const ptr = this.exports.allocate(size);
    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(!!ptr, 'allocate failed');

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
    return (new __WEBPACK_IMPORTED_MODULE_1__encoding__["a" /* Decoder */]()).decode(memory.subarray(ptr, end));
  }

  __writeString(str, stack) {
    const buf = (this[DATA].isAssemblyScript)
      ? (new __WEBPACK_IMPORTED_MODULE_1__encoding__["b" /* Encoder */]('utf-16')).encode(str)
      : (new __WEBPACK_IMPORTED_MODULE_1__encoding__["b" /* Encoder */]('utf-8')).encode(str);

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
    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(arg instanceof ArrayBuffer || ArrayBuffer.isView(arg),
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
    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(!!StructType, 'No struct StructType given');

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
    Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(!!ptrType, 'No pointer type given');

    // get the size of what the pointer points to
    const view = this.__view(ptr, ptrType.type.width);

    // handle pointer of a pointer cases (structs are pointers too here)
    if (ptrType.type.isStruct || ptrType.type.isPointer) {
      return ptrType.read(view, this.__free);
    }

    const pointer = new __WEBPACK_IMPORTED_MODULE_0__types__["c" /* Pointer */](ptrType.type);
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
  Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(instance instanceof WebAssembly.Instance,
    '.cwrap() requires a ready WebAssembly.Instance');

  const wrapper = new Wrapper({ [fnName]: [returnType, argTypes] });
  wrapper.use(instance);

  return wrapper[fnName].bind(wrapper);
}

function ccall(instance, fnName, returnType = null, argTypes = [], ...args) {
  Object(__WEBPACK_IMPORTED_MODULE_2__misc__["a" /* assert */])(instance instanceof WebAssembly.Instance,
    '.ccall() requires a ready WebAssembly.Instance');

  const wrapper = new Wrapper({ [fnName]: [returnType, argTypes] });
  wrapper.use(instance);

  return wrapper[fnName].call(wrapper, ...args);
}





/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Struct__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__types__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__encoding__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__misc__ = __webpack_require__(2);






// get the symbol for struct-data since we need access here
const DATA = (typeof Symbol !== 'undefined')
  ? Symbol.for('struct-data')
  : '__data';


// helper fn, overrides free to be free(true) by default
function extend(StructType) {
  class RustType extends StructType {
    free() {
      super.free(true);
    }
  }

  Object.assign(RustType, StructType);
  return RustType;
}


function RustTuple(...tupleTypes) {
  const fields = {};

  tupleTypes.forEach((type, i) => {
    fields[i] = Object(__WEBPACK_IMPORTED_MODULE_1__types__["d" /* parseType */])(type);
  });

  return new __WEBPACK_IMPORTED_MODULE_0__Struct__["a" /* default */](fields);
}


function RustVector(typedef) {
  const type = Object(__WEBPACK_IMPORTED_MODULE_1__types__["d" /* parseType */])(typedef);

  const Vector = extend(new __WEBPACK_IMPORTED_MODULE_0__Struct__["a" /* default */]({
    ptr: __WEBPACK_IMPORTED_MODULE_1__types__["e" /* types */].pointer(type),
    cap: 'usize',
    len: 'usize',
    /* values */
  }));

  Object.defineProperty(Vector.prototype, 'values', {
    enumerable: true,

    get() {
      const arrayType = Object(__WEBPACK_IMPORTED_MODULE_1__types__["d" /* parseType */])([type, this.len]);
      const memory = this[DATA].view.buffer;
      const view = new DataView(memory, this.ptr.ref(), arrayType.width);

      return arrayType.read(view, this[DATA].free);
    },

    set(values) {
      const len = values.length;

      this.ptr = new __WEBPACK_IMPORTED_MODULE_1__types__["c" /* Pointer */]([type, len], values);
      this.len = len;
      this.cap = len;
    },
  });

  return Vector;
}


function RustSlice(typedef) {
  const type = Object(__WEBPACK_IMPORTED_MODULE_1__types__["d" /* parseType */])(typedef);

  const Slice = extend(new __WEBPACK_IMPORTED_MODULE_0__Struct__["a" /* default */]({
    ptr: __WEBPACK_IMPORTED_MODULE_1__types__["e" /* types */].pointer(type),
    len: 'usize',
    /* values */
  }));

  Object.defineProperty(Slice.prototype, 'values', {
    enumerable: true,

    get() {
      const arrayType = Object(__WEBPACK_IMPORTED_MODULE_1__types__["d" /* parseType */])([type, this.len]);
      const memory = this[DATA].view.buffer;
      const view = new DataView(memory, this.ptr.ref(), arrayType.width);

      return arrayType.read(view, this[DATA].free);
    },

    set(values) {
      const len = values.length;

      this.ptr = new __WEBPACK_IMPORTED_MODULE_1__types__["c" /* Pointer */]([type, len], values);
      this.len = len;
    },
  });

  return Slice;
}


function RustString() {
  const RString = extend(new __WEBPACK_IMPORTED_MODULE_0__Struct__["a" /* default */]({
    ptr: __WEBPACK_IMPORTED_MODULE_1__types__["e" /* types */].pointer('u8'),
    cap: 'usize',
    len: 'usize',
    /* value */
  }));

  Object.defineProperty(RString.prototype, 'value', {
    enumerable: true,

    get() {
      const memory = this[DATA].view.buffer;
      const buf = new Uint8Array(memory, this.ptr.ref(), this.len);

      return (new __WEBPACK_IMPORTED_MODULE_2__encoding__["a" /* Decoder */]()).decode(buf);
    },

    set(str) {
      const buf = (new __WEBPACK_IMPORTED_MODULE_2__encoding__["b" /* Encoder */]()).encode(str);
      const len = buf.length;

      this.ptr = new __WEBPACK_IMPORTED_MODULE_1__types__["c" /* Pointer */](['u8', len], buf);
      this.len = len;
      this.cap = len;
    },
  });

  RString.prototype.toString = function() {
    return this.value;
  };

  return RString;
}


function RustStr() {
  const RStr = extend(new __WEBPACK_IMPORTED_MODULE_0__Struct__["a" /* default */]({
    ptr: __WEBPACK_IMPORTED_MODULE_1__types__["e" /* types */].pointer('u8'),
    len: 'usize',
    /* value */
  }));

  Object.defineProperty(RStr.prototype, 'value', {
    enumerable: true,

    get() {
      const memory = this[DATA].view.buffer;
      const buf = new Uint8Array(memory, this.ptr.ref(), this.len);

      return (new __WEBPACK_IMPORTED_MODULE_2__encoding__["a" /* Decoder */]()).decode(buf);
    },

    set(str) {
      const buf = (new __WEBPACK_IMPORTED_MODULE_2__encoding__["b" /* Encoder */]()).encode(str);
      const len = buf.length;

      this.ptr = new __WEBPACK_IMPORTED_MODULE_1__types__["c" /* Pointer */](['u8', len], buf);
      this.len = len;
    },
  });

  RStr.prototype.toString = function() {
    return this.value;
  };

  return RStr;
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

  const Option = new __WEBPACK_IMPORTED_MODULE_0__Struct__["a" /* default */](fields);

  Object.assign(Option.prototype, {
    isSome() {
      return ('discriminant' in fields) ? !!this.discriminant : !!this.value;
    },

    isNone() {
      return !this.isSome();
    },

    expect(msg) {
      if (!this.isSome()) throw new Error(msg);
      return this.value;
    },

    unwrap() {
      if (!this.isSome()) throw new Error('Error unwrapping none');
      return this.value;
    },

    unwrapOr(defaultValue) {
      return (this.isSome()) ? this.value : defaultValue;
    },

    unwrapOrElse(fn) {
      return (this.isSome()) ? this.value : fn();
    },
  });

  return Option;
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
      Object(__WEBPACK_IMPORTED_MODULE_3__misc__["a" /* assert */])(Object.keys(variant).length === 1, 'Enum value must be a variant');

      const [name, value] = Object.entries(variant)[0];

      this.discriminant = variants.indexOf(name);
      this.value = value;
    }

    tag() {
      const tag = this.discriminant;
      Object(__WEBPACK_IMPORTED_MODULE_3__misc__["a" /* assert */])(tag <= variants.length, 'Enum discriminant > than # of variants');
      return tag;
    }

    free(recursive = false) {
      const type = vtypes[this.tag()];

      if (recursive && type.isPointer || type.isStruct) {
        this.value.free(recursive);
      }

      this[DATA].free(this.ref(), Enum.width);
      this[DATA].free = null;
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

    static write(view, struct, free) {
      const tag = struct.tag();
      const type = vtypes[tag];
      const value = (struct.ref()) ? struct.value : struct[DATA].temp.value;

      const field_1 = Object(__WEBPACK_IMPORTED_MODULE_3__misc__["b" /* vslice */])(view, 0, discriminant.width);
      discriminant.write(field_1, tag);

      const field_2 = Object(__WEBPACK_IMPORTED_MODULE_3__misc__["b" /* vslice */])(view, discriminant.width, type.width);
      type.write(field_2, value);

      struct[DATA].view = view;
      if (free) struct[DATA].free = free;
    }
  }

  Object.defineProperty(Enum.prototype, 'value', {
    enumerable: true,

    get() {
      const addr = this.ref() + discriminant.width;
      const memory = this[DATA].view.buffer;

      const type = vtypes[this.tag()];
      const view = new DataView(memory, addr, type.width);

      return type.read(view, this[DATA].free);
    },

    set(value) {
      this[DATA].temp.value = value;
    },
  });

  Object.assign(Enum, StructType);

  const max = arr => arr.reduce((acc, i) => (i > acc) ? i : acc, 0);
  const width = discriminant.width + max(vtypes.map(t => t.width));
  const align = max([...vtypes.map(t => t.alignment), discriminant.alignment]);

  Enum.width = (width % align)
    ? width + align - (width % align)
    : width;

  return Enum;
}


const rust = {
  tuple: RustTuple,
  Tuple: function ctor(type, values) {
    return new (RustTuple(...type))([...values]);
  },

  vector: RustVector,
  Vector: function ctor(type, values) {
    return new (RustVector(type))({ values });
  },

  slice: RustSlice,
  Slice: function ctor(type, values) {
    return new (RustSlice(type))({ values });
  },

  string: RustString(),
  String: function ctor(str) {
    return new (RustString())({ value: str });
  },

  str: RustStr(),
  Str: function ctor(str) {
    return new (RustStr())({ value: str });
  },

  option: RustOption,
  Option: function ctor(type, value, ...opts) {
    return new (RustOption(type, ...opts))({
      value,
      discriminant: (typeof value === 'undefined') ? 0 : 1,
    });
  },

  Some: function ctor(...args) {
    return new rust.Option(...args);
  },

  None: function ctor(type, ...opts) {
    return new rust.Option(type, undefined, ...opts);
  },

  enum: RustEnum,
};


/* harmony default export */ __webpack_exports__["a"] = (rust);


/***/ })
/******/ ]);