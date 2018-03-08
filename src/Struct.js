import { parseType, types, CString } from './types';
import { assert, vslice } from './misc';


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
        assert(key in this, `Struct missing field '${key}'`);
        assert(key !== 'ref', 'Field `ref` is a reserved method name');
        assert(key !== 'free', 'Field `free` is a reserved method name');
        // this should trigger the get/setter behavior
        this[key] = value;
      });
    }
  }

  ref() {
    return (this[DATA].view) ? this[DATA].view.byteOffset : 0;
  }

  free(recursive = false) {
    assert(!!this[DATA].free,
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
        const fieldView = vslice(view, field.offset, field.type.width);
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
          return field.type.read(view, this[DATA].free);
        },

        set(value) {
          // fudging for ease of use:
          if (typeof value === 'string' && field.type === types.string) {
            value = new CString(value);
          }

          if (!this[DATA].view) {
            this[DATA].temp[name] = value;
            return;
          }

          const view = vslice(this[DATA].view, field.offset, field.type.width);
          field.type.write(view, value);
        },
      });
    });

    return StructType;
  }
}


export default Struct;
