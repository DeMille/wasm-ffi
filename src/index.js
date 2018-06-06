import { Wrapper, cwrap, ccall } from './Wrapper';
import Struct from './Struct';
import demangle from './demangle';
import rust from './rust';
import assemblyscript from './assemblyscript';
import { types, Pointer, StringPointer, CustomType } from './types';

import { encodeUTF8, decodeUTF8 } from './encoding';
const _encodeUTF8 = encodeUTF8;
const _decodeUTF8 = decodeUTF8;

const CString = StringPointer;

export default {
  Wrapper,
  cwrap,
  ccall,
  Struct,
  types,
  CustomType,
  Pointer,
  StringPointer,
  CString, // deprecated
  demangle,
  rust,
  assemblyscript,
  _encodeUTF8,
  _decodeUTF8,
};

export {
  Wrapper,
  cwrap,
  ccall,
  Struct,
  types,
  CustomType,
  Pointer,
  StringPointer,
  CString, // deprecated
  demangle,
  rust,
  assemblyscript,
  _encodeUTF8,
  _decodeUTF8,
};
