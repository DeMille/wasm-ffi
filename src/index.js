import { Wrapper, cwrap, ccall } from './Wrapper';
import Struct from './Struct';
import demangle from './demangle';
import { types, Pointer, CString, CustomType } from './types';
import rust from './rust';

import { encodeUTF8, decodeUTF8 } from './encoding';
const _encodeUTF8 = encodeUTF8;
const _decodeUTF8 = decodeUTF8;


export default {
  Wrapper,
  cwrap,
  ccall,
  Struct,
  types,
  Pointer,
  CustomType,
  CString,
  demangle,
  rust,
  _encodeUTF8,
  _decodeUTF8,
};

export {
  Wrapper,
  cwrap,
  ccall,
  Struct,
  types,
  Pointer,
  CustomType,
  CString,
  demangle,
  rust,
  _encodeUTF8,
  _decodeUTF8,
};
