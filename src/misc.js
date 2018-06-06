// simple assert, throws if assertion fails
// also matches args to %s formatters
export function assert(condition, errMsg, ...args) {
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
export function vslice(view, start, length) {
  return new DataView(view.buffer, view.byteOffset + start, length);
}


export function toUint8Array(arr) {
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}


export function isNil(thing) {
  return thing === null || typeof thing === 'undefined';
}


const has = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
const isFunction = thing => (typeof thing === 'function');


export function addStringFns(StringLike) {
  assert(!!has(StringLike.prototype, 'value'), 'Missing `value` property');

  Object.getOwnPropertyNames(String.prototype).forEach((prop) => {
    if (has(StringLike.prototype, prop)) return;
    if (!isFunction(String.prototype[prop])) return;

    StringLike.prototype[prop] = function(...args) {
      return this.value[prop](...args);
    };
  });
}


export function addArrayFns(ArrayLike) {
  assert(!!has(ArrayLike.prototype, 'values'), 'Missing `values` property');

  Object.getOwnPropertyNames(Array.prototype).forEach((prop) => {
    if (has(ArrayLike.prototype, prop)) return;
    if (!isFunction(Array.prototype[prop])) return;

    ArrayLike.prototype[prop] = function(...args) {
      return this.values[prop](...args);
    };
  });
}


export function makeIterable(ArrayLike) {
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
