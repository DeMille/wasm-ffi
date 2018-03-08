import Struct from './Struct';
import { types, parseType, Pointer } from './types';
import { assert, vslice } from './misc';


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
    fields[i] = parseType(type);
  });

  return new Struct(fields);
}


function RustVector(typedef) {
  const type = parseType(typedef);

  const Vector = extend(new Struct({
    ptr: types.pointer(type),
    cap: 'usize',
    len: 'usize',
    /* values */
  }));

  Object.defineProperty(Vector.prototype, 'values', {
    enumerable: true,

    get() {
      const arrayType = parseType([type, this.len]);
      const memory = this[DATA].view.buffer;
      const view = new DataView(memory, this.ptr.ref(), arrayType.width);

      return arrayType.read(view, this[DATA].free);
    },

    set(values) {
      const len = values.length;

      this.ptr = new Pointer([type, len], values);
      this.len = len;
      this.cap = len;
    },
  });

  return Vector;
}


function RustSlice(typedef) {
  const type = parseType(typedef);

  const Slice = extend(new Struct({
    ptr: types.pointer(type),
    len: 'usize',
    /* values */
  }));

  Object.defineProperty(Slice.prototype, 'values', {
    enumerable: true,

    get() {
      const arrayType = parseType([type, this.len]);
      const memory = this[DATA].view.buffer;
      const view = new DataView(memory, this.ptr.ref(), arrayType.width);

      return arrayType.read(view, this[DATA].free);
    },

    set(values) {
      const len = values.length;

      this.ptr = new Pointer([type, len], values);
      this.len = len;
    },
  });

  return Slice;
}


function RustString() {
  const RString = extend(new Struct({
    ptr: types.pointer('u8'),
    cap: 'usize',
    len: 'usize',
    /* value */
  }));

  Object.defineProperty(RString.prototype, 'value', {
    enumerable: true,

    get() {
      const memory = this[DATA].view.buffer;
      const view = new DataView(memory, this.ptr.ref(), this.len);

      return (new TextDecoder()).decode(view);
    },

    set(str) {
      const buf = (new TextEncoder()).encode(str);
      const len = buf.length;

      this.ptr = new Pointer(['u8', len], buf);
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
  const RStr = extend(new Struct({
    ptr: types.pointer('u8'),
    len: 'usize',
    /* value */
  }));

  Object.defineProperty(RStr.prototype, 'value', {
    enumerable: true,

    get() {
      const memory = this[DATA].view.buffer;
      const view = new DataView(memory, this.ptr.ref(), this.len);

      return (new TextDecoder()).decode(view);
    },

    set(str) {
      const buf = (new TextEncoder()).encode(str);
      const len = buf.length;

      this.ptr = new Pointer(['u8', len], buf);
      this.len = len;
    },
  });

  RStr.prototype.toString = function() {
    return this.value;
  };

  return RStr;
}


function RustOption(typedef, isNonNullable = false, tagSize) {
  const type = parseType(typedef);
  let discriminant;

  if (tagSize) discriminant = types[`uint${tagSize * 8}`];
  else if (type.alignment === 1) discriminant = 'uint8';
  else if (type.alignment === 2) discriminant = 'uint16';
  else discriminant = 'uint32';

  const fields = (isNonNullable)
    ? { value: type }
    : { discriminant, value: type };

  const Option = new Struct(fields);

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
  const vtypes = variants.map(name => parseType(obj[name]));
  const discriminant = types[`uint${tagSize * 8}`];

  const StructType = new Struct({
    discriminant,
    /* value */
  });

  class Enum extends StructType {
    constructor(variant) {
      super();
      if (variant) this._set(variant);
    }

    _set(variant) {
      assert(Object.keys(variant).length === 1, 'Enum value must be a variant');

      const [name, value] = Object.entries(variant)[0];

      this.discriminant = variants.indexOf(name);
      this.value = value;
    }

    tag() {
      const tag = this.discriminant;
      assert(tag <= variants.length, 'Enum discriminant > than # of variants');
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

      const field_1 = vslice(view, 0, discriminant.width);
      discriminant.write(field_1, tag);

      const field_2 = vslice(view, discriminant.width, type.width);
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
  Tuple: (type, values) => new (RustTuple(...type))([...values]),

  vector: RustVector,
  Vector: (type, values) => new (RustVector(type))({ values }),

  slice: RustSlice,
  Slice: (type, values) => new (RustSlice(type))({ values }),

  string: RustString(),
  String: str => new (rust.string)({ value: str }),

  str: RustStr(),
  Str: str => new (rust.str)({ value: str }),

  option: RustOption,
  Option: (type, value, ...opts) => new (RustOption(type, ...opts))({
    value,
    discriminant: (typeof value === 'undefined') ? 0 : 1,
  }),

  Some: (...args) => rust.Option(...args),
  None: (type, ...opts) => rust.Option(type, undefined, ...opts),

  enum: RustEnum,
};

export default rust;
