import { assert, vslice, toUint8Array, addStringFns } from './misc';


// Makes a type of a given size.
// Optional read / write methods, just gives a DataView by default.
class CustomType {
  constructor(size, opts = {}) {
    assert(!isNaN(size), 'Type size must be a number, given: %s', size);

    this.width = size;
    this.alignment = ('alignment' in opts) ? opts.alignment : size;

    if (opts.read) this.read = opts.read;
    if (opts.write) this.write = opts.write;
  }

  read(view) {
    return view;
  }

  write(view, value) {
    assert(value instanceof ArrayBuffer || ArrayBuffer.isView(value),
      'Value must be an `ArrayBuffer` or a `DataView` (like `Uint8Array`)');

    toUint8Array(view).set(toUint8Array(value));
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
    assert(this.view, 'Trying to deref an unallocated pointer');
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
    assert(this.view, 'Cant free pointer: unallocated / already freed');

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
      assert(value instanceof Pointer, `Trying to write ${value} as a pointer`);

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
    assert(!!this.view, 'Cant commit StringPointer, no view!');

    if (this._tempBuf) {
      const memory = new Uint8Array(this.view.buffer);
      memory.set(this._tempBuf, this.view.byteOffset);
    }
  }

  ref() {
    return (this.view) ? this.view.byteOffset : 0;
  }

  deref() {
    assert(this.view, 'Trying to deref an unallocated StringPointer');
    return this.wrapper.decodeString(this.view);
  }

  free() {
    assert(!!this.view, 'Cant free StringPointer: unallocated / already freed');
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

addStringFns(StringPointer);


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
      const subview = vslice(view, i * this.type.width, this.type.width);
      arr.push(this.type.read(subview, wrapper));
    }

    return arr;
  }

  write(view, values, wrapper) {
    assert(values.length === this.length,
      'Values length does not match struct array length');

    values.forEach((value, i) => {
      const subview = vslice(view, i * this.type.width, this.type.width);
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
    assert(typedef.length === 2,
      'Array type needs 2 arguments: [type, length], given: \n%s', typedef);

    const type = parseType(typedef[0]);
    const length = typedef[1];

    return new ArrayType(type, length);
  }

  // make sure its an ok type interface
  const errMsg = "Given argument type isn't a proper 'type' interface: \n%s";
  assert('width' in typedef, errMsg, typedef);
  assert('alignment' in typedef, errMsg, typedef);
  assert('read' in typedef, errMsg, typedef);
  assert('write' in typedef, errMsg, typedef);

  return typedef;
}


export { types, CustomType, Pointer, StringPointer, parseType };
