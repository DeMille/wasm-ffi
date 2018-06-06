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
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseType = exports.StringPointer = exports.Pointer = exports.CustomType = exports.types = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _misc = __webpack_require__(1);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Makes a type of a given size.
// Optional read / write methods, just gives a DataView by default.
var CustomType = function () {
  function CustomType(size) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, CustomType);

    (0, _misc.assert)(!isNaN(size), 'Type size must be a number, given: %s', size);

    this.width = size;
    this.alignment = 'alignment' in opts ? opts.alignment : size;

    if (opts.read) this.read = opts.read;
    if (opts.write) this.write = opts.write;
  }

  _createClass(CustomType, [{
    key: 'read',
    value: function read(view) {
      return view;
    }
  }, {
    key: 'write',
    value: function write(view, value) {
      (0, _misc.assert)(value instanceof ArrayBuffer || ArrayBuffer.isView(value), 'Value must be an `ArrayBuffer` or a `DataView` (like `Uint8Array`)');

      (0, _misc.toUint8Array)(view).set((0, _misc.toUint8Array)(value));
    }
  }]);

  return CustomType;
}();

var SignedInteger = function SignedInteger(width) {
  _classCallCheck(this, SignedInteger);

  this.width = width;
  this.alignment = width;

  var get = 'getInt' + width * 8;
  var set = 'setInt' + width * 8;

  this.read = function (view) {
    return view[get](0, true /* little-endian */);
  };
  this.write = function (view, value) {
    return view[set](0, value, true /* little-endian */);
  };
};

var UnsignedInteger = function UnsignedInteger(width) {
  _classCallCheck(this, UnsignedInteger);

  this.width = width;
  this.alignment = width;

  var get = 'getUint' + width * 8;
  var set = 'setUint' + width * 8;

  this.read = function (view) {
    return view[get](0, true /* little-endian */);
  };
  this.write = function (view, value) {
    return view[set](0, value, true /* little-endian */);
  };
};

var types = {};

types.void = {
  width: 0,
  alignment: 0,
  read: function read() {
    return null;
  },
  write: function write() {}
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

  read: function read(view) {
    return view.getFloat32(0, true /* little-endian */);
  },
  write: function write(view, value) {
    view.setFloat32(0, value, true /* little-endian */);
  }
};

types.double = {
  width: 8,
  alignment: 8,

  read: function read(view) {
    return view.getFloat64(0, true /* little-endian */);
  },
  write: function write(view, value) {
    view.setFloat64(0, value, true /* little-endian */);
  }
};

types.bool = {
  width: 1,
  alignment: 1,

  read: function read(view) {
    return !!view.getInt8(0);
  },
  write: function write(view, value) {
    view.setInt8(0, !!value ? 1 : 0);
  }
};

// A pointer to some other data type in memory

var Pointer = function () {
  function Pointer(type, value) {
    _classCallCheck(this, Pointer);

    this.type = parseType(type);
    this.view = null;
    this.wrapper = null;

    this._temp = value;
  }

  _createClass(Pointer, [{
    key: 'size',
    value: function size() {
      return this.type.width;
    }
  }, {
    key: 'commit',
    value: function commit() {
      if (this._temp) {
        this.type.write(this.view, this._temp, this.wrapper);
      }
    }
  }, {
    key: 'ref',
    value: function ref() {
      return this.view ? this.view.byteOffset : 0;
    }
  }, {
    key: 'deref',
    value: function deref() {
      (0, _misc.assert)(this.view, 'Trying to deref an unallocated pointer');
      return this.type.read(this.view, this.wrapper);
    }
  }, {
    key: 'set',
    value: function set(value) {
      if (this.view) {
        this.type.write(this.view, value, this.wrapper);
      } else {
        this._temp = value;
      }
    }
  }, {
    key: 'free',
    value: function free() {
      (0, _misc.assert)(this.view, 'Cant free pointer: unallocated / already freed');

      this.wrapper.free(this.ref(), this.type.width);
      this.view = null;
    }
  }, {
    key: 'toString',
    value: function toString() {
      return this.ref() ? 'Pointer( ' + this.deref() + ' )' : 'Pointer( null )';
    }
  }]);

  return Pointer;
}();

types.pointer = function (typedef) {
  var type = parseType(typedef);

  return {
    type: type,
    width: 4,
    alignment: 4,
    isPointer: true,

    read: function read(view, wrapper) {
      var addr = view.getUint32(0, true /* little-endian */);
      var data = new DataView(view.buffer, addr, type.width);

      var pointer = new Pointer(type);
      pointer.view = data;
      pointer.wrapper = wrapper;

      return pointer;
    },
    write: function write(view, value, wrapper) {
      (0, _misc.assert)(value instanceof Pointer, 'Trying to write ' + value + ' as a pointer');

      if (!value.ref()) wrapper.writePointer(value);
      view.setUint32(0, value.ref(), true /* little-endian */);
    }
  };
};

var StringPointer = function () {
  function StringPointer(value) {
    _classCallCheck(this, StringPointer);

    this.view = null;
    this.wrapper = null;

    this._tempStr = value;
    this._tempBuf = null;
    this._width = null;
  }

  _createClass(StringPointer, [{
    key: 'size',
    value: function size() {
      this._tempBuf = this.wrapper.encodeString(this._tempStr);
      this._width = this._tempBuf.byteLength;

      return this._width;
    }
  }, {
    key: 'commit',
    value: function commit() {
      (0, _misc.assert)(!!this.view, 'Cant commit StringPointer, no view!');

      if (this._tempBuf) {
        var memory = new Uint8Array(this.view.buffer);
        memory.set(this._tempBuf, this.view.byteOffset);
      }
    }
  }, {
    key: 'ref',
    value: function ref() {
      return this.view ? this.view.byteOffset : 0;
    }
  }, {
    key: 'deref',
    value: function deref() {
      (0, _misc.assert)(this.view, 'Trying to deref an unallocated StringPointer');
      return this.wrapper.decodeString(this.view);
    }
  }, {
    key: 'free',
    value: function free() {
      (0, _misc.assert)(!!this.view, 'Cant free StringPointer: unallocated / already freed');
      this.wrapper.free(this.ref(), this._width);
      this.view = null;
    }
  }]);

  return StringPointer;
}();

Object.defineProperty(StringPointer.prototype, 'value', {
  enumerable: true,

  get: function get() {
    return this.deref();
  }
});

(0, _misc.addStringFns)(StringPointer);

types.string = {
  width: 4,
  alignment: 4,
  isPointer: true,

  read: function read(view, wrapper) {
    var addr = view.getUint32(0, true /* little-endian */);

    var pointer = new StringPointer();
    pointer.view = wrapper.readStringView(addr);
    pointer.wrapper = wrapper;

    return pointer;
  },
  write: function write(view, value, wrapper) {
    if (typeof value === 'string') {
      value = new StringPointer(value);
    }

    if (!value.ref()) wrapper.writePointer(value);
    view.setUint32(0, value.ref(), true /* little-endian */);
  }
};

// An array (of known size) of sub-types.

var ArrayType = function () {
  function ArrayType(type, length) {
    _classCallCheck(this, ArrayType);

    this.type = type;
    this.length = length;

    this.width = type.width * length;
    this.alignment = type.alignment;
  }

  _createClass(ArrayType, [{
    key: 'read',
    value: function read(view, wrapper) {
      var arr = [];

      for (var i = 0; i <= this.length - 1; i++) {
        var subview = (0, _misc.vslice)(view, i * this.type.width, this.type.width);
        arr.push(this.type.read(subview, wrapper));
      }

      return arr;
    }
  }, {
    key: 'write',
    value: function write(view, values, wrapper) {
      var _this = this;

      (0, _misc.assert)(values.length === this.length, 'Values length does not match struct array length');

      values.forEach(function (value, i) {
        var subview = (0, _misc.vslice)(view, i * _this.type.width, _this.type.width);
        _this.type.write(subview, value, wrapper);
      });
    }
  }]);

  return ArrayType;
}();

// Maps other names to base types
//
// Some questionable decisions:
//  - char = uint8 (I mean, what do you do, really)
//  - long = int32 (windows=32, linux=64, wasm is 32bit right now, so...)
//


var aliases = {
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
  usize: types.uint32
};

function parseTypeString(str) {
  var name = str.toLowerCase();

  if (name in types) return types[name];
  if (name in aliases) return aliases[name];

  throw new Error('Parsing unknown type \'' + str + '\'');
}

// parse a type from some type definition.
// may be a string, an actual type, or an array of types
function parseType(typedef) {
  if (typeof typedef === 'string') {
    return parseTypeString(typedef);
  }

  if (Array.isArray(typedef)) {
    (0, _misc.assert)(typedef.length === 2, 'Array type needs 2 arguments: [type, length], given: \n%s', typedef);

    var type = parseType(typedef[0]);
    var length = typedef[1];

    return new ArrayType(type, length);
  }

  // make sure its an ok type interface
  var errMsg = "Given argument type isn't a proper 'type' interface: \n%s";
  (0, _misc.assert)('width' in typedef, errMsg, typedef);
  (0, _misc.assert)('alignment' in typedef, errMsg, typedef);
  (0, _misc.assert)('read' in typedef, errMsg, typedef);
  (0, _misc.assert)('write' in typedef, errMsg, typedef);

  return typedef;
}

exports.types = types;
exports.CustomType = CustomType;
exports.Pointer = Pointer;
exports.StringPointer = StringPointer;
exports.parseType = parseType;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.assert = assert;
exports.vslice = vslice;
exports.toUint8Array = toUint8Array;
exports.isNil = isNil;
exports.addStringFns = addStringFns;
exports.addArrayFns = addArrayFns;
exports.makeIterable = makeIterable;
// simple assert, throws if assertion fails
// also matches args to %s formatters
function assert(condition, errMsg) {
  for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    args[_key - 2] = arguments[_key];
  }

  if (condition) return;
  if (!args || !args.length) throw new Error(errMsg);

  var msg = '';
  var strings = void 0;

  try {
    strings = args.map(function (arg) {
      return JSON.stringify(arg, null, 2);
    });
  } catch (e) {
    throw new Error(errMsg);
  }

  errMsg.split('%s').forEach(function (part) {
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

var has = function has(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};
var isFunction = function isFunction(thing) {
  return typeof thing === 'function';
};

function addStringFns(StringLike) {
  assert(!!has(StringLike.prototype, 'value'), 'Missing `value` property');

  Object.getOwnPropertyNames(String.prototype).forEach(function (prop) {
    if (has(StringLike.prototype, prop)) return;
    if (!isFunction(String.prototype[prop])) return;

    StringLike.prototype[prop] = function () {
      var _value;

      return (_value = this.value)[prop].apply(_value, arguments);
    };
  });
}

function addArrayFns(ArrayLike) {
  assert(!!has(ArrayLike.prototype, 'values'), 'Missing `values` property');

  Object.getOwnPropertyNames(Array.prototype).forEach(function (prop) {
    if (has(ArrayLike.prototype, prop)) return;
    if (!isFunction(Array.prototype[prop])) return;

    ArrayLike.prototype[prop] = function () {
      var _values;

      return (_values = this.values)[prop].apply(_values, arguments);
    };
  });
}

function makeIterable(ArrayLike) {
  assert(!!has(ArrayLike.prototype, 'values'), 'Missing `values` property');
  assert(!!has(ArrayLike.prototype, 'length'), 'Missing `length` property');

  ArrayLike.prototype[Symbol.iterator] = function () {
    var values = this.values;
    var length = this.length;
    var i = 0;

    return {
      next: function next() {
        return i < length ? { value: values[i++], done: false } : { done: true };
      }
    };
  };
}

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function encodeUTF16(str) {
  var buf = new ArrayBuffer(str.length * 2); // 2 per char
  var arr = new Uint16Array(buf);

  for (var i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i);
  }

  return new Uint8Array(buf);
}

function decodeUTF16(buf) {
  var len = buf.byteLength;
  var num = len % 2 ? (len + 1) / 2 : len / 2;
  var pts = new Uint16Array(buf.buffer, buf.byteOffset, num);

  return String.fromCharCode.apply(String, _toConsumableArray(pts));
}

// utf8 decode/encode adapted from the buffer module
// @ github.com/feross/buffer
//
function encodeUTF8(str) {
  var codePoint = void 0;
  var leadSurrogate = null;
  var units = Infinity;

  var bytes = [];

  for (var i = 0; i < str.length; ++i) {
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
      bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break;
      bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break;
      bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
    } else {
      throw new Error('Invalid code point');
    }
  }

  return Uint8Array.from(bytes);
}

function decodeUTF8(buf) {
  var start = 0; // view.byteOffset;
  var end = buf.length;

  var pts = [];
  var i = start;

  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;

    var bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;

    if (i + bytesPerSequence <= end) {
      var secondByte = void 0,
          thirdByte = void 0,
          fourthByte = void 0,
          tempCodePoint = void 0;

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }
          break;
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;
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
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;
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
  var MAX = 0x1000;

  if (pts.length <= MAX) {
    var _String$fromCharCode;

    return (_String$fromCharCode = String.fromCharCode).call.apply(_String$fromCharCode, [String].concat(pts)); // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var str = '';
  var j = 0;

  while (j < pts.length) {
    var _String$fromCharCode2;

    str += (_String$fromCharCode2 = String.fromCharCode).call.apply(_String$fromCharCode2, [String].concat(_toConsumableArray(pts.slice(j, j += MAX))));
  }

  return str;
}

function encode(str, type) {
  if (type === 'utf-16') return encodeUTF16(str);

  return typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(str) : encodeUTF8(str);
}

function decode(str, type) {
  if (type === 'utf-16') return decodeUTF16(str);

  return typeof TextDecoder !== 'undefined' ? new TextDecoder().decode(str) : decodeUTF8(str);
}

exports.encode = encode;
exports.decode = decode;
exports.encodeUTF8 = encodeUTF8;
exports.decodeUTF8 = decodeUTF8;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _types = __webpack_require__(0);

var _misc = __webpack_require__(1);

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DATA = typeof Symbol !== 'undefined' ? Symbol.for('struct-data') : '__data';

var AbstractStructType = function () {
  function AbstractStructType(obj) {
    var _this = this;

    _classCallCheck(this, AbstractStructType);

    // structs can be made with any object keys
    // hide internal info behind the data symbol so you can still have
    // struct fields like `.view`
    this[DATA] = {
      temp: {},
      view: null,
      wrapper: null
    };

    if (obj) {
      Object.entries(obj).forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
            key = _ref2[0],
            value = _ref2[1];

        (0, _misc.assert)(key in _this, 'Can\'t set value, struct missing field \'' + key + '\'');
        _this[key] = value;
      });
    }
  }

  _createClass(AbstractStructType, [{
    key: 'ref',
    value: function ref() {
      return this[DATA].view ? this[DATA].view.byteOffset : 0;
    }
  }, {
    key: 'free',
    value: function free() {
      var internal = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      (0, _misc.assert)(!!this[DATA].wrapper, 'Cant free struct, either: unallocated / already freed / sub-struct');

      // frees any pointers contained in the struct
      var freePointers = function freePointers(struct) {
        struct.constructor.fields.forEach(function (field, name) {
          if (field.type.isPointer) struct[name].free();
          if (field.type.isStruct) freePointers(struct[name]);
        });
      };

      if (internal) freePointers(this);

      this[DATA].wrapper.free(this.ref(), this.constructor.width);
      this[DATA].wrapper = null;
      this[DATA].view = null;
    }
  }, {
    key: 'toString',
    value: function toString() {
      var out = '{\n';

      var stringify = function stringify(struct) {
        var fields = struct.constructor.fields;
        var proto = struct.constructor.prototype;

        fields.forEach(function (field, name) {
          out += '  ' + name + ': ' + struct[name] + ',\n';
        });

        Object.getOwnPropertyNames(proto).forEach(function (name) {
          if (fields.has(name)) return;

          var value = struct[name];

          if (typeof value !== 'function') {
            out += '  ' + name + ': ' + value + ',\n';
          }
        });
      };

      stringify(this);

      if (out.length <= 80) {
        out = out.replace(/\n/g, '') // remove line breaks
        .replace(/ {2}/g, ' ') // collapse whitespace
        .replace(/,$/g, ' '); // trailing comma
      }

      out += '}';

      return out;
    }
  }, {
    key: 'dataview',
    value: function dataview(name) {
      var view = this[DATA].view;
      (0, _misc.assert)(!!view, "Struct hasn't been written yet, can't get dataview");

      if (!name) return view;

      var StructType = this.constructor;
      var field = StructType.fields.get(name);
      (0, _misc.assert)(!!field, 'Field \'' + name + '\' doesn\'t exist on struct');

      return (0, _misc.vslice)(view, field.offset, field.type.width);
    }
  }], [{
    key: 'read',
    value: function read(view, wrapper) {
      var StructType = this;

      var struct = new StructType();
      struct[DATA].view = view;
      struct[DATA].wrapper = wrapper;

      return struct;
    }
  }, {
    key: 'write',
    value: function write(view, struct, wrapper) {
      var StructType = this;

      if ((0, _misc.isNil)(struct) || !struct.constructor.isStruct) {
        struct = new StructType(struct);
      }

      StructType.fields.forEach(function (field, name) {
        var type = field.type;
        var value = struct[name];

        if (typeof value !== 'undefined') {
          if (type.isStruct && ((0, _misc.isNil)(value) || !value.constructor.isStruct)) {
            value = new type(value);
          }

          var fieldView = (0, _misc.vslice)(view, field.offset, type.width);
          type.write(fieldView, value, wrapper);
        }
      });

      struct[DATA].view = view;
      struct[DATA].wrapper = wrapper;
    }
  }]);

  return AbstractStructType;
}();

// Creates a new class that will create new struct instances
// (this returns a constructor)


var Struct = function Struct() {
  var fields = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var opt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  _classCallCheck(this, Struct);

  // preserve field insertion order with [[OwnPropertyKeys]]
  var names = Object.getOwnPropertyNames(fields);

  // check for field name conflicts
  ['ref', 'free', 'dataview'].forEach(function (name) {
    return (0, _misc.assert)(!(names in names), 'Field \'' + name + '\' is a reserved method name');
  });

  // keep metadata on the constructor itself

  var StructType = function (_AbstractStructType) {
    _inherits(StructType, _AbstractStructType);

    function StructType() {
      _classCallCheck(this, StructType);

      return _possibleConstructorReturn(this, (StructType.__proto__ || Object.getPrototypeOf(StructType)).apply(this, arguments));
    }

    return StructType;
  }(AbstractStructType);

  StructType.fields = new Map();
  StructType.packed = 'packed' in opt ? !!opt.packed : false;
  StructType.alignment = opt.alignment || 0;
  StructType.isStruct = true;

  var offset = 0;

  // get type/size/alignment for each field
  names.forEach(function (name) {
    var type = (0, _types.parseType)(fields[name]);

    if (!opt.alignment && type.alignment > StructType.alignment) {
      StructType.alignment = type.alignment;
    }

    if (!StructType.packed && offset % type.alignment !== 0) {
      offset += type.alignment - offset % type.alignment;
    }

    StructType.fields.set(name, { name: name, offset: offset, type: type });
    offset += type.width;
  });

  StructType.width = offset % StructType.alignment ? offset + StructType.alignment - offset % StructType.alignment : offset;

  // define getter / setter behavior for each field
  // these will read / write each field to memory according to its type
  StructType.fields.forEach(function (field, name) {
    Object.defineProperty(StructType.prototype, name, {
      enumerable: true,

      get: function get() {
        if (!this[DATA].view) {
          return this[DATA].temp[name];
        }

        var view = (0, _misc.vslice)(this[DATA].view, field.offset, field.type.width);
        return field.type.read(view, this[DATA].wrapper);
      },
      set: function set(value) {
        if (!this[DATA].view) {
          this[DATA].temp[name] = value;
          return;
        }

        var view = (0, _misc.vslice)(this[DATA].view, field.offset, field.type.width);
        field.type.write(view, value, this[DATA].wrapper);
      }
    });
  });

  return StructType;
};

exports.default = Struct;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = demangleStack;
// Rust demangle logic adpated from Alex Crichton's ructc-demangle:
// http://alexcrichton.com/rustc-demangle/src/rustc_demangle/lib.rs.html
var symbols = [[/^_\$/, '$'], [/\$C\$/g, ','], [/\$SP\$/g, '@'], [/\$BP\$/g, '*'], [/\$RF\$/g, '&'], [/\$LT\$/g, '<'], [/\$GT\$/g, '>'], [/\$LP\$/g, '('], [/\$RP\$/g, ')'], [/\$u7e\$/g, '~'], [/\$u20\$/g, ' '], [/\$u27\$/g, "'"], [/\$u5b\$/g, '['], [/\$u5d\$/g, ']'], [/\$u7b\$/g, '{'], [/\$u7d\$/g, '}'], [/\$u3b\$/g, ';'], [/\$u2b\$/g, '+'], [/\$u22\$/g, '"'], [/\.\./g, '::']];

function isHash(str) {
  return str.length && str[0] === 'h' && str.split('').slice(1).every(function (char) {
    return (/[0-9a-f]/i.test(char)
    );
  });
}

// replaces all symbols in string, returning a new string
function replaceAllSymbols(str) {
  return symbols.reduce(function (result, _ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        re = _ref2[0],
        char = _ref2[1];

    return result.replace(re, char);
  }, str);
}

// Basic rust demangle rules:
// - starts with "ZN | _ZN | __ZN" and ends in "E"
// - name is made up of chunks. chunks are length prefixed
//
// Bails early if string isn't a valid rust mangle
//
function demangle() {
  var mangled = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  var startsWith = function startsWith(sub) {
    return mangled.indexOf(sub) === 0;
  };
  var endsWith = function endsWith(sub) {
    return mangled.slice(-1) === sub;
  };
  var inner = void 0;

  if (!endsWith('E')) return mangled;

  if (startsWith('ZN')) inner = mangled.slice(2, -1);else if (startsWith('_ZN')) inner = mangled.slice(3, -1);else if (startsWith('__ZN')) inner = mangled.slice(4, -1);

  if (!inner) return mangled;

  var chars = inner.split('');
  var labels = [];
  var label = '';
  var digits = '';
  var length = 0;

  chars.forEach(function (char) {
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
        digits = ''; // clear for next time
        label += char; // add first char to label
        length--; // decrement
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
  var re = /(?:at (.+) \()|(?:(.+)<?@)/;

  // replaces matches, if found, with the demangled identifier
  err.stack = err.stack.split('\n').map(function (line) {
    return line.replace(re, function (_, m1, m2) {
      return 'at ' + demangle(m1 || m2) + ' (';
    });
  }).join('\n');

  return err;
}

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._decodeUTF8 = exports._encodeUTF8 = exports.assemblyscript = exports.rust = exports.demangle = exports.CString = exports.StringPointer = exports.Pointer = exports.CustomType = exports.types = exports.Struct = exports.ccall = exports.cwrap = exports.Wrapper = undefined;

var _Wrapper = __webpack_require__(6);

var _Struct = __webpack_require__(3);

var _Struct2 = _interopRequireDefault(_Struct);

var _demangle = __webpack_require__(4);

var _demangle2 = _interopRequireDefault(_demangle);

var _rust = __webpack_require__(7);

var _rust2 = _interopRequireDefault(_rust);

var _assemblyscript = __webpack_require__(8);

var _assemblyscript2 = _interopRequireDefault(_assemblyscript);

var _types = __webpack_require__(0);

var _encoding = __webpack_require__(2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _encodeUTF8 = _encoding.encodeUTF8;
var _decodeUTF8 = _encoding.decodeUTF8;

var CString = _types.StringPointer;

exports.default = {
  Wrapper: _Wrapper.Wrapper,
  cwrap: _Wrapper.cwrap,
  ccall: _Wrapper.ccall,
  Struct: _Struct2.default,
  types: _types.types,
  CustomType: _types.CustomType,
  Pointer: _types.Pointer,
  StringPointer: _types.StringPointer,
  CString: CString, // deprecated
  demangle: _demangle2.default,
  rust: _rust2.default,
  assemblyscript: _assemblyscript2.default,
  _encodeUTF8: _encodeUTF8,
  _decodeUTF8: _decodeUTF8
};
exports.Wrapper = _Wrapper.Wrapper;
exports.cwrap = _Wrapper.cwrap;
exports.ccall = _Wrapper.ccall;
exports.Struct = _Struct2.default;
exports.types = _types.types;
exports.CustomType = _types.CustomType;
exports.Pointer = _types.Pointer;
exports.StringPointer = _types.StringPointer;
exports.CString = CString;
exports.demangle = _demangle2.default;
exports.rust = _rust2.default;
exports.assemblyscript = _assemblyscript2.default;
exports._encodeUTF8 = _encodeUTF8;
exports._decodeUTF8 = _decodeUTF8;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ccall = exports.cwrap = exports.Wrapper = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _types = __webpack_require__(0);

var _encoding = __webpack_require__(2);

var _misc = __webpack_require__(1);

var _demangle = __webpack_require__(4);

var _demangle2 = _interopRequireDefault(_demangle);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var numbers = new Set(['int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64', 'float', 'double', 'u8', 'u16', 'u32', 'u64', 'i8', 'i16', 'i32', 'i64', 'f32', 'f64', 'schar', 'short', 'int', 'long', 'char', 'uchar', 'ushort', 'uint', 'ulong', 'size_t', 'usize']);

function areValid(argTypes) {
  return argTypes.every(function (type) {
    return type === null || type === undefined || type === 'void' || type === 'number' || type === 'boolean' || type === 'bool' || type === 'string' || type === 'array' || numbers.has(type) || type.isStruct || type.isPointer;
  });
}

// a node fetch polyfill that won't trigger webpack
// idea borrowed from:
// https://github.com/dcodeIO/webassembly/blob/master/src/index.js#L223
var fs = void 0;
function fetch_polyfill(file) {
  return new Promise(function (resolve, reject) {
    (fs || (fs = eval('equire'.replace(/^/, 'r'))('fs'))).readFile(file, function (err, data) {
      return err ? reject(err) : resolve({
        arrayBuffer: function arrayBuffer() {
          return Promise.resolve(data);
        },
        ok: true
      });
    });
  });
}

var fetchFn = typeof fetch === 'function' && fetch || fetch_polyfill;

// gets the wasm at a url and instantiates it.
// checks if streaming instantiation is available and uses that
function fetchAndInstantiate(url, imports) {
  return fetchFn(url).then(function (resp) {
    if (!resp.ok) {
      throw new Error('Got a ' + resp.status + ' fetching wasm @ ' + url);
    }

    var wasm = 'application/wasm';
    var type = resp.headers && resp.headers.get('content-type');

    return WebAssembly.instantiateStreaming && type === wasm ? WebAssembly.instantiateStreaming(resp, imports) : resp.arrayBuffer().then(function (buf) {
      return WebAssembly.instantiate(buf, imports);
    });
  }).then(function (result) {
    return result.instance;
  });
}

var DATA = typeof Symbol !== 'undefined' ? Symbol.for('wrapper-data') : '__data';

var Wrapper = function () {
  function Wrapper(signatures) {
    var _this = this;

    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Wrapper);

    var dialect = opts.dialect && opts.dialect.toLowerCase();

    // Keep internal info behind the DATA symbol so wrapped function names
    // won't cause conflicts
    this[DATA] = {
      instance: null,
      imports: null,
      signatures: new Set(),
      allocations: new Map(),
      memory: opts.memory,
      debug: !!opts.debug,
      isAssemblyScript: dialect === 'assemblyscript'
    };

    Object.entries(signatures).forEach(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2),
          fn = _ref2[0],
          _ref2$ = _slicedToArray(_ref2[1], 2),
          returnType = _ref2$[0],
          _ref2$$ = _ref2$[1],
          argTypes = _ref2$$ === undefined ? [] : _ref2$$;

      // check for name collisions:
      ['exports', 'imports', 'utils', 'fetch', 'use'].forEach(function (name) {
        return (0, _misc.assert)(fn !== name, '`%s` is a reserved wrapper name', name);
      });

      // validate arg types
      (0, _misc.assert)(argTypes.every(function (arg) {
        return !!arg;
      }), '`%s` has undefined types', fn);
      (0, _misc.assert)(areValid([returnType]), '`%s` has invalid types', fn);
      (0, _misc.assert)(areValid(argTypes), '`%s` has invalid types', fn);

      _this[DATA].signatures.add({ fnName: fn, returnType: returnType, argTypes: argTypes });
    });

    // exposing some methods via `.utils`
    this.utils = {
      encodeString: this.__encodeString.bind(this),
      decodeString: this.__decodeString.bind(this),
      readStringView: this.__readStringView.bind(this),
      readString: this.__readString.bind(this),
      writeString: this.__writeString.bind(this),
      writeArray: this.__writeArray.bind(this),
      readStruct: this.__readStruct.bind(this),
      writeStruct: this.__writeStruct.bind(this),
      readPointer: this.__readPointer.bind(this),
      writePointer: this.__writePointer.bind(this),

      allocate: function (value) {
        (0, _misc.assert)(typeof value.ref === 'function', "Can't allocate '%s' This method is for Pointer & Structs", value);

        value instanceof _types.Pointer || value instanceof _types.StringPointer ? this.__writePointer(value) : this.__writeStruct(value);
      }.bind(this),

      free: function (value) {
        typeof value.ref === 'function' ? this.__free(value.ref()) : this.__free(value);
      }.bind(this)
    };

    this.exports = null;
  }

  // takes an import object or a function what will produce a import object


  _createClass(Wrapper, [{
    key: 'imports',
    value: function imports(importArg) {
      var _this2 = this;

      var applyDefaults = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

      var wrap = function wrap() {
        for (var _len = arguments.length, fnConfig = Array(_len), _key = 0; _key < _len; _key++) {
          fnConfig[_key] = arguments[_key];
        }

        // function to wrap is always the last argument
        var fn = fnConfig.pop();
        // two argument formats (this might be a bad idea):
        //   1) with return type: wrap([returnType, [...argTypes]], fn)
        //   2) no return type: wrap(arg1, arg2, ..., fn)
        //
        // detructure into appropriate vars

        var _ref3 = Array.isArray(fnConfig[0]) ? fnConfig[0] // 1st format
        : [null, fnConfig],
            _ref4 = _slicedToArray(_ref3, 2),
            returnType = _ref4[0],
            _ref4$ = _ref4[1],
            argTypes = _ref4$ === undefined ? [] : _ref4$; // 2nd format

        (0, _misc.assert)(areValid(argTypes), 'Import has invalid types: ' + argTypes);
        (0, _misc.assert)(areValid([returnType]), 'Import has invalid types: ' + returnType);

        return function () {
          for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }

          var ffi_args = argTypes.map(function (type, i) {
            return _this2.__out(args[i], type);
          });

          if (args.length > argTypes.length) {
            ffi_args.push.apply(ffi_args, _toConsumableArray(args.slice(argTypes.length - args.length)));
          }

          var value = fn.apply(undefined, _toConsumableArray(ffi_args));

          if (returnType && returnType !== 'void') {
            return _this2.__in(value, returnType);
          }
        };
      };

      var env = {
        // wasm-glue
        print: wrap('string', function (str) {
          var _console;

          for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
            args[_key3 - 1] = arguments[_key3];
          }

          return (_console = console).log.apply(_console, [str].concat(args));
        }),
        eprint: wrap('string', function (str) {
          var _console2;

          for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
            args[_key4 - 1] = arguments[_key4];
          }

          return (_console2 = console).error.apply(_console2, [str].concat(args));
        }),
        trace: wrap('string', function (str) {
          throw new Error(str);
        }),

        // assemblyscript
        abort: wrap('string', 'string', 'number', 'number', function (msg, file, line, col) {
          throw new Error(msg + ' @ ' + file + ':' + line + ':' + col);
        }),

        // <webassembly.h>
        _abort: function _abort(errCode) {
          throw new Error('Aborting, error code: ' + errCode);
        },
        _exit: function _exit(exitCode) {
          if (exitCode) throw new Error('Exit error code: ' + exitCode);
        },
        _grow: function _grow() {}
      };

      var obj = typeof importArg === 'function' ? importArg(wrap) : importArg;

      if (applyDefaults) obj.env = Object.assign(env, obj.env);
      this[DATA].imports = obj;

      return obj;
    }
  }, {
    key: 'fetch',
    value: function fetch(url) {
      var _this3 = this;

      var imports = this[DATA].imports || this.imports({});

      return fetchAndInstantiate(url, imports).then(function (instance) {
        _this3.__link(instance);
        return _this3;
      });
    }
  }, {
    key: 'use',
    value: function use(instance) {
      (0, _misc.assert)(instance instanceof WebAssembly.Instance, '.use(instance) requires a WebAssembly.Instance');

      this.__link(instance);
      return this;
    }
  }, {
    key: '__link',
    value: function __link(instance) {
      var _this4 = this;

      var memory = this[DATA].memory || instance.exports.memory || this[DATA].imports.env && this[DATA].imports.env.memory;

      (0, _misc.assert)(!!memory, '' + 'Wrapper needs access to your WebAssemmbly memory. It looks for this in' + 'either your `imports.env.memory` or `exports.env.memory`. If you don\'t' + 'use either, you need to add it in the options with `new Wrapper`');

      this.exports = instance.exports;
      this[DATA].instance = instance;
      this[DATA].memory = memory;

      this[DATA].signatures.forEach(function (_ref5) {
        var fnName = _ref5.fnName,
            returnType = _ref5.returnType,
            argTypes = _ref5.argTypes;

        var fn = _this4.exports[fnName];
        (0, _misc.assert)(!!fn, 'Fn \'' + fnName + '\' missing from wasm exports');

        _this4[fnName] = _this4.__wrap(fn, argTypes, returnType);
      });
    }
  }, {
    key: '__wrap',
    value: function __wrap(fn, argTypes, returnType) {
      return function () {
        var _this5 = this;

        for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
          args[_key5] = arguments[_key5];
        }

        var stack = [];
        var ffi_args = argTypes.map(function (type, i) {
          return _this5.__in(args[i], type, stack);
        });
        var value = void 0;

        if (args.length > argTypes.length) {
          ffi_args.push.apply(ffi_args, _toConsumableArray(args.slice(argTypes.length - args.length)));
        }

        try {
          value = fn.apply(undefined, _toConsumableArray(ffi_args));
        } catch (err) {
          throw (0, _demangle2.default)(err);
        }

        stack.forEach(function (ptr) {
          return _this5.__free(ptr);
        });

        if (returnType && returnType !== 'void') {
          return this.__out(value, returnType);
        }
      };
    }

    // wrap a variable heading into a wasm function

  }, {
    key: '__in',
    value: function __in(value, type, stack) {
      (0, _misc.assert)(!!type, 'No arg type was specified for this function');

      if (type === 'number' || numbers.has(type)) return value;
      if (type === 'boolean' || type === 'bool') return !!value;
      if (type === 'string') return this.__writeString(value, stack);
      if (type === 'array') return this.__writeArray(value, stack);
      if (type.isStruct) return this.__writeStruct(value, type);
      if (type.isPointer) return this.__writePointer(value);

      throw new Error('Unknown type: \n' + JSON.stringify(type));
    }

    // wrap a variable heading out of a wasm function

  }, {
    key: '__out',
    value: function __out(value, type) {
      (0, _misc.assert)(!!type, 'No arg type was specified for this function');

      if (type === 'number' || numbers.has(type)) return value;
      if (type === 'boolean' || type === 'bool') return !!value;
      if (type === 'string') return this.__readString(value);
      if (type.isStruct) return this.__readStruct(value, type);
      if (type.isPointer) return this.__readPointer(value, type);

      throw new Error('Unknown type: \n' + JSON.stringify(type));
    }
  }, {
    key: '__allocate',
    value: function __allocate(size) {
      (0, _misc.assert)(!!this.exports.allocate && !!this.exports.deallocate, "Missing allocate/deallocate fns in wasm exports, can't allocate memory");

      var ptr = this.exports.allocate(size);
      (0, _misc.assert)(!!ptr, 'allocate failed');

      if (this[DATA].debug) console.log('Alloc: %s (size=%s)', ptr, size);
      this[DATA].allocations.set(ptr, size);

      return ptr;
    }
  }, {
    key: '__free',
    value: function __free(ptr, optSize) {
      var size = optSize || this[DATA].allocations.get(ptr);
      if (this[DATA].debug) console.log('Free: %s (size=%s)', ptr, size);

      this.exports.deallocate(ptr, size);
      this[DATA].allocations.delete(ptr);
    }
  }, {
    key: '__view',
    value: function __view(start, length) {
      return new DataView(this[DATA].memory.buffer, start, length);
    }
  }, {
    key: '__encodeString',
    value: function __encodeString(str) {
      var encoded = this[DATA].isAssemblyScript ? (0, _encoding.encode)(str, 'utf-16') : (0, _encoding.encode)(str);

      var len = this[DATA].isAssemblyScript ? encoded.byteLength + 4 // assemblyscript header
      : encoded.byteLength + 1; // null terminating byte

      var buf = new Uint8Array(new ArrayBuffer(len));

      if (this[DATA].isAssemblyScript) {
        var header = encoded.byteLength / 2;
        new DataView(buf.buffer).setUint32(0, header, true);
        buf.set(encoded, 4);
      } else {
        buf.set(encoded, 0);
        buf[len - 1] = 0;
      }

      return buf;
    }
  }, {
    key: '__decodeString',
    value: function __decodeString(view) {
      var buf = (0, _misc.toUint8Array)(view);

      return this[DATA].isAssemblyScript ? (0, _encoding.decode)(buf.subarray(4), 'utf-16') : (0, _encoding.decode)(buf.subarray(0, -1));
    }
  }, {
    key: '__readStringView',
    value: function __readStringView(ptr) {
      // length prefixed
      if (this[DATA].isAssemblyScript) {
        var strlen = this.__view().getUint32(ptr, true); // header
        var len = 4 + strlen * 2;

        return this.__view(ptr, len);
      }

      // null terminated
      var memory = new Uint8Array(this[DATA].memory.buffer);

      var end = ptr;
      while (memory[end]) {
        ++end;
      }return this.__view(ptr, end - ptr + 1);
    }
  }, {
    key: '__readString',
    value: function __readString(ptr) {
      return this.__decodeString(this.__readStringView(ptr));
    }
  }, {
    key: '__writeString',
    value: function __writeString(str, stack) {
      var buf = this.__encodeString(str);

      var ptr = this.__allocate(buf.byteLength);
      if (stack) stack.push(ptr);

      var memory = new Uint8Array(this[DATA].memory.buffer);
      memory.set(buf, ptr);

      return ptr;
    }
  }, {
    key: '__writeArray',
    value: function __writeArray(arg, stack) {
      (0, _misc.assert)(arg instanceof ArrayBuffer || ArrayBuffer.isView(arg), 'Argument must be an ArrayBuffer or a TypedArray (like Uint8Array)');

      var arr = !ArrayBuffer.isView(arg) ? new Uint8Array(arg) : arg;

      var len = this[DATA].isAssemblyScript ? arr.byteLength + 16 /* Array/ArrayBuffer header */
      : arr.byteLength;

      var ptr = this.__allocate(len);
      if (stack) stack.push(ptr);

      var memory = new Uint8Array(this[DATA].memory.buffer);
      var data = (0, _misc.toUint8Array)(arr);

      if (this[DATA].isAssemblyScript) {
        this.__view().setUint32(ptr + 0, ptr + 8, true); // arraybuffer ptr
        this.__view().setUint32(ptr + 4, arr.length, true); // array length
        this.__view().setUint32(ptr + 8, arr.byteLength, true); // byteLength
        memory.set(data, ptr + 16); // contents
      } else {
        memory.set(data, ptr);
      }

      return ptr;
    }
  }, {
    key: '__readStruct',
    value: function __readStruct(ptr, StructType) {
      (0, _misc.assert)(!!StructType, 'No struct StructType given');

      var view = this.__view(ptr, StructType.width);
      var struct = StructType.read(view, this.utils);

      return struct;
    }
  }, {
    key: '__writeStruct',
    value: function __writeStruct(value, Type) {
      // if struct has already been allocated:
      if (!(0, _misc.isNil)(value) && value.ref && value.ref()) return value.ref();

      var StructType = Type || value.constructor;
      var ptr = this.__allocate(StructType.width);
      var view = this.__view(ptr, StructType.width);

      StructType.write(view, value, this.utils);

      return ptr;
    }
  }, {
    key: '__readPointer',
    value: function __readPointer(ptr, ptrType) {
      (0, _misc.assert)(!!ptrType, 'No pointer type given');

      // get the size of what the pointer points to
      var view = this.__view(ptr, ptrType.type.width);

      // handle pointer of a pointer cases (structs are pointers too here)
      if (ptrType.type.isStruct || ptrType.type.isPointer) {
        return ptrType.read(view, this.utils);
      }

      var pointer = new _types.Pointer(ptrType.type);
      pointer.view = view;
      pointer.wrapper = this.utils;

      return pointer;
    }
  }, {
    key: '__writePointer',
    value: function __writePointer(pointer) {
      if (pointer.ref()) return pointer.ref();

      pointer.wrapper = this.utils;

      // allocate space for what the pointer points to
      var size = pointer.size();
      var addr = this.__allocate(size);
      var view = this.__view(addr, size);

      pointer.view = view;
      pointer.commit();

      return addr;
    }
  }]);

  return Wrapper;
}();

function cwrap(instance, fnName) {
  var returnType = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var argTypes = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

  (0, _misc.assert)(instance instanceof WebAssembly.Instance, '.cwrap() requires a ready WebAssembly.Instance');

  var wrapper = new Wrapper(_defineProperty({}, fnName, [returnType, argTypes]));
  wrapper.use(instance);

  return wrapper[fnName].bind(wrapper);
}

function ccall(instance, fnName) {
  var _wrapper$fnName;

  var returnType = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  var argTypes = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

  (0, _misc.assert)(instance instanceof WebAssembly.Instance, '.ccall() requires a ready WebAssembly.Instance');

  var wrapper = new Wrapper(_defineProperty({}, fnName, [returnType, argTypes]));
  wrapper.use(instance);

  for (var _len6 = arguments.length, args = Array(_len6 > 4 ? _len6 - 4 : 0), _key6 = 4; _key6 < _len6; _key6++) {
    args[_key6 - 4] = arguments[_key6];
  }

  return (_wrapper$fnName = wrapper[fnName]).call.apply(_wrapper$fnName, [wrapper].concat(args));
}

exports.Wrapper = Wrapper;
exports.cwrap = cwrap;
exports.ccall = ccall;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _Struct = __webpack_require__(3);

var _Struct2 = _interopRequireDefault(_Struct);

var _types = __webpack_require__(0);

var _encoding = __webpack_require__(2);

var _misc = __webpack_require__(1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// get the symbol for struct-data since we need access here
var DATA = typeof Symbol !== 'undefined' ? Symbol.for('struct-data') : '__data';

function RustTuple(tupleTypes, values) {
  var fields = {};

  tupleTypes.forEach(function (type, i) {
    fields[i] = (0, _types.parseType)(type);
  });

  var Tuple = new _Struct2.default(fields);

  return values ? new Tuple(values) : Tuple;
}

function RustVector(typedef, initialValues) {
  var type = (0, _types.parseType)(typedef);

  var Base = new _Struct2.default({
    ptr: _types.types.pointer(type),
    cap: 'usize',
    length: 'usize'
    /* values */
  });

  Object.defineProperty(Base.prototype, 'values', {
    enumerable: true,

    get: function get() {
      var memory = this[DATA].view.buffer;
      var wrapper = this[DATA].wrapper;

      var arrayType = (0, _types.parseType)([type, this.length]);
      var view = new DataView(memory, this.ptr.ref(), arrayType.width);

      return arrayType.read(view, wrapper);
    },
    set: function set(values) {
      this.ptr = new _types.Pointer([type, values.length], values);
      this.length = values.length;
      this.cap = values.length;
    }
  });

  (0, _misc.addArrayFns)(Base);
  (0, _misc.makeIterable)(Base);

  var Vector = function (_Base) {
    _inherits(Vector, _Base);

    function Vector(values) {
      _classCallCheck(this, Vector);

      var _this = _possibleConstructorReturn(this, (Vector.__proto__ || Object.getPrototypeOf(Vector)).call(this));

      if (values) _this.values = values;
      return _this;
    }

    _createClass(Vector, [{
      key: 'free',
      value: function free() {
        _get(Vector.prototype.__proto__ || Object.getPrototypeOf(Vector.prototype), 'free', this).call(this, true); // free ptr data
      }
    }]);

    return Vector;
  }(Base);

  return initialValues ? new Vector(initialValues) : Vector;
}

function RustSlice(typedef, initialValues) {
  var type = (0, _types.parseType)(typedef);

  var Base = new _Struct2.default({
    ptr: _types.types.pointer(type),
    length: 'usize'
    /* values */
  });

  Object.defineProperty(Base.prototype, 'values', {
    enumerable: true,

    get: function get() {
      var memory = this[DATA].view.buffer;
      var wrapper = this[DATA].wrapper;

      var arrayType = (0, _types.parseType)([type, this.length]);
      var view = new DataView(memory, this.ptr.ref(), arrayType.width);

      return arrayType.read(view, wrapper);
    },
    set: function set(values) {
      this.ptr = new _types.Pointer([type, values.length], values);
      this.length = values.length;
    }
  });

  (0, _misc.addArrayFns)(Base);
  (0, _misc.makeIterable)(Base);

  var Slice = function (_Base2) {
    _inherits(Slice, _Base2);

    function Slice(values) {
      _classCallCheck(this, Slice);

      var _this2 = _possibleConstructorReturn(this, (Slice.__proto__ || Object.getPrototypeOf(Slice)).call(this));

      if (values) _this2.values = values;
      return _this2;
    }

    _createClass(Slice, [{
      key: 'free',
      value: function free() {
        _get(Slice.prototype.__proto__ || Object.getPrototypeOf(Slice.prototype), 'free', this).call(this, true); // free ptr data
      }
    }]);

    return Slice;
  }(Base);

  return initialValues ? new Slice(initialValues) : Slice;
}

function RustString() {
  var Base = new _Struct2.default({
    ptr: _types.types.pointer('u8'),
    length: 'usize',
    cap: 'usize'
    /* value */
  });

  Object.defineProperty(Base.prototype, 'value', {
    enumerable: true,

    get: function get() {
      var memory = this[DATA].view.buffer;
      var buf = new Uint8Array(memory, this.ptr.ref(), this.length);

      return (0, _encoding.decode)(buf);
    },
    set: function set(str) {
      var buf = (0, _encoding.encode)(str);

      this.ptr = new _types.Pointer(['u8', buf.length], buf);
      this.length = buf.length;
      this.cap = buf.length;
    }
  });

  (0, _misc.addStringFns)(Base);

  var _RustString = function (_Base3) {
    _inherits(_RustString, _Base3);

    function _RustString(value) {
      _classCallCheck(this, _RustString);

      var _this3 = _possibleConstructorReturn(this, (_RustString.__proto__ || Object.getPrototypeOf(_RustString)).call(this));

      if (value) _this3.value = value;
      return _this3;
    }

    _createClass(_RustString, [{
      key: 'free',
      value: function free() {
        _get(_RustString.prototype.__proto__ || Object.getPrototypeOf(_RustString.prototype), 'free', this).call(this, true); // free ptr data
      }
    }]);

    return _RustString;
  }(Base);

  return _RustString;
}

function RustStr() {
  var Base = new _Struct2.default({
    ptr: _types.types.pointer('u8'),
    length: 'usize'
    /* value */
  });

  Object.defineProperty(Base.prototype, 'value', {
    enumerable: true,

    get: function get() {
      var memory = this[DATA].view.buffer;
      var buf = new Uint8Array(memory, this.ptr.ref(), this.length);

      return (0, _encoding.decode)(buf);
    },
    set: function set(str) {
      var buf = (0, _encoding.encode)(str);

      this.ptr = new _types.Pointer(['u8', buf.length], buf);
      this.length = buf.length;
    }
  });

  (0, _misc.addStringFns)(Base);

  var _RustStr = function (_Base4) {
    _inherits(_RustStr, _Base4);

    function _RustStr(value) {
      _classCallCheck(this, _RustStr);

      var _this4 = _possibleConstructorReturn(this, (_RustStr.__proto__ || Object.getPrototypeOf(_RustStr)).call(this));

      if (value) _this4.value = value;
      return _this4;
    }

    _createClass(_RustStr, [{
      key: 'free',
      value: function free() {
        _get(_RustStr.prototype.__proto__ || Object.getPrototypeOf(_RustStr.prototype), 'free', this).call(this, true); // free ptr data
      }
    }]);

    return _RustStr;
  }(Base);

  return _RustStr;
}

function RustOption(typedef) {
  var isNonNullable = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var tagSize = arguments[2];

  var type = (0, _types.parseType)(typedef);
  var discriminant = void 0;

  if (tagSize) discriminant = _types.types['uint' + tagSize * 8];else if (type.alignment === 1) discriminant = 'uint8';else if (type.alignment === 2) discriminant = 'uint16';else discriminant = 'uint32';

  var fields = isNonNullable ? { value: type } : { discriminant: discriminant, value: type };

  var Base = new _Struct2.default(fields);

  var OptionType = function (_Base5) {
    _inherits(OptionType, _Base5);

    function OptionType(value) {
      _classCallCheck(this, OptionType);

      var _this5 = _possibleConstructorReturn(this, (OptionType.__proto__ || Object.getPrototypeOf(OptionType)).call(this));

      _this5.value = value;
      _this5.discriminant = (0, _misc.isNil)(value) ? 0 : 1;
      return _this5;
    }

    _createClass(OptionType, [{
      key: 'isSome',
      value: function isSome() {
        return 'discriminant' in fields ? !!this.discriminant : !!this.value;
      }
    }, {
      key: 'isNone',
      value: function isNone() {
        return !this.isSome();
      }
    }, {
      key: 'expect',
      value: function expect(msg) {
        if (!this.isSome()) throw new Error(msg);
        return this.value;
      }
    }, {
      key: 'unwrap',
      value: function unwrap() {
        if (!this.isSome()) throw new Error('Error unwrapping none');
        return this.value;
      }
    }, {
      key: 'unwrapOr',
      value: function unwrapOr(defaultValue) {
        return this.isSome() ? this.value : defaultValue;
      }
    }, {
      key: 'unwrapOrElse',
      value: function unwrapOrElse(fn) {
        return this.isSome() ? this.value : fn();
      }
    }], [{
      key: 'some',
      value: function some(value) {
        return new OptionType(value);
      }
    }, {
      key: 'none',
      value: function none() {
        return new OptionType();
      }
    }]);

    return OptionType;
  }(Base);

  return OptionType;
}

function RustEnum(obj) {
  var tagSize = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4;

  var variants = Object.getOwnPropertyNames(obj);
  var vtypes = variants.map(function (name) {
    return (0, _types.parseType)(obj[name]);
  });
  var discriminant = _types.types['uint' + tagSize * 8];

  var StructType = new _Struct2.default({
    discriminant: discriminant
    /* value */
  });

  var Enum = function (_StructType) {
    _inherits(Enum, _StructType);

    function Enum(variant) {
      _classCallCheck(this, Enum);

      var _this6 = _possibleConstructorReturn(this, (Enum.__proto__ || Object.getPrototypeOf(Enum)).call(this));

      if (variant) _this6._set(variant);
      return _this6;
    }

    _createClass(Enum, [{
      key: '_set',
      value: function _set(variant) {
        (0, _misc.assert)(Object.keys(variant).length === 1, 'Enum value must be a variant');

        var _Object$entries$ = _slicedToArray(Object.entries(variant)[0], 2),
            name = _Object$entries$[0],
            value = _Object$entries$[1];

        this.discriminant = variants.indexOf(name);
        this.value = value;
      }
    }, {
      key: 'tag',
      value: function tag() {
        var tag = this.discriminant;
        (0, _misc.assert)(tag <= variants.length, 'Enum discriminant > than # of variants');
        return tag;
      }
    }, {
      key: 'free',
      value: function free() {
        var internal = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

        var type = vtypes[this.tag()];

        if (internal && type.isPointer || type.isStruct) {
          this.value.free(internal);
        }

        this[DATA].wrapper.free(this.ref(), Enum.width);
        this[DATA].wrapper = null;
        this[DATA].view = null;
      }
    }, {
      key: 'name',
      value: function name() {
        return variants[this.tag()];
      }
    }, {
      key: 'is',
      value: function is(name) {
        return variants.indexOf(name) === this.tag();
      }
    }, {
      key: 'match',
      value: function match(arms) {
        var name = variants[this.tag()];
        var val = this.value;

        if (name in arms) {
          return typeof arms[name] === 'function' ? arms[name](val) : arms[name];
        }

        if ('_' in arms) {
          return typeof arms._ === 'function' ? arms._(val) : arms._;
        }
      }
    }], [{
      key: 'write',
      value: function write(view, struct, wrapper) {
        if ((0, _misc.isNil)(struct) || !struct.constructor.isStruct) {
          struct = new Enum(struct);
        }

        var tag = struct.tag();
        var type = vtypes[tag];
        var value = struct.ref() ? struct.value : struct[DATA].temp.value;

        if (type.isStruct && ((0, _misc.isNil)(value) || !value.constructor.isStruct)) {
          value = new type(value);
        }

        var field_1 = (0, _misc.vslice)(view, 0, discriminant.width);
        discriminant.write(field_1, tag);

        var field_2 = (0, _misc.vslice)(view, discriminant.width, type.width);
        type.write(field_2, value, wrapper);

        struct[DATA].view = view;
        struct[DATA].wrapper = wrapper;
      }
    }]);

    return Enum;
  }(StructType);

  Object.defineProperty(Enum.prototype, 'value', {
    enumerable: true,

    get: function get() {
      var memory = this[DATA].view.buffer;
      var wrapper = this[DATA].wrapper;

      var type = vtypes[this.tag()];
      var addr = this.ref() + discriminant.width;
      var view = new DataView(memory, addr, type.width);

      return type.read(view, wrapper);
    },
    set: function set(value) {
      this[DATA].temp.value = value;
    }
  });

  var width = discriminant.width + Math.max.apply(Math, _toConsumableArray(vtypes.map(function (t) {
    return t.width;
  })));
  var align = Math.max.apply(Math, _toConsumableArray(vtypes.map(function (t) {
    return t.alignment;
  })).concat([discriminant.alignment]));

  Enum.width = width % align ? width + align - width % align : width;

  return Enum;
}

var rust = {
  tuple: RustTuple,
  vector: RustVector,
  slice: RustSlice,
  string: RustString(),
  str: RustStr(),
  enum: RustEnum,
  option: RustOption,

  some: function ctor(type, value) {
    for (var _len = arguments.length, opts = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      opts[_key - 2] = arguments[_key];
    }

    return new (RustOption.apply(undefined, [type].concat(opts)))(value);
  },
  none: function ctor(type) {
    for (var _len2 = arguments.length, opts = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      opts[_key2 - 1] = arguments[_key2];
    }

    return new (RustOption.apply(undefined, [type].concat(opts)))();
  },

  // deprecated
  Tuple: RustTuple,
  Vector: RustVector,
  Slice: RustSlice,
  String: RustString(),
  Str: RustStr(),
  Option: function ctor(type, value) {
    for (var _len3 = arguments.length, opts = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
      opts[_key3 - 2] = arguments[_key3];
    }

    return new (RustOption.apply(undefined, [type].concat(opts)))(value);
  },
  Some: function ctor(type, value) {
    for (var _len4 = arguments.length, opts = Array(_len4 > 2 ? _len4 - 2 : 0), _key4 = 2; _key4 < _len4; _key4++) {
      opts[_key4 - 2] = arguments[_key4];
    }

    return new (RustOption.apply(undefined, [type].concat(opts)))(value);
  },
  None: function ctor(type) {
    for (var _len5 = arguments.length, opts = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
      opts[_key5 - 1] = arguments[_key5];
    }

    return new (RustOption.apply(undefined, [type].concat(opts)))();
  }
};

exports.default = rust;

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _Struct = __webpack_require__(3);

var _Struct2 = _interopRequireDefault(_Struct);

var _types = __webpack_require__(0);

var _misc = __webpack_require__(1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// get the symbol for struct-data since we need access here
var DATA = typeof Symbol !== 'undefined' ? Symbol.for('struct-data') : '__data';

function ASArrayBuffer(typedef, n) {
  var type = (0, _types.parseType)(typedef);

  return new _Struct2.default({
    byteLength: 'usize',
    _: 'usize', // allocator alignment?
    values: [type, n]
  });
}

function ASArray(typedef, initialValues) {
  var type = (0, _types.parseType)(typedef);

  var Base = new _Struct2.default({
    ptr: _types.types.pointer('void'),
    length: 'usize'
    /* buffer */
    /* values */
  });

  Object.defineProperty(Base.prototype, 'buffer', {
    enumerable: true,

    get: function get() {
      var memory = this[DATA].view.buffer;
      var wrapper = this[DATA].wrapper;

      var AB = new ASArrayBuffer(type, this.length);
      var view = new DataView(memory, this.ptr.ref(), AB.width);

      return AB.read(view, wrapper);
    }
  });

  Object.defineProperty(Base.prototype, 'values', {
    enumerable: true,

    get: function get() {
      return this.buffer.values;
    },
    set: function set(values) {
      var n = values.length;
      var byteLength = n * type.width;

      var AB = new ASArrayBuffer(type, n);
      var buf = new AB({ byteLength: byteLength, values: values });

      this.ptr = new _types.Pointer(AB, buf);
      this.length = n;
    }
  });

  (0, _misc.addArrayFns)(Base);
  (0, _misc.makeIterable)(Base);

  var _Array = function (_Base) {
    _inherits(_Array, _Base);

    function _Array(values) {
      _classCallCheck(this, _Array);

      var _this = _possibleConstructorReturn(this, (_Array.__proto__ || Object.getPrototypeOf(_Array)).call(this));

      if (values) _this.values = values;
      return _this;
    }

    _createClass(_Array, [{
      key: 'free',
      value: function free() {
        _get(_Array.prototype.__proto__ || Object.getPrototypeOf(_Array.prototype), 'free', this).call(this, true); // free buffer_ too
      }
    }, {
      key: 'dataview',
      value: function dataview(field) {
        if (field === 'buffer') return this.buffer.dataview();
        if (field === 'values') return this.buffer.dataview('values');

        return _get(_Array.prototype.__proto__ || Object.getPrototypeOf(_Array.prototype), 'dataview', this).call(this, field);
      }
    }]);

    return _Array;
  }(Base);

  return initialValues ? new _Array(initialValues) : _Array;
}

exports.default = {
  array: ASArray
};

/***/ })
/******/ ]);
//# sourceMappingURL=wasm-ffi.browser.js.map