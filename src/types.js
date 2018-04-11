import { Encoder, Decoder } from './encoding';
import { assert, vslice } from './misc';


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
    assert(this.view, 'Trying to deref an unallocated pointer');
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
    assert(this.view, 'Cant free pointer: unallocated / already freed');

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
      assert(value instanceof Pointer, `Trying to write ${value} as a pointer`);
      assert(value.ref(), 'Cant write pointer, hasnt been allocated yet');
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
      this._temp = (new Encoder()).encode(value);
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
    assert(this.view, 'Trying to deref an unallocated CString');

    const memory = new Uint8Array(this.view.buffer);
    const addr = this.view.byteOffset;
    const end = addr + this.type.width - 1;

    // `subarray` uses the same underlying ArrayBuffer
    const buf = new Uint8Array(memory.subarray(addr, end));
    const str = (new Decoder()).decode(buf);

    return str;
  }

  free() {
    assert(!!this.view, 'Cant free cstring: unallocated / already freed');

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
    assert(value instanceof CString, 'value must be a `CString`');
    assert(value.ref(), 'Cant write CString, hasnt been allocated yet');
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
      const subview = vslice(view, i * this.type.width, this.type.width);
      arr.push(this.type.read(subview, free));
    }

    return arr;
  }

  write(view, values) {
    assert(values.length === this.length,
      'Values length does not match struct array length');

    values.forEach((value, i) => {
      const subview = vslice(view, i * this.type.width, this.type.width);
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


export { types, CustomType, Pointer, CString, parseType };
