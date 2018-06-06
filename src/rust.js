import Struct from './Struct';
import { types, parseType, Pointer } from './types';
import { encode, decode } from './encoding';
import { assert, vslice, isNil, addStringFns, addArrayFns, makeIterable } from './misc';


// get the symbol for struct-data since we need access here
const DATA = (typeof Symbol !== 'undefined')
  ? Symbol.for('struct-data')
  : '__data';


function RustTuple(tupleTypes, values) {
  const fields = {};

  tupleTypes.forEach((type, i) => {
    fields[i] = parseType(type);
  });

  const Tuple = new Struct(fields);

  return (values)
    ? new Tuple(values)
    : Tuple;
}


function RustVector(typedef, initialValues) {
  const type = parseType(typedef);

  const Base = new Struct({
    ptr: types.pointer(type),
    cap: 'usize',
    length: 'usize',
    /* values */
  });

  Object.defineProperty(Base.prototype, 'values', {
    enumerable: true,

    get() {
      const memory = this[DATA].view.buffer;
      const wrapper = this[DATA].wrapper;

      const arrayType = parseType([type, this.length]);
      const view = new DataView(memory, this.ptr.ref(), arrayType.width);

      return arrayType.read(view, wrapper);
    },

    set(values) {
      this.ptr = new Pointer([type, values.length], values);
      this.length = values.length;
      this.cap = values.length;
    },
  });

  addArrayFns(Base);
  makeIterable(Base);

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
  const type = parseType(typedef);

  const Base = new Struct({
    ptr: types.pointer(type),
    length: 'usize',
    /* values */
  });

  Object.defineProperty(Base.prototype, 'values', {
    enumerable: true,

    get() {
      const memory = this[DATA].view.buffer;
      const wrapper = this[DATA].wrapper;

      const arrayType = parseType([type, this.length]);
      const view = new DataView(memory, this.ptr.ref(), arrayType.width);

      return arrayType.read(view, wrapper);
    },

    set(values) {
      this.ptr = new Pointer([type, values.length], values);
      this.length = values.length;
    },
  });

  addArrayFns(Base);
  makeIterable(Base);

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
  const Base = new Struct({
    ptr: types.pointer('u8'),
    length: 'usize',
    cap: 'usize',
    /* value */
  });

  Object.defineProperty(Base.prototype, 'value', {
    enumerable: true,

    get() {
      const memory = this[DATA].view.buffer;
      const buf = new Uint8Array(memory, this.ptr.ref(), this.length);

      return decode(buf);
    },

    set(str) {
      const buf = encode(str);

      this.ptr = new Pointer(['u8', buf.length], buf);
      this.length = buf.length;
      this.cap    = buf.length;
    },
  });

  addStringFns(Base);

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
  const Base = new Struct({
    ptr: types.pointer('u8'),
    length: 'usize',
    /* value */
  });

  Object.defineProperty(Base.prototype, 'value', {
    enumerable: true,

    get() {
      const memory = this[DATA].view.buffer;
      const buf = new Uint8Array(memory, this.ptr.ref(), this.length);

      return decode(buf);
    },

    set(str) {
      const buf = encode(str);

      this.ptr = new Pointer(['u8', buf.length], buf);
      this.length = buf.length;
    },
  });

  addStringFns(Base);

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
  const type = parseType(typedef);
  let discriminant;

  if (tagSize) discriminant = types[`uint${tagSize * 8}`];
  else if (type.alignment === 1) discriminant = 'uint8';
  else if (type.alignment === 2) discriminant = 'uint16';
  else discriminant = 'uint32';

  const fields = (isNonNullable)
    ? { value: type }
    : { discriminant, value: type };

  const Base = new Struct(fields);

  class OptionType extends Base {
    constructor(value) {
      super();
      this.value = value;
      this.discriminant = (isNil(value)) ? 0 : 1;
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
      if (isNil(struct) || !struct.constructor.isStruct) {
        struct = new Enum(struct);
      }

      const tag = struct.tag();
      const type = vtypes[tag];
      let value = (struct.ref()) ? struct.value : struct[DATA].temp.value;

      if (type.isStruct && (isNil(value) || !value.constructor.isStruct)) {
        value = new type(value);
      }

      const field_1 = vslice(view, 0, discriminant.width);
      discriminant.write(field_1, tag);

      const field_2 = vslice(view, discriminant.width, type.width);
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


export default rust;
