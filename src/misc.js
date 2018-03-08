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
