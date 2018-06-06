// Rust demangle logic adpated from Alex Crichton's ructc-demangle:
// http://alexcrichton.com/rustc-demangle/src/rustc_demangle/lib.rs.html
const symbols = [
  [/^_\$/, '$'],
  [/\$C\$/g, ','],
  [/\$SP\$/g, '@'],
  [/\$BP\$/g, '*'],
  [/\$RF\$/g, '&'],
  [/\$LT\$/g, '<'],
  [/\$GT\$/g, '>'],
  [/\$LP\$/g, '('],
  [/\$RP\$/g, ')'],
  [/\$u7e\$/g, '~'],
  [/\$u20\$/g, ' '],
  [/\$u27\$/g, "'"],
  [/\$u5b\$/g, '['],
  [/\$u5d\$/g, ']'],
  [/\$u7b\$/g, '{'],
  [/\$u7d\$/g, '}'],
  [/\$u3b\$/g, ';'],
  [/\$u2b\$/g, '+'],
  [/\$u22\$/g, '"'],
  [/\.\./g, '::'],
];

function isHash(str) {
  return str.length &&
    str[0] === 'h' &&
    str.split('').slice(1).every(char => /[0-9a-f]/i.test(char));
}

// replaces all symbols in string, returning a new string
function replaceAllSymbols(str) {
  return symbols.reduce(
    (result, [re, char]) => result.replace(re, char),
    str
  );
}

// Basic rust demangle rules:
// - starts with "ZN | _ZN | __ZN" and ends in "E"
// - name is made up of chunks. chunks are length prefixed
//
// Bails early if string isn't a valid rust mangle
//
function demangle(mangled = '') {
  const startsWith = sub => mangled.indexOf(sub) === 0;
  const endsWith = sub => mangled.slice(-1) === sub;
  let inner;

  if (!endsWith('E')) return mangled;

  if (startsWith('ZN')) inner = mangled.slice(2, -1);
  else if (startsWith('_ZN')) inner = mangled.slice(3, -1);
  else if (startsWith('__ZN')) inner = mangled.slice(4, -1);

  if (!inner) return mangled;

  const chars = inner.split('');
  const labels = [];
  let label = '';
  let digits = '';
  let length = 0;

  chars.forEach((char) => {
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
        digits = '';   // clear for next time
        label += char; // add first char to label
        length--;      // decrement
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
export default function demangleStack(err) {
  // matches error stack line patterns in chrome and firefox
  // chrome: "at function_name (..."
  // firefox: "function_name @ ..."
  const re = /(?:at (.+) \()|(?:(.+)<?@)/;

  // replaces matches, if found, with the demangled identifier
  err.stack = err.stack
    .split('\n')
    .map(line => line.replace(re, (_, m1, m2) => `at ${demangle(m1 || m2)} (`))
    .join('\n');

  return err;
}
