/* eslint-disable */

var baseURL = (typeof ffi !== 'undefined') ? '' : './tests/';

if (typeof TextEncoder === 'undefined' && typeof require !== 'undefined') {
  TextEncoder = require('util').TextEncoder;
}

if (typeof TextDecoder === 'undefined' && typeof require !== 'undefined') {
  TextDecoder = require('util').TextDecoder;
}

ffi = (typeof ffi !== 'undefined') ? ffi : require('../');
expect = (typeof expect !== 'undefined') ? expect : require('expect.js');


if (!ffi) {
  alert("`ffi` not found, check webpack");
}

var Wrapper    = ffi.Wrapper;
var cwrap      = ffi.cwrap;
var ccall      = ffi.ccall;
var Struct     = ffi.Struct;
var types      = ffi.types;
var Pointer    = ffi.Pointer;
var CString    = ffi.CString;
var CustomType = ffi.CustomType;
var demangle   = ffi.demangle;
var rust       = ffi.rust;


function structPadding(StructType) {
  var buf = new ArrayBuffer(StructType.width);
  var uint8 = new Uint8Array(buf);

  var dummy = 0;
  var output = '';

  StructType.fields.forEach(function(field) {
    var n = field.type.width;
    dummy++;

    while (n--) uint8[field.offset + n] = dummy;
  });

  uint8.toString().split(',').forEach(function(v, i) {
    if (i && i % 4 === 0) output += ' ';
    if (v === '0') output += 'x';
    else output += v;
  });

  return output;
}


describe('Struct', function() {
  describe('padding / alignment / size', function() {
    it('simple', function() {
      var Test = new Struct({
        a: 'char',
        b: 'char',
        c: 'char',
        d: 'char',
      });

      var repr = '1234';

      expect(Test.width).to.equal(4);
      expect(Test.alignment).to.equal(1);
      expect(structPadding(Test)).to.equal(repr);
    });

    it('padding, middle and end', function() {
      var Test = new Struct({
        a: 'char',
        b: 'uint',
        c: 'ushort',
      });

      var repr = '1xxx 2222 33xx';

      expect(Test.width).to.equal(12);
      expect(Test.alignment).to.equal(4);
      expect(structPadding(Test)).to.equal(repr);
    });

    it('no padding option', function() {
      var Test = new Struct({
        a: 'char',
        b: 'uint',
        c: 'ushort',
      }, {
        packed: true,
      });

      var repr = '1222 233x';

      expect(Test.width).to.equal(8);
      expect(Test.alignment).to.equal(4);
      expect(structPadding(Test)).to.equal(repr);
    });

    it('array types', function() {
      var Test = new Struct({
        a: 'i8',
        b: 'i32',
        c: 'i16',
        d: ['u64', 2],
        e: 'i16',
      });

      var repr = '1xxx 2222 33xx xxxx 4444 4444 4444 4444 55xx xxxx';

      expect(Test.width).to.equal(40);
      expect(Test.alignment).to.equal(8);
      expect(structPadding(Test)).to.equal(repr);
    });

    it('complex types', function() {
      var One = new Struct({ a: 'i8', b: 'i32', c: 'i16' });
      var Two = new Struct({ a: ['u8', 3], });
      var Three = new Struct({ a: 'u16', b: Two });

      var Test = new Struct({
        a: 'i8',
        b: 'i32',
        c: One,
        d: [Three, 2],
        e: 'i16',
      });

      var repr = '1xxx 2222 3333 3333 3333 4444 4444 4444 55xx';

      expect(Test.width).to.equal(36);
      expect(Test.alignment).to.equal(4);
      expect(structPadding(Test)).to.equal(repr);
    });
  });
});


describe('demangle', function() {
  describe('rust', function() {
    function check(input, out) {
      var err = { stack: 'at ' + input + ' (' };
      var expected = 'at ' + out + ' (';
      expect(demangle(err).stack).to.equal(expected);
    }

    it('basic length scheme', function() {
      check('test', 'test');
      check('_ZN4test', '_ZN4test');
      check('_ZN4testE', 'test');
      check('_ZN4test1a2bcE', 'test::a::bc');
    });

    it('unicode symbols', function() {
      check('_ZN4$RP$E', ')');
      check('_ZN8$RF$testE', '&test');
      check('_ZN8$BP$test4foobE', '*test::foob');
      check('_ZN9$u20$test4foobE', ' test::foob');
      check('_ZN35Bar$LT$$u5b$u32$u3b$$u20$4$u5d$$GT$E', 'Bar<[u32; 4]>');
      check('_ZN13test$u20$test4foobE', 'test test::foob');
      check('_ZN12test$BP$test4foobE', 'test*test::foob');
    });

    it('platform differences', function() {
      check('ZN4testE', 'test');
      check('ZN13test$u20$test4foobE', 'test test::foob');
      check('ZN12test$RF$test4foobE', 'test&test::foob');
      check('__ZN12test$RF$test4foobE', 'test&test::foob');
    });

    it('hashes & complex mangles', function() {
      check('_ZN3fooE', 'foo');
      check('_ZN3foo3barE', 'foo::bar');
      check('_ZN3foo20h05af221e174051e9abcE', 'foo');
      check('_ZN3foo5h05afE', 'foo');
      check('_ZN17h05af221e174051e93fooE', 'h05af221e174051e9::foo');
      check('_ZN3foo16ffaf221e174051e9E', 'foo::ffaf221e174051e9');
      check('_ZN3foo17hg5af221e174051e9E', 'foo::hg5af221e174051e9');
      check('__ZN38_$LT$core..option..Option$LT$T$GT$$GT$6unwrap18_MSG_FILE_LINE_COL17haf7cb8d5824ee659E',
        '<core::option::Option<T>>::unwrap::_MSG_FILE_LINE_COL');
      check('__ZN5alloc9allocator6Layout9for_value17h02a996811f781011E',
        'alloc::allocator::Layout::for_value');
      check('__ZN4core5slice89_$LT$impl$u20$core..iter..traits..IntoIterator$u20$for$u20$$RF$$u27$a$u20$$u5b$T$u5d$$GT$9into_iter17h450e234d27262170E',
        'core::slice::<impl core::iter::traits::IntoIterator for &\'a [T]>::into_iter');
      check('_ZN71_$LT$Test$u20$$u2b$$u20$$u27$static$u20$as$u20$foo..Bar$LT$Test$GT$$GT$3barE',
        '<Test + \'static as foo::Bar<Test>>::bar');
    });
  });
});


describe('Text Encoding', function() {
  var encode = ffi._encodeUTF8;
  var decode = ffi._decodeUTF8;

  describe('TextDecoder polyfill', function() {
    it('utf8 replacement chars (1 byte sequence)', function() {
      expect(decode(new Uint8Array([0x80]))).to.be('\uFFFD');
      expect(decode(new Uint8Array([0x7F]))).to.be('\u007F');
    });

    it('utf8 replacement chars (2 byte sequences)', function() {
      expect(decode(new Uint8Array([0xC7]))).to.be('\uFFFD');
      expect(decode(new Uint8Array([0xC7, 0xB1]))).to.be('\u01F1');
      expect(decode(new Uint8Array([0xC0, 0xB1]))).to.be('\uFFFD\uFFFD');
      expect(decode(new Uint8Array([0xC1, 0xB1]))).to.be('\uFFFD\uFFFD');
    });

    it('utf8 replacement chars (3 byte sequences)', function() {
      expect(decode(new Uint8Array([0xE0]))).to.be('\uFFFD');
      expect(decode(new Uint8Array([0xE0, 0xAC]))).to.be('\uFFFD\uFFFD');
      expect(decode(new Uint8Array([0xE0, 0xAC, 0xB9]))).to.be('\u0B39');
    });

    it('utf8 replacement chars (4 byte sequences)', function() {
      expect(decode(new Uint8Array([0xF4]))).to.be('\uFFFD');
      expect(decode(new Uint8Array([0xF4, 0x8F]))).to.be('\uFFFD\uFFFD');
      expect(decode(new Uint8Array([0xF4, 0x8F, 0x80]))).to.be('\uFFFD\uFFFD\uFFFD');
      expect(decode(new Uint8Array([0xF4, 0x8F, 0x80, 0x84]))).to.be('\uDBFC\uDC04');
      expect(decode(new Uint8Array([0xFF]))).to.be('\uFFFD');
      expect(decode(new Uint8Array([0xFF, 0x8F, 0x80, 0x84]))).to.be('\uFFFD\uFFFD\uFFFD\uFFFD');
    });

    it('utf8 replacement chars on 256 random bytes', function() {
      expect(decode(new Uint8Array([152, 130, 206, 23, 243, 238, 197, 44, 27, 86, 208, 36, 163, 184, 164, 21, 94, 242, 178, 46, 25, 26, 253, 178, 72, 147, 207, 112, 236, 68, 179, 190, 29, 83, 239, 147, 125, 55, 143, 19, 157, 68, 157, 58, 212, 224, 150, 39, 128, 24, 94, 225, 120, 121, 75, 192, 112, 19, 184, 142, 203, 36, 43, 85, 26, 147, 227, 139, 242, 186, 57, 78, 11, 102, 136, 117, 180, 210, 241, 92, 3, 215, 54, 167, 249, 1, 44, 225, 146, 86, 2, 42, 68, 21, 47, 238, 204, 153, 216, 252, 183, 66, 222, 255, 15, 202, 16, 51, 134, 1, 17, 19, 209, 76, 238, 38, 76, 19, 7, 103, 249, 5, 107, 137, 64, 62, 170, 57, 16, 85, 179, 193, 97, 86, 166, 196, 36, 148, 138, 193, 210, 69, 187, 38, 242, 97, 195, 219, 252, 244, 38, 1, 197, 18, 31, 246, 53, 47, 134, 52, 105, 72, 43, 239, 128, 203, 73, 93, 199, 75, 222, 220, 166, 34, 63, 236, 11, 212, 76, 243, 171, 110, 78, 39, 205, 204, 6, 177, 233, 212, 243, 0, 33, 41, 122, 118, 92, 252, 0, 157, 108, 120, 70, 137, 100, 223, 243, 171, 232, 66, 126, 111, 142, 33, 3, 39, 117, 27, 107, 54, 1, 217, 227, 132, 13, 166, 3, 73, 53, 127, 225, 236, 134, 219, 98, 214, 125, 148, 24, 64, 142, 111, 231, 194, 42, 150, 185, 10, 182, 163, 244, 19, 4, 59, 135, 16]))).to.be('\uFFFD\uFFFD\uFFFD\u0017\uFFFD\uFFFD\uFFFD\u002C\u001B\u0056\uFFFD\u0024\uFFFD\uFFFD\uFFFD\u0015\u005E\uFFFD\uFFFD\u002E\u0019\u001A\uFFFD\uFFFD\u0048\uFFFD\uFFFD\u0070\uFFFD\u0044\uFFFD\uFFFD\u001D\u0053\uFFFD\uFFFD\u007D\u0037\uFFFD\u0013\uFFFD\u0044\uFFFD\u003A\uFFFD\uFFFD\uFFFD\u0027\uFFFD\u0018\u005E\uFFFD\u0078\u0079\u004B\uFFFD\u0070\u0013\uFFFD\uFFFD\uFFFD\u0024\u002B\u0055\u001A\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\u0039\u004E\u000B\u0066\uFFFD\u0075\uFFFD\uFFFD\uFFFD\u005C\u0003\uFFFD\u0036\uFFFD\uFFFD\u0001\u002C\uFFFD\uFFFD\u0056\u0002\u002A\u0044\u0015\u002F\uFFFD\u0319\uFFFD\uFFFD\uFFFD\u0042\uFFFD\uFFFD\u000F\uFFFD\u0010\u0033\uFFFD\u0001\u0011\u0013\uFFFD\u004C\uFFFD\u0026\u004C\u0013\u0007\u0067\uFFFD\u0005\u006B\uFFFD\u0040\u003E\uFFFD\u0039\u0010\u0055\uFFFD\uFFFD\u0061\u0056\uFFFD\uFFFD\u0024\uFFFD\uFFFD\uFFFD\uFFFD\u0045\uFFFD\u0026\uFFFD\u0061\uFFFD\uFFFD\uFFFD\uFFFD\u0026\u0001\uFFFD\u0012\u001F\uFFFD\u0035\u002F\uFFFD\u0034\u0069\u0048\u002B\uFFFD\uFFFD\uFFFD\u0049\u005D\uFFFD\u004B\uFFFD\u0726\u0022\u003F\uFFFD\u000B\uFFFD\u004C\uFFFD\uFFFD\u006E\u004E\u0027\uFFFD\uFFFD\u0006\uFFFD\uFFFD\uFFFD\uFFFD\u0000\u0021\u0029\u007A\u0076\u005C\uFFFD\u0000\uFFFD\u006C\u0078\u0046\uFFFD\u0064\uFFFD\uFFFD\uFFFD\uFFFD\u0042\u007E\u006F\uFFFD\u0021\u0003\u0027\u0075\u001B\u006B\u0036\u0001\uFFFD\uFFFD\uFFFD\u000D\uFFFD\u0003\u0049\u0035\u007F\uFFFD\uFFFD\uFFFD\uFFFD\u0062\uFFFD\u007D\uFFFD\u0018\u0040\uFFFD\u006F\uFFFD\uFFFD\u002A\uFFFD\uFFFD\u000A\uFFFD\uFFFD\uFFFD\u0013\u0004\u003B\uFFFD\u0010');
    });

    it('utf8 replacement chars for anything in the surrogate pair range', function() {
      expect(decode(new Uint8Array([0xED, 0x9F, 0xBF]))).to.be('\uD7FF');
      expect(decode(new Uint8Array([0xED, 0xA0, 0x80]))).to.be('\uFFFD\uFFFD\uFFFD');
      expect(decode(new Uint8Array([0xED, 0xBE, 0x8B]))).to.be('\uFFFD\uFFFD\uFFFD');
      expect(decode(new Uint8Array([0xED, 0xBF, 0xBF]))).to.be('\uFFFD\uFFFD\uFFFD');
      expect(decode(new Uint8Array([0xEE, 0x80, 0x80]))).to.be('\uE000');
    });

    it('utf8 don\'t replace the replacement char', function() {
      expect(decode(encode('\uFFFD'))).to.be('\uFFFD');
    });
  });

  describe('TextEncoder polyfill', function() {
    function native(input) {
      return (new TextEncoder()).encode(input);
    }

    it('detect utf16 surrogate pairs', function() {
      var text = '\uD83D\uDE38' + '\uD83D\uDCAD' + '\uD83D\uDC4D'
      expect(encode(text)).to.eql(native(text));
    });

    it('detect utf16 surrogate pairs over U+20000 until U+10FFFF', function() {
      var text = '\uD842\uDFB7' + '\uD93D\uDCAD' + '\uDBFF\uDFFF'
      expect(encode(text)).to.eql(native(text));
    })

    it('replace orphaned utf16 surrogate lead code point', function() {
      var text = '\uD83D\uDE38' + '\uD83D' + '\uD83D\uDC4D'
      expect(encode(text)).to.eql(native(text));
    })

    it('replace orphaned utf16 surrogate trail code point', function() {
      var text = '\uD83D\uDE38' + '\uDCAD' + '\uD83D\uDC4D'
      expect(encode(text)).to.eql(native(text));
    })

    it('do not write partial utf16 code units', function() {
      var text = 'あいうえお';
      expect(encode(text)).to.eql(native(text));
    });
  });
});


describe('Wrapper', function() {
  var library;
  var PlainStruct, ArrayStruct, StringStruct, PointerStruct,
      CompoundStruct, ComplexStruct;

  before(function() {
    PlainStruct = new Struct({
      a: 'char',
      b: 'uint',
      c: 'short',
    });

    ArrayStruct = new Struct({
      array: ['char', 3],
    });

    PointerStruct = new Struct({
      p: types.pointer('char'),
    });

    StringStruct = new Struct({
      str: 'string',
    });

    CompoundStruct = new Struct({
      x: 'ushort',
      y: ArrayStruct,
    });

    ComplexStruct = new Struct({
      one: 'bool',
      two: 'uint',
      three: PlainStruct,
      four: [CompoundStruct, 2],
      five: 'short',
    });

    var definition = {
      return_int: ['number'],
      return_float: ['number'],
      return_bool: ['boolean'],
      no_parameters: [],
      add: ['number', ['number', 'number']],
      flip_bool: ['boolean', ['boolean']],

      return_string: ['string'],
      strings_match: ['bool', ['string', 'string']],

      sum_u32_array: ['u32', ['array', 'usize']],
      sum_u8_array: ['uint8', ['array', 'size_t']],

      mutate_u32_pointer: [null, [types.pointer('u32')]],
      get_f64_pointer: [types.pointer('f64'), ['f64']],
      get_u64_pointer: [types.pointer('u64'), ['number']],

      return_plain_struct: [PlainStruct],
      give_plain_struct: ['number', [PlainStruct]],
      return_array_struct: [ArrayStruct],
      give_array_struct: ['number', [ArrayStruct]],
      return_pointer_struct: [PointerStruct],
      give_pointer_struct: ['number', [PointerStruct]],
      return_string_struct: [StringStruct],
      give_string_struct: ['string', [StringStruct]],
      return_compound_struct: [CompoundStruct],
      give_compound_struct: ['number', [CompoundStruct]],
      return_complex_struct: [ComplexStruct],
      give_complex_struct: ['number', [ComplexStruct]],
      return_pointer_plain_struct: [types.pointer(PlainStruct)],
      give_pointer_plain_struct: ['number', [types.pointer(PlainStruct)]],
    };

    library = new Wrapper(definition);

    library.imports({
      env: {
        callback: function() {},
        callback_struct: function() {},
        callback_slice: function() {},
      },
    });

    return library.fetch(baseURL + './mod.rust.webasm')
      .then(function() {
        library.exports.hook();
      });
  });

  describe('basic types', function() {
    it('-> int', function() {
      expect(library.return_int()).to.equal(123);
    });
    it('-> float', function() {
      expect(library.return_float()).to.equal(-123.456);
    });
    it('-> boolean', function() {
      expect(library.return_bool()).to.be(false);
    });
    it('void / no arguments', function() {
      expect(library.no_parameters).to.not.throwException();
    });
    it('int, int -> int', function() {
      expect(library.add(2, 2)).to.equal(4);
    });
    it('boolean -> boolean', function() {
      expect(library.flip_bool(false)).to.be(true);
    });
  });

  describe('strings', function() {
    it('-> string', function() {
      expect(library.return_string()).to.be('passed string');
    });
    it('string, string -> bool', function() {
      expect(library.strings_match('abc', 'abc')).to.be(true);
      expect(library.strings_match('abc', 'qwerty')).to.be(false);
    });
  });

  describe('arraybuffers / typedarrays', function() {
    it('buffer, length -> number', function() {
      var u32s = new Uint32Array([1, 2, 3]);
      var u8s = new Uint8Array([1, 2, 3, 4, 5, 6]);

      expect(library.sum_u32_array(u32s, u32s.length)).to.be(6);
      expect(library.sum_u8_array(u8s, u8s.length)).to.be(21);
      expect(library.sum_u32_array(u32s.buffer, u32s.length)).to.be(6);
      expect(library.sum_u8_array(u8s.buffer, u8s.length)).to.be(21);
    });
  });

  describe('pointers', function() {
    it("pointer('u32')", function() {
      var ptr = new Pointer('u32');
      library.mutate_u32_pointer(ptr);

      expect(ptr.deref()).to.be(777);
      expect(ptr.ref()).to.not.be(0);

      library.utils.free(ptr);
    });

    it("pointer('u32', value)", function() {
      var ptr = new Pointer('u32', 111);

      library.mutate_u32_pointer(ptr);
      expect(ptr.deref()).to.be(777);

      ptr.set(222);
      expect(ptr.deref()).to.be(222);

      library.mutate_u32_pointer(ptr);
      expect(ptr.deref()).to.be(777);

      ptr.free();
    });

    it("f64 -> pointer('f64')", function() {
      var ptr = library.get_f64_pointer(-111.111);

      expect(ptr.deref()).to.be(-222.222);
      expect(ptr.ref()).to.not.be(0);

      ptr.free();
    });

    it("-> pointer('u64')", function() {
      var ptr = library.get_u64_pointer(200);
      var dataview = ptr.deref();

      expect(dataview.byteLength).to.be(8);
      expect(dataview.getUint32(0, true)).to.be(200);

      ptr.free();
    });
  });

  describe('structs', function() {
    it('-> plain struct', function() {
      var plain = library.return_plain_struct();

      expect(plain.ref()).to.not.be(0);
      expect(plain.a).to.be(1);
      expect(plain.b).to.be(2);
      expect(plain.c).to.be(3);

      plain.free();
    });

    it('plain struct -> u32', function() {
      var struct = new PlainStruct({ a: 1, b: 2, c: 3 });
      expect(struct.ref()).to.be(0);

      expect(library.give_plain_struct(struct)).to.be(2);
      expect(struct.ref()).to.not.be(0);

      struct.free();
    });

    it('-> array struct', function() {
      var struct = library.return_array_struct();

      expect(struct.ref()).to.not.be(0);
      expect(struct.array).to.eql([1, 2, 3]);

      struct.free();
    });

    it('array struct -> char', function() {
      var struct = new ArrayStruct({ array: [1, 2, 3] });
      expect(struct.ref()).to.be(0);

      expect(library.give_array_struct(struct)).to.be(6);
      expect(struct.ref()).to.not.be(0);

      struct.free();
    });

    it('-> pointer struct', function() {
      var struct = library.return_pointer_struct();

      expect(struct.ref()).to.not.be(0);
      expect(struct.p.deref()).to.be(20);

      struct.free(true);
    });

    it('pointer struct -> char', function() {
      var struct = new PointerStruct({
        p: new Pointer('char', 37),
      });

      expect(struct.ref()).to.be(0);

      expect(library.give_pointer_struct(struct)).to.be(37);
      expect(struct.ref()).to.not.be(0);

      struct.free(true);
    });

    it('pointer struct -> char, allocate util', function() {
      var struct = new PointerStruct({
        p: new Pointer('char', 37),
      });

      expect(struct.ref()).to.be(0);
      expect(struct.p.ref()).to.be(0);

      library.utils.allocate(struct.p);
      expect(struct.p.ref()).to.not.be(0);

      expect(library.give_pointer_struct(struct)).to.be(37);
      expect(struct.ref()).to.not.be(0);

      struct.p.free();
      struct.free();
    });

    it('-> string struct', function() {
      var struct = library.return_string_struct();

      expect(struct.ref()).to.not.be(0);
      expect(struct.str.deref()).to.be('hello');
      expect(struct.str instanceof CString).to.be(true);
      expect(String(struct.str) == 'hello').to.be(true);
      expect(struct.str == 'hello').to.be(true); // == coerces!

      struct.free(true);
    });

    it('string struct -> string', function() {
      var str = new CString('hello');
      var struct = new StringStruct({ str: str });

      expect(struct.ref()).to.be(0);

      expect(library.give_string_struct(struct)).to.be('hello');
      expect(str.deref()).to.be('hello');

      str.free();
      struct.free();
    });

    it('-> compound struct', function() {
      var struct = library.return_compound_struct();

      expect(struct.ref()).to.not.be(0);
      expect(struct.y.array).to.eql([6, 7, 8]);

      struct.free(true);
    });

    it('compound struct -> number', function() {
      var struct = new CompoundStruct({
        x: 10,
        y: new ArrayStruct({ array: [1, 9, 15] }),
      });

      expect(struct.ref()).to.be(0);

      expect(library.give_compound_struct(struct)).to.be(25);
      expect(struct.ref()).to.not.be(0);

      struct.y.array = [1, 2, 3];
      expect(library.give_compound_struct(struct)).to.be(6);

      struct.free(true);
    });

    it('-> complex struct', function() {
      var struct = library.return_complex_struct();

      expect(struct.ref()).to.not.be(0);
      expect(struct.four[1].y.array).to.eql([4, 5, 6]);

      struct.free(true);
    });

    it('complex struct -> number', function() {
      var struct = new ComplexStruct({
        one: false,
        two: 222,
        three: new PlainStruct({ a: 11, b: 12, c: 13 }),
        four: [
          new CompoundStruct({
            x: 5,
            y: new ArrayStruct({ array: [10, 10, 10] }),
          }),
          new CompoundStruct({
            x: 10,
            y: new ArrayStruct({ array: [20, 20, 20] }),
          }),
        ],
        five: 55,
      });

      expect(struct.ref()).to.be(0);

      expect(library.give_complex_struct(struct)).to.be(90);
      expect(struct.ref()).to.not.be(0);

      struct.four[0].y.array = [1, 1, 1];
      struct.four[1].y.array = [1, 1, 1];
      expect(library.give_complex_struct(struct)).to.be(6);

      struct.three.b = 222;
      expect(struct.three.b).to.be(222);
      expect(struct.one).to.be(false);

      struct.free(true);
    });

    it('-> pointer(plain struct)', function() {
      var ptr = library.return_pointer_plain_struct();
      var struct = ptr.deref();

      expect(struct.ref()).to.not.be(0);
      expect(struct.a).to.be(1);
      expect(struct.b).to.be(2);
      expect(struct.c).to.be(3);

      ptr.free();
    });

    it('pointer(plain struct) -> number', function() {
      var struct = new PlainStruct({ a: 1, b: 112, c: 3 });
      var pointer = new Pointer(PlainStruct, struct);

      expect(library.give_pointer_plain_struct(pointer)).to.be(112);

      pointer.free();
    });
  });
});

describe('import wrapper', function() {
  var PlainStruct;
  var library;
  var cb;

  before(function() {
    PlainStruct = new Struct({
      a: 'char',
      b: 'uint',
      c: 'short',
    });

    library = new Wrapper({
      trigger_callback: ['string'],
      trigger_callback_struct: [],
      console_log: [],
      console_error: [],
      cause_panic: [],
    });

    library.imports(function(wrap) {
      return {
        env: {
          callback: wrap(['string'], function() {
            return 'ok';
          }),
          callback_struct: wrap(PlainStruct, function(struct) {
            cb(struct);
          }),
          callback_slice: function() {},
        },
      }
    });

    return library.fetch(baseURL + './mod.rust.webasm')
      .then(function() {
        library.exports.hook();
      });
  });

  it('wasm -> js -> wasm', function() {
    expect(library.trigger_callback()).to.be('ok');;
  });

  it('wasm -> js, library struct', function(done) {
    cb = function(struct) {
      expect(struct.a).to.be(1);
      expect(struct.b).to.be(2);
      expect(struct.c).to.be(3);

      struct.free();
      done();
    };

    library.trigger_callback_struct();
  });

  it('print -> console.log()', function() {
    library.console_log();
  });

  it('eprint -> console.error()', function() {
    library.console_error();
  });

  it('trace -> throw new WasmError()', function() {
    expect(library.cause_panic).to.throwException();

    try {
      library.cause_panic()
    } catch (err) {
      console.log(err);
    }
  });
});

describe('cwrap / ccall', function() {
  var instance;
  var fs;

  // check broswer / node runtime
  var isNode = typeof fetch !== 'function';

  function fetch_node(file) {
    return new Promise(function(resolve, reject) {
      (fs || (fs = eval('equire'.replace(/^/, 'r'))('fs'))).readFile(
        file,
        function(err, data) {
          return err
            ? reject(err)
            : resolve({ arrayBuffer: function() { return data; } });
        }
      );
    });
  }

  before(function() {
    var imports = {
      env: {
        print: function() {},
        eprint: function() {},
        trace: function() {},
        callback: function() {},
        callback_struct: function() {},
        callback_slice: function() {},
      },
    };

    var get = (typeof fetch === 'function' && fetch || fetch_node);

    return get(baseURL + './mod.rust.webasm')
      .then(function(response) { return response.arrayBuffer(); })
      .then(function(buffer) { return WebAssembly.instantiate(buffer, imports); })
      .then(function(result) {
        instance = result.instance;
        instance.exports.hook();
      });
  });

  it('cwrap', function() {
    var return_string = cwrap(instance, 'return_string', 'string');
    expect(return_string()).to.be('passed string');

    var strings_match = cwrap(instance, 'strings_match', 'bool', ['string', 'string']);
    expect(strings_match('potato', 'opal')).to.be(false);
  });

  it('ccall', function() {
    expect(
      ccall(instance, 'return_string', 'string')
    ).to.be('passed string');

    expect(
      ccall(instance, 'add', 'number', ['number', 'number'], 1, 2)
    ).to.be(3);
  });

  it('cwrap -> struct shim w/ custom type', function() {
    var EasyComplexStruct = new Struct({
      body: new CustomType(36, {
        alignment: 4,
        read: function(view) {
          return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
        },
      }),
    });

    var fn = cwrap(instance, 'give_complex_struct', 'char', [EasyComplexStruct]);

    var body = new Uint8Array(36);
    var struct = new EasyComplexStruct({ body: body });
    body.fill(1);

    expect(struct.ref()).to.be(0);
    expect(fn(struct)).to.be(6);

    expect(struct.ref()).to.not.be(0);
    expect(struct.body).to.not.be(body);
    expect(struct.body).to.eql(body);

    struct.free(true);
  });
});

describe('Rust types', function() {
  var library;
  var cb;
  var Enum

  before(function() {
    Enum = rust.enum({
      One: 'u16',
      Two: rust.option(rust.string, true /* non-nullable type */),
      Three: 'void',
    });

    library = new Wrapper({
      // options
      return_some_option_usize: [rust.option('usize')],
      return_none_option_usize: [rust.option('usize')],
      take_option: ['bool', [rust.option('usize')]],
      // vectors
      return_vec_char: [rust.vector('u8')],
      give_vec_shorts: ['u16', [rust.vector('u16')]],
      borrow_vec_shorts: ['u16', [rust.vector('u16')]],
      // strings
      return_rust_string: [rust.string],
      borrow_rust_str: ['usize', [rust.str]],
      give_rust_string: ['usize', [rust.string]],
      // slices
      trigger_slice_callback: [],
      // enums
      return_enum: [Enum, ['u8']],
      borrow_enum: ['u16', [Enum]],
      // tuples
      return_tuple: [rust.tuple('usize', rust.str)],
      give_tuple: ['number', [rust.tuple('usize', 'u16')]],
      // everything
      return_complex_rust: [rust.tuple(rust.option(rust.vector(Enum), true), 'usize')],
    });

    library.imports(function(wrap) {
      return {
        env: {
          callback: function() {},
          callback_struct: function() {},
          callback_slice: wrap(rust.slice('u16'), function(slice) {
            cb(slice);
          }),
        },
      };
    });

    return library.fetch(baseURL + './mod.rust.webasm')
      .then(function() {
        library.exports.hook();
      });
  });

  it('-> option', function() {
    var some = library.return_some_option_usize();
    expect(some.isSome()).to.be(true);
    expect(some.unwrap()).to.be(123123123);
    expect(some.expect('not')).to.be(123123123);

    var none = library.return_none_option_usize();
    expect(none.isNone()).to.be(true);
    expect(none.unwrap).to.throwException();
    expect(none.expect).to.throwException();
    expect(none.unwrapOr('tortilla')).to.be('tortilla');
    expect(none.unwrapOrElse(function() { return 'taco' })).to.be('taco');

    some.free();
    none.free();
  });

  it('option ->', function() {
    var some = rust.Some('usize', 123);
    var none = rust.None('usize');

    expect(library.take_option(some)).to.be(true);
    expect(library.take_option(none)).to.be(false);
  });

  it('-> vector', function() {
    var vec = library.return_vec_char();
    expect(vec.values).to.eql([1, 2, 3]);

    vec.free(true);
  });

  it('borrows vector -> sum', function() {
    var vec = new rust.Vector('u16', [10, 10, 5]);

    var sum = library.borrow_vec_shorts(vec);
    expect(sum).to.eql(25);

    vec.free(); // JS still owns it
  });

  it('give vector -> sum', function() {
    var vec = new rust.Vector('u16', [111, 111, 111]);

    var sum = library.give_vec_shorts(vec);
    expect(sum).to.eql(333);

    expect(vec.free).to.throwException(); // transfers ownership
  });

  it('-> string', function() {
    var str = library.return_rust_string();
    expect(str.value).to.be('Rust string!');
    expect(str + '').to.be('Rust string!');

    str.free(true);
  });

  it('borrows str -> length', function() {
    var str = new rust.Str('about 19 characters');

    var len = library.borrow_rust_str(str);
    expect(len).to.eql(19);

    str.free(true); // JS still owns it
  });

  it('give string -> length', function() {
    var r_str = new rust.String('I have about 26 characters');

    var len = library.give_rust_string(r_str);
    expect(len).to.eql(26);

    expect(r_str.free).to.throwException(); // transfers ownership
  });

  it('slice', function(done) {
    cb = function(slice) {
      expect(slice.values).to.eql([1, 2, 3]);
      done();
    };

    library.trigger_slice_callback();
  });

  it('enum', function() {
    var arms = {
      Two: function(value) {
        return value.unwrap().value;
      },

      Three: 3,
      _: 'default',
    };

    var one = library.return_enum(1);
    var two = library.return_enum(2);
    var three = library.return_enum(3);

    expect(one.value).to.be(123);
    expect(one.is('One')).to.be(true);
    expect(one.match(arms)).to.be('default');
    expect(two.match(arms)).to.be('from enum!');
    expect(three.match(arms)).to.be(3);

    one.free();
    two.free(true);
    three.free();
  });

  it('enum -> tag', function() {
    var one = new Enum({ One: 111 });

    expect(library.borrow_enum(one)).to.be(111);
    one.free();
  });

  it('-> tuple', function() {
    var tuple = library.return_tuple();

    expect(tuple[0]).to.be(4444);
    expect(tuple[1].value).to.be('in a tuple!');

    tuple.free();
  });

  it('tuple -> sum', function() {
    var tuple = new rust.Tuple(['usize', 'u16'], [1, 2]);
    var num = library.give_tuple(tuple);

    expect(num).to.be(3);
  });

  it('complex nesting', function() {
    var woah = library.return_complex_rust();
    var vec = woah[0].unwrap().values;
    var num = woah[1];

    expect(vec.length).to.be(3);
    expect(num).to.be(123);
    expect(vec[0].value).to.be(1);
    expect(vec[1].value.unwrap().value).to.be('dois');
    expect(vec[2].name()).to.be('Three');

    vec.forEach(function(e) { e.free(true); });
    woah.free();
  });
});


describe('mod.c.webasm', function() {
  var library;
  var cb;
  var PlainStruct

  before(function() {
    PlainStruct = new Struct({
      a: 'char',
      b: 'uint',
      c: 'short',
    });

    library = new Wrapper({
      return_string: ['string'],
      strings_match: ['bool', ['string', 'string']],
      sum_u8_array: ['char', ['array', 'char']],
      sum_u32_array: ['int', ['array', 'int']],
      return_plain_struct: [PlainStruct],
      give_plain_struct: ['number', [PlainStruct]],
      trigger_callback: [],
    });

    library.imports({
      env: {
        memory: new WebAssembly.Memory({ initial: 10 }),
        callback: function(num) {
          cb(num);
        },
      },
    });

    return library.fetch(baseURL + './mod.c.webasm');
  });

  describe('strings', function() {
    it('-> string', function() {
      expect(library.return_string()).to.be('passed string');
    });

    it('string, string -> bool', function() {
      expect(library.strings_match('abc', 'abc')).to.be(true);
      expect(library.strings_match('abc', 'qwerty')).to.be(false);
    });
  });

  describe('arraybuffers / typedarrays', function() {
    it('buffer, length -> number', function() {
      var u32s = new Uint32Array([1, 2, 3]);
      var u8s = new Uint8Array([1, 2, 3, 4, 5, 6]);

      expect(library.sum_u32_array(u32s, u32s.length)).to.be(6);
      expect(library.sum_u8_array(u8s, u8s.length)).to.be(21);
      expect(library.sum_u32_array(u32s.buffer, u32s.length)).to.be(6);
      expect(library.sum_u8_array(u8s.buffer, u8s.length)).to.be(21);
    });
  });

  describe('structs', function() {
    it('-> plain struct', function() {
      var plain = library.return_plain_struct();

      expect(plain.ref()).to.not.be(0);
      expect(plain.a).to.be(1);
      expect(plain.b).to.be(2);
      expect(plain.c).to.be(3);

      plain.free();
    });

    it('plain struct -> u32', function() {
      var struct = new PlainStruct({ a: 1, b: 2, c: 3 });
      expect(struct.ref()).to.be(0);

      expect(library.give_plain_struct(struct)).to.be(2);
      expect(struct.ref()).to.not.be(0);

      struct.free();
    });
  });

  describe('imported functions', function() {
    it('trigger callback', function(done) {
      cb = function(num) {
        expect(num).to.be(777);
        done();
      }

      library.trigger_callback();
    });
  });
});
