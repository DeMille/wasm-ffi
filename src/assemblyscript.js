import Struct from './Struct';
import { types, parseType, Pointer } from './types';
import { addArrayFns, makeIterable } from './misc';


// get the symbol for struct-data since we need access here
const DATA = (typeof Symbol !== 'undefined')
  ? Symbol.for('struct-data')
  : '__data';


function ASArrayBuffer(typedef, n) {
  const type = parseType(typedef);

  return new Struct({
    byteLength: 'usize',
    _:          'usize', // allocator alignment?
    values:     [type, n],
  });
}


function ASArray(typedef, initialValues) {
  const type = parseType(typedef);

  const Base = new Struct({
    ptr: types.pointer('void'),
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

      this.ptr = new Pointer(AB, buf);
      this.length = n;
    },
  });

  addArrayFns(Base);
  makeIterable(Base);

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


export default {
  array: ASArray,
};
