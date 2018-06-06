import { parseType } from './types';
import { assert, vslice, isNil } from './misc';


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
        assert(key in this, `Can't set value, struct missing field '${key}'`);
        this[key] = value;
      });
    }
  }

  ref() {
    return (this[DATA].view) ? this[DATA].view.byteOffset : 0;
  }

  free(internal = false) {
    assert(!!this[DATA].wrapper,
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
    assert(!!view, "Struct hasn't been written yet, can't get dataview");

    if (!name) return view;

    const StructType = this.constructor;
    const field = StructType.fields.get(name);
    assert(!!field, `Field '${name}' doesn't exist on struct`);

    return vslice(view, field.offset, field.type.width);
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

    if (isNil(struct) || !struct.constructor.isStruct) {
      struct = new StructType(struct);
    }

    StructType.fields.forEach((field, name) => {
      const type = field.type;
      let value = struct[name];

      if (typeof value !== 'undefined') {
        if (type.isStruct && (isNil(value) || !value.constructor.isStruct)) {
          value = new type(value);
        }

        const fieldView = vslice(view, field.offset, type.width);
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
      assert(!(names in names), `Field '${name}' is a reserved method name`));

    // keep metadata on the constructor itself
    class StructType extends AbstractStructType {}
    StructType.fields = new Map();
    StructType.packed = ('packed' in opt) ? !!opt.packed : false;
    StructType.alignment = opt.alignment || 0;
    StructType.isStruct = true;

    let offset = 0;

    // get type/size/alignment for each field
    names.forEach((name) => {
      const type = parseType(fields[name]);

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

          const view = vslice(this[DATA].view, field.offset, field.type.width);
          return field.type.read(view, this[DATA].wrapper);
        },

        set(value) {
          if (!this[DATA].view) {
            this[DATA].temp[name] = value;
            return;
          }

          const view = vslice(this[DATA].view, field.offset, field.type.width);
          field.type.write(view, value, this[DATA].wrapper);
        },
      });
    });

    return StructType;
  }
}


export default Struct;
