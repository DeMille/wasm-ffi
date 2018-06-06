function encodeUTF16(str) {
  const buf = new ArrayBuffer(str.length * 2); // 2 per char
  const arr = new Uint16Array(buf);

  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i);
  }

  return new Uint8Array(buf);
}

function decodeUTF16(buf) {
  const len = buf.byteLength;
  const num = (len % 2) ? ((len + 1) / 2) : (len / 2);
  const pts = new Uint16Array(buf.buffer, buf.byteOffset, num);

  return String.fromCharCode(...pts);
}

// utf8 decode/encode adapted from the buffer module
// @ github.com/feross/buffer
//
function encodeUTF8(str) {
  let codePoint;
  let leadSurrogate = null;
  let units = Infinity;

  const bytes = [];

  for (let i = 0; i < str.length; ++i) {
    codePoint = str.charCodeAt(i);

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue;

        } else if (i + 1 === str.length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          continue;
        }

        // valid lead
        leadSurrogate = codePoint;
        continue;
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        leadSurrogate = codePoint;
        continue;
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
    }

    leadSurrogate = null;

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break;
      bytes.push(codePoint);

    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break;
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      );

    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break;
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );

    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break;
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      );

    } else {
      throw new Error('Invalid code point');
    }
  }

  return Uint8Array.from(bytes);
}


function decodeUTF8(buf) {
  const start = 0; // view.byteOffset;
  const end = buf.length;

  const pts = [];
  let i = start;

  while (i < end) {
    const firstByte = buf[i];
    let codePoint = null;

    let bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1;

    if (i + bytesPerSequence <= end) {
      let secondByte, thirdByte, fourthByte, tempCodePoint;

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }
          break;
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint;
            }
          }
          break;
        default:
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD;
      bytesPerSequence = 1;
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      pts.push(codePoint >>> 10 & 0x3FF | 0xD800);
      codePoint = 0xDC00 | codePoint & 0x3FF;
    }

    pts.push(codePoint);
    i += bytesPerSequence;
  }

  // Based on http://stackoverflow.com/a/22747272/680742, the browser with
  // the lowest limit is Chrome, with 0x10000 args.
  // We go 1 magnitude less, for safety
  const MAX = 0x1000;

  if (pts.length <= MAX) {
    return String.fromCharCode.call(String, ...pts); // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  let str = '';
  let j = 0;

  while (j < pts.length) {
    str += String.fromCharCode.call(String, ...pts.slice(j, j += MAX));
  }

  return str;
}


function encode(str, type) {
  if (type === 'utf-16') return encodeUTF16(str);

  return (typeof TextEncoder !== 'undefined')
    ? (new TextEncoder()).encode(str)
    : encodeUTF8(str);
}


function decode(str, type) {
  if (type === 'utf-16') return decodeUTF16(str);

  return (typeof TextDecoder !== 'undefined')
    ? (new TextDecoder()).decode(str)
    : decodeUTF8(str);
}


export { encode, decode, encodeUTF8, decodeUTF8 };
