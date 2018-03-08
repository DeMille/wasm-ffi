# wasm-ffi
**A lightweight foreign function interface library for JavaScript & WebAssembly**

👉 [Demo & Examples][demo]  
🚥 [Run the tests][tests]

`wasm-ffi` helps translate types across the JS ↔ WebAssembly boundary, including:
- [x] strings
- [x] arrays
- [x] C-style structs
- [x] pointers
- [x] some Rust types (option, vector, string, enum, etc.)
- [x] combinations of the above

Heavily based on the ideas & syntax of [node-ffi](https://github.com/node-ffi/node-ffi) and [emscripten][1] (`cwrap`/`ccall`)  
<br/>

#### Contents
- [Why](#why)
- [Examples](#example)
- [Install](#install)
- [Requirements](#requirements)
- [Memory Management](#memory-management-recycle)
- [Documentation](#documentation)
- [Tests](#tests)
- [License (MIT)](#license)

[demo]: https://demille.github.io/wasm-ffi/whatlang/
[tests]: https://demille.github.io/wasm-ffi/tests/
[1]: https://kripken.github.io/emscripten-site/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html#interacting-with-code-ccall-cwrap


## Why
WebAssembly only supports number types (`i32`, `u32`, `f32`, `f64`), so it can be clumsy to work with. What if you want to return a string? or pass an object? You can't, directly. You have to pass pointers to memory instead.

Each WebAssembly instance is backed by a [memory object][2]. Your module will use this buffer for memory, but you can also read & manipulate it from JavaScript. If you want to pass a string to WebAssembly, you need to write that string to memory, and then pass a pointer to it.

`wasm-ffi` wraps your WebAssembly functions and does this pointer conversion for you. It takes objects/strings and translates them into pointers for your function calls. It takes struct pointers and lets you use them like plain JS objects. It even handles the padding in structs so you don't have to do it yourself.

The goal here is to reduce friction and make WebAssembly easier to work with.

[2]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Memory


## Example
If you had a WebAssembly interface like this:

- `make_todo(name, priority)` → `*Todo`
- `get_most_important()` → `*Todo`
- `mark_complete(*Todo)`

You would use `wasm-ffi` like this:

```js
import { Wrapper, Struct, Pointer, types } from 'wasm-ffi';

// define a new struct type: Todo
const Todo = new Struct({
  task_name: 'string', // (char *)
  priority:  'uint32',
  complete:  'bool',
  some_ptr:   types.pointer('bool'),
});


// wrap your WebAssembly function calls with this form:
// name: [return type, [argument types...]
const library = new Wrapper({
  // `make_todo` takes a string ptr and a number, returns a Todo ptr:
  make_todo: [Todo, ['string', 'number']]
  // `get_most_important` takes no arguments, returns a Todo ptr:
  get_most_important: [Todo]
  // `mark_complete` takes a Todo ptr, returns nothing:
  mark_complete: [null, [Todo]]
});


// fetch the module and instantiate it:
library.fetch('todo.wasm').then(() => {
  // use wrapped functions:
  const todo = library.make_todo('buy milk', 50);

  // the todo pointer gets wrapped into a useful object:
  console.log(`Is ${todo.task_name} complete?: ${todo.complete}`);

  // struct fields access wasm memory on the fly with getters & setters:
  todo.priority = 100;

  // you can dereference pointers to get their data:
  asset(todo.some_ptr.deref() === true);

  // you can make new structs from JS:
  const other = new Todo({
    task_name: 'Learn to make bagels',
    priority: 100,
    complete: false,
    some_ptr: new Pointer('bool', false),
  });

  // and pass them to WebAssembly:
  library.mark_complete(other);

  // then free them from memory:
  other.free();
});
```

Check the [live examples][demo] for more.


## Install
```sh
npm install wasm-ffi
```

Or, if you don't want to mess with webpack yet:

```html
<script src="https://unpkg.in/wasm-ffi"></script>
```

**Usage:**
```js
// imported as a module:
import { Wrapper, Struct, types, cwrap } from 'wasm-ffi';

// with require:
const ffi = require('wasm-ffi');
const Wrapper = ffi.Wrapper

// or when loaded from a <script> tag, use the `ffi` global:
const Wrapper = ffi.Wrapper
const Pointer = ffi.Pointer
```


## Requirements
For some operations `wasm-ffi` needs to be able to allocate memory. It needs to coordinate this with your `.wasm` code so it doesn't mess your memory up.

If you do any of these...

- pass a string from JS → WebAssembly (i.e., use a string as an argument)
- create a struct instance using JS
- create _anything_ in JavaScript that you want to pass to WebAssebmly

you need **two exported functions** from your WebAssembly module:

- `allocate(size) → pointer`
- `deallocate(pointer, size /* optional */)`

([implementation in rust](...))  
([in C](...))

`wasm-ffi` also expects to find WebAssembly memory at `instance.exports.memory` or `imports.env.memory`. If your module imports WebAssembly memory from a different namespace, you'll need to add it as an option in `new Wrapper()`.


## Memory management :recycle:
WebAssembly has no garbage collection so you need to clean up after yourself. If you allocate anything in JS you need to free it when you're done. Here are two things you should know:

### Strings & ArrayBuffers

`wasm-ffi` does some memory management for you. In wrapped functions, strings and arrays are allocated before the function call and **automatically deallocated** afterwards:

```js
const library = new Wrapper({
  passString: [null, ['string']], // fn accepts pointer to a string
  passArray: [null, ['array']],   // fn accepts pointer to an array
});
// ...

// string is written to wasm memory...
library.passString('from JS');
// and then freed

// array is written to wasm memory...
library.passArray(new Uint8Array([1, 2, 3]));
// and then freed
```

If you want an ArrayBuffer or string to _remain_ in wasm memory and _not_ get automatically freed, you need to explicitly allocate / free it:

```js
const library = new Wrapper({
  passString: [null, ['number']], // manual pointer to a string
  passArray: [null, ['number']],  // manual pointer to an array
});
// ...

// write string directly and pass pointer
const strPtr = library.utils.writeString('from JS');
library.passString(strPtr);

// write array directly and pass pointer
const arrPtr = library.utils.writeArray(new Uint8Array([1, 2, 3]));
library.passArray(arrPtr);

// deallocate
library.utils.free(strPtr);
library.utils.free(arrPtr);
```

### Structs & Pointers

Struct and pointers created from JS are allocated and written when they are first used by a WebAssembly function.

```js
// make a new struct type: Foo
const Foo = new Struct({
  bar: 'uint32',
});

// library with the function `useFoo`, which takes a `Foo` pointer:
const library = new Wrapper({
  useFoo: [null, [Foo]],
});
// ...

// create new Foo instance: (not yet allocated into wasm memory)
const foo = new Foo({
  bar: 1,
});

// the first time `foo` gets used in a function it will be allocated:
library.useFoo(foo);

// `foo.ref()` is now an address in wasm memory.
// This call uses that same reference:
library.useFoo(foo);

// free `foo` using JS:
foo.free();
```

Structs can also be directly allocated:

```js
const foo = new Foo({ bar: 1 });
const ptr = library.utils.writeStruct(foo);

foo.free();
```


## Documentation
- Class: [Wrapper](#user-content-new-wrapper)
  + [new Wrapper(functions [, options])](#user-content-new-wrapper)
  + [.imports(fn | obj)](#user-content-wrapper-imports)
  + [.fetch(url)](#user-content-wrapper-fetch)
  + [.use(instance)](#user-content-wrapper-use)
  + [.utils](#user-content-wrapper-utils)
- [cwrap(instance, fnName, returnType, argTypes)](#user-content-cwrap)
- [ccall(instance, fnName, returnType, argTypes, ...args)](#user-content-ccall)
- Class: [Struct](#user-content-struct)
  + [new Struct(fields)](#user-content-new-struct)
    - [new StructType(values)](#user-content-new-structtype)
    - [.ref()](#user-content-structtype-ref)
    - [.free()](#user-content-structtype-free)
- [types](#user-content-types)
  + [.string](#user-content-types-string)
  + [.pointer(type)](#user-content-types-pointer)
- Class: [CustomType](#user-content-new-customtype)
  + [new CustomType(size [, options])](#user-content-new-customtype)
- Class: [Pointer](#user-content-new-pointer)
  + [new Pointer(type, value)](#user-content-new-pointer)
  + [.ref()](#user-content-pointer-ref)
  + [.deref()](#user-content-pointer-deref)
  + [.set(value)](#user-content-pointer-set)
  + [.free()](#user-content-pointer-free)
- Class: [CString](#user-content-new-cstring)
  + [new CString(str)](#user-content-new-cstring)
  + [.ref()](#user-content-cstring-ref)
  + [.deref()](#user-content-cstring-deref)
  + [.free()](#user-content-cstring-free)
- [rust](#user-content-rust)
  + [.string](#user-content-rust-string)
  + [.String(value)](#user-content-rust-string-class)
  + [.str](#user-content-rust-str)
  + [.Str(value)](#user-content-rust-str-class)
  + [.vector(type)](#user-content-rust-vector)
  + [.Vector(type, values)](#user-content-rust-vector-class)
  + [.slice(type)](#user-content-rust-slice)
  + [.Slice(type, values)](#user-content-rust-slice-class)
  + [.tuple(...types)](#user-content-rust-tuple)
  + [.Tuple(types, values)](#user-content-rust-tuple-class)
  + [.enum(variants [, tagSize])](#user-content-rust-enum)
    - Class: [RustEnum](#user-content-rustenum)
      + [.is(type)](#user-content-rustenum-is)
      + [.match(arms)](#user-content-rustenum-match)
      + [.ref()](#user-content-rustenum-ref)
      + [.free()](#user-content-rustenum-free)
  + [.option(type [, isNonNullable[, tagSize]])](#user-content-rust-option)
    - Class: [RustOption](#user-content-rustoption)
      + [.isSome()](#user-content-rustoption-issome)
      + [.isNone()](#user-content-rustoption-isnone)
      + [.expect(msg)](#user-content-rustoption-expect)
      + [.unwrap()](#user-content-rustoption-unwrap)
      + [.unwrapOr(default)](#user-content-rustoption-unwrapor)
      + [.unwrapOrElse(fn)](#user-content-rustoption-unwraporelse)
      + [.ref()](#user-content-rustoption-ref)
      + [.free()](#user-content-rustoption-free)
  + [.Option(type, value [, isNonNullable[, tagSize]])](#user-content-rust-option-class)
  + [.Some(type, value [, isNonNullable[, tagSize]])](#user-content-rust-option-class)
  + [.None(type [, isNonNullable[, tagSize]])](#user-content-rust-option-class)
<br/>


### <a name="new-wrapper"></a> new Wrapper(functions [, options])
- `functions` - _<object\>_ Type signatures for WebAssembly functions you want to wrap
- `options` - _<object\>_
  + `options.memory` - _<WebAssembly.Memory\>_ (if not at `instance.exports.memory`)

Functions signatures take the format:

```js
functionName: [returnType, [...argTypes]]
```

Valid argument types include:
- `'number'`, `'string'`, `'array'`, `'bool'` / `'boolean'`
- `Struct` instances
- `types.pointer(x)`'s

Remember that WebAssembly only uses numbers, so strings and structs here are actually _pointers_ to the data. Your WebAssembly functions should accept and return pointers.

```js
const Foo = new Struct({
  bar: 'bool'
});

const library = new Wrapper({
  // library.getLength('taco') === 4
  getLength: ['number', ['string']],
  // library.matchStrings('queso', 'tortilla') === false
  matchStrings: ['bool', ['string', 'string']],
  // library.isFooBar(new Foo({ bar: true })) === true
  isFooBar: ['bool', [Foo]],
})
```

If there is no return type, use `null`, `'void'`, or exclude entirely:
```js
const library = new Wrapper({
  noReturn: [null, ['string']],
  nothing: ['void', ['number']],
  nada: [],
})
```

Also, you can substitue a number type string (like `'uint32'`) for `'number'` if you want it to more closely match your interface. This is purely cosmetic though--there aren't any checks to see if your inputs are in bounds.


### <a name="wrapper-imports"></a> .imports(fn|obj)
Add imports to your module. These are JS values that you can access from WebAssembly. You can provide a plain object or you can wrap functions like you would in the `Wrapper` constructor. This has to be called before fetching your
wasm module.

Plain object:

```js
library.imports({
  // the 'env' namespace is typically used by wasm compilers:
  env: {
    do_alert() {
      alert('called from webassembly!');
    }
  },
});

```

Use a callback to wrap imported functions. If they don't have a return type you can use the format:  
`wrap(type1, type2, ..., fn)`

```js
library.imports((wrap) => ({
  env: {
    // `alert_string` gets called with a string ptr:
    alert_string: wrap('string', (str) => {
      alert('WebAssembly just said: ' + str);
    }),

    // `log_version` gets a Foo ptr & a string ptr:
    log_version: wrap(Foo, 'string', (foo, name) => {
      console.log(foo.version, name)
    }),

    // not wrapped
    normal() {
      console.log('just normal');
    }
  },
}));
```

If your imported function has a return type you can wrap is using the same format as a `Wrapper` definitions:  
`wrap([return, [...types]], fn)`

```js
library.imports((wrap) => ({
  env: {
    // `get_value` is called with a string ptr & a number
    // It does some DOM stuff and returns another string ptr
    get_value: wrap(['string', ['string', 'number']], (id, n) => {
      return document.getElementById(id + n).value;
    }),
  },
}));
```


### <a name="wrapper-fetch"></a> .fetch(url)
A helper method to fetch a `.wasm` module at a url and instantiate it.  
Tries to use instantiateStreaming if supported.

```js
library.fetch('my.wasm').then(() => {
  library.doThing();
});
```


### <a name="wrapper-use"></a> .use(instance)
If you don't want to use `.fetch` you can instantiate the module yourself and tell your wrapped library to use it.

```js
library.use(wasmInstance);
library.doThing();
```


### <a name="wrapper-exports"></a> .exports
Access to _all_ WebAssembly instance exports, not just your wrapped functions. Same thing as `instance.exports`.



### <a name="wrapper-utils"></a> .utils
Some utility functions:

- `.readString(addr)` → `string`
- `.writeString(str)` → `addr`
- `.writeArray(arr)` → `addr`
- `.readStruct(addr, type)` → `StructType`
- `.writeStruct(struct)` → `addr`
- `.readPointer(addr, type)` → `Pointer`
- `.writePointer(pointer)` → `addr`
- `.allocate(value)` → `addr`
- `.free(value/addr)`

<br/>


### <a name="cwrap"></a> cwrap(instance, fnName, returnType, argTypes)
Wraps a single function in a `WebAssembly.Instance`.
Just like the emscripten `cwrap`. An alternative to using `Wrapper`.

```js
const doStuff = cwrap(wasmInstance, 'doStuff', 'number', ['string', 'bool']);
const value = doStuff('one', true);
```


### <a name="ccall"></a>ccall(instance, fnName, returnType, argTypes, ...args)
Wraps and calls a single function in a `WebAssembly.Instance`.
Just like the emscripten `ccall`. An alternative to using `Wrapper`.

```js
const value = ccall(wasmInstance, 'doStuff', 'number', ['string', 'bool'], 'one', true);
```

<br/>


### <a name="new-struct"></a> new Struct(fields [, options])
Defines a new struct type and returns a new constructor.

Constructor can be used to create struct instances, or it can be used as an argument type / return type for functions. Struct fields should be **specified in order**. Structs can be composed of any of the primitive types like `'uint8'`, or they can be composed of other sub-structs, pointers, or arrays of types. Struct fields will be padded according to the usual C rules.

Struct instances are automatically allocated/written to memory the first time they are used in a WebAssembly function. They can also be explicitly allocated. If you create struct instance from JS (not just receive it some WebAssembly call), remember to free it somehow or you will leak!

```js
// define a new struct type:
const Point = new Struct({
  x: 'uint32',
  y: 'uint32',
});
```

Structs can be composed of other structs and can include arrays of types.

```js
// define another Struct type (with arrays)
const Coords = new Struct({
  points: [Point, 4], // an array of 4 `Point` types
});
```


#### <a name="new-structtype"></a> new StructType(values)
Creates a new instance from that struct type
```js
const p1 = new Point({
  x: 1,
  y: 2,
});

// read values
p1.x === 1;
p1.y === 2;

const library = new Wrapper({
  manipulate: [Point],
});

library.manipulate(p1);

// read changed values
p1.x === 5;
p1.y === 10;

// write values in wasm memory
p1.x = 50;
p1.y = 100;
```

- <a name="structtype-ref"></a> **.ref()** - Returns the address of the struct in wasm memory
- <a name="structtype-free"></a> **.free()** - Free the struct from wasm memory, deallocating it. Be careful! :warning:

<br/>


### <a name="types"></a> types
Types have string aliases to make things more concise, so instead of using `types.uint32` you can just put the string `'uint32'` or `'u32'`.

| types           | aliases                                 |
| --------------- | --------------------------------------- |
| `types.uint8`   | uint8, u8, char, uchar                  |
| `types.uint16`  | uint16, u16, ushort                     |
| `types.uint32`  | uint32, u32, uint, ulong, size_t, usize |
| `types.uint64`* | uint64, u64, ulonglong                  |
| `types.int8`    | int8, i8, schar                         |
| `types.int16`   | int16, i16, short                       |
| `types.int32`   | int32, i32, int, long                   |
| `types.int64`*  | int64, i64, longlong                    |
| `types.float`   | f32                                     |
| `types.double`  | f64                                     |
| `types.bool`    | boolean                                 |

\* note: JS doesn't have 64 bit integers. These types will return a 8 byte `DataView`. You can use decide if you want to down cast it to a `u32` or use some other BigInt solution.


### <a name="types-string"></a> types.string
A pointer to a null-terminated string.  
`string` fields in structs will hold `CString` objects.

:warning: Because strings are pointers you need to remember to free them!

```js
const Foo = new Struct({
  str: 'string',
});

const foo = library.getStruct();

foo.str instanceof CString === true;
foo.str.ref() === 0x45522; // some address in memory

// dereference the pointer to read string
foo.str.deref() === 'Hello!';
// or coerce to a string:
String(foo.str) === 'Hello!';
foo.str == 'Hello!';

// to change a struct field string you need to create and allocate a CString:
const str = new CString('Set to something else');
library.utils.allocate(str);

foo.str = str;
```


### <a name="types-pointer"></a> types.pointer(type)
A type that represents a pointer to another type.
_Note_: pointers in WebAssembly are uint32's.

```js
const HasPointer = new Struct({
  ptr: type.pointer('uint8'),
  normal: 'uint8',
});

const struct = library.getStruct();

// dereference to get value
struct.ptr.deref() === 3;

// to change an existing struct you need to create and allocate a new Pointer:
const p = new Pointer('uint8', 42);
library.utils.allocate(p);

struct.ptr = p;

// if your are creating a new struct it will allocate it for you:
const other = new HasPointer({
  ptr: new Pointer('uint8', 111),
  normal: 222,
});
```

<br/>


### <a name="new-customtype"></a> new CustomType(size [, options])
- `size` - _<integer\>_ Size in bytes
- `options` - _<object\>_
  + `options.alignment` - _<integer\>_ defaults to `size`
  + `options.read` - _<function(`DataView`)\>_ returns a `DataView` of lengths `size` by default
  + `options.write` - _<function(`DataView`, value)\>_ write value to `DataView`

Types with customizable sizes, alignments, and read/write methods.  
Could be useful if you only care about part of a struct, and not the other fields.

```js
// hack to down cast u64 -> u32
const Uint64 = new CustomType(8, {
  read(view) {
    return view.getUint32(0, true);
  },

  write(view, value) {
    return view.setUint32(0, value, true);
  },
});

const Has64 = new Struct({
  num: Uint64,
});

// struct instanceof Has64
const struct = library.getStruct();

// struct.ptr instanceof Pointer
struct.num === 1;
struct.num = 99;
```

<br/>


### <a name="new-pointer"></a> new Pointer(type [, value])

Creates a new pointer to `type`, with optional value.
If you don't give it an initial value you can set it later with `.set()`.

```js
const HasPointer = new Struct({
  ptr: type.pointer('uint32'),
});

const struct = new HasPointer({
  ptr: new Pointer('uint32', 42),
});

// struct and struct.ptr both get allocated here:
library.passStruct(struct);
```

```js
// explicitly allocate a pointer:
const pointer = new Pointer('uint32', 42);
library.utils.allocate(pointer);
```

- <a name="pointer-ref"></a> **.ref()** - returns pointer's address
- <a name="pointer-deref"></a> **.deref()** - reads the data
- <a name="pointer-free"></a> **.set(value)** - sets pointer value
- <a name="pointer-free"></a> **.free()** - free the data from wasm memory

<br/>


### <a name="new-cstring"></a> new CString(str)

Used to write null-terminated strings to wasm memory. Like a `Pointer`, but specifically for strings. `CStrings` are automatically allocated and written when they are used in a WebAssembly function. Can also be manually allocated.

```js
// make a new CString and allocate/write it to wasm memory
const str = new CString('I have a 0 at the end');
library.utils.allocate(str);
```

- <a name="cstring-ref"></a> **.ref()** - returns cstring's wasm address
- <a name="cstring-deref"></a> **.deref()** - reads the string at pointer address
- <a name="cstring-free"></a> **.free()** - free string from wasm memory

<br/>


### <a name="rust"></a> Rust Types :warning:
Experimental & implementation dependent types based on [this cheat sheet][chart] of container types.

Be warned, they may not work in future versions of Rust!

These are sub classes of `StuctType` with pre-defined fields and maybe some methods. Remember to use `#[repr(C)]` on enums. Use `rustc` & `-Z print-type-sizes` if you need to debug discriminant/size/alignment issues.

[chart]: https://docs.google.com/presentation/d/1q-c7UAyrUlM-eZyTo1pd8SZ0qwA_wYxmPZVOQkoDmH4/pub?start=false&loop=false&delayms=3000&slide=id.p

### <a name="rust-string"></a> rust.string
A Rust `String` container type. Basically: `struct { ptr, cap, len }`
Read the underlying string data by accessing the `.value` field or coercing to a string.

```js
const library = new Wrapper({
  return_rust_string: [rust.string],
});

const str = library.return_rust_string();

str.value === 'Hello from Rust';
String(str) === 'Hello from Rust';
str == 'Hello from Rust';
```


### <a name="rust-string-class"></a> new rust.String(value)
Like `String::new()`

```js
const library = new Wrapper({
  give_rust_string: [null, [rust.string]],
});

const str = new rust.String("Hello from JS");
library.give_rust_string(str);
```


### <a name="rust-str"></a> rust.str
A Rust `str` container type. Like `String`, but without cap: `struct { ptr, len }`
Read the underlying string data by accessing the `.value` field or coercing to a string.

```js
const Foo = new Struct({
  str: rust.str,
});

const library = new Wrapper({
  get_foo: [Foo],
});

const foo = library.get_foo();

foo.str.value === 'Hello from Rust';
String(foo.str) === 'Hello from Rust';
foo.str == 'Hello from Rust';
```


### <a name="rust-str-class"></a> new rust.Str(value)
Creates a new rust str.

```js
const Foo = new Struct({
  str: rust.str,
});

const library = new Wrapper({
  give_foo: [null, [Foo]],
});

const foo = new Foo({
  str: new rust.Str('Hello from JS')
});

library.give_foo(foo);
```


### <a name="rust-vector"></a> rust.vector(type)
A Rust `Vector` container type. Like a `String`: `struct { ptr, cap, len }`, but based on a given `type`
Read the underlying array data by accessing the `.values` field.

  ```js
  const library = new Wrapper({
    return_rust_vector: [rust.vector('u16')],
  });

  const vec = library.return_rust_vector();
  vec.values === [1, 2, 3];
  ```


### <a name="rust-vector-class"></a> new rust.Vector(type, values)
Create a new Vector of `type` with `values`

  ```js
  const library = new Wrapper({
    give_rust_vector: [null, [rust.vector('u16')]],
  });

  const vec = new rust.Vector('u16', [1, 2, 3]);
  library.give_rust_vector(vec);
  ```


### <a name="rust-slice"></a> rust.slice(type)
A Rust slice container type. Like a `Vector` but with no cap: `struct { ptr, len }`
Read the underlying array data by accessing the `.values` field.

```js
const Foo = new Struct({
  slice: rust.slice('usize'),
});

const library = new Wrapper({
  get_foo: [Foo],
});

const foo = library.get_foo();
foo.slice.values === [1, 2, 3];
```


### <a name="rust-slice-class"></a> new rust.Slice(type, values)
Create a new Slice of `type` with `values`

```js
const Foo = new Struct({
  slice: [null, [rust.slice('usize')]],
});

const library = new Wrapper({
  give_foo: [Foo],
});

const foo = new rust.Slice('usize', [1, 2, 3]);
library.give_foo(foo);
```


### <a name="rust-tuple"></a> rust.tuple(...types)

```js
const library = new Wrapper({
  return_rust_tuple: [rust.tuple('u16', 'usize')],
});

const tup = library.return_rust_tuple();
tup[0] === 2;
tup[1] === 288;
```


### <a name="rust-tuple-class"></a> new rust.Tuple(types, values)
Create a new Tuple of given types with matching values

```js
const TupleType = rust.tuple('u16', 'usize');

const library = new Wrapper({
  give_rust_tuple: [null, [TupleType]],
});

const tup = new rust.Tuple(['u16', 'usize'], [2, 288]);
// same as doing:
// tup = new TupleType([2, 288]);

library.give_rust_tuple(tup);
```


### <a name="rust-enum"></a> rust.enum(variants [, tagSize])
A Rust enum is combination of a discriminant tag and a type. If you use `#[repr(C)]` on your enum the discriminant will be 4 bytes. Without `#[repr(C)]` it varies. `rust.enum` defaults to a tagSize of 4.

Read the data by accessing the `.value` property.

```js
const VersionID = rust.enum({
  One: 'u16',
  Two: rust.string,
});

const library = new Wrapper({
  getVersionID: [VersionID],
});

const version = library.getVersionID();
console.log(version.value);
```

You can also create new enums from your definition like you would a struct:

```js
const library = new Wrapper({
  giveVersionID: [null, [VersionID]],
});

const version = new VersionID({ One: 123 });
// *or*
const version = new VersionID({ Two: new rust.String('123') });

library.giveVersionID(version);
```

<a name="rustenum"></a> `RustEnums` have two methods:
- <a name="rustenum-is"></a> **.is(type)** → **bool**
- <a name="rustenum-match"></a> **.match(arms)** → **value**

```js
if (version.is('One')) {
  // version.value is a 'u16'
}

// kinda-sorta like matching:
// match arms can be functions or simply a value:
const value = version.match({
  One(number) {
    return String(number);
  },

  Two(string) {
    return string.value;
  }

  _: 'Bad version number',
});
```


### <a name="rust-option"></a> rust.option(type [, isNonNullable[, tagSize]])
A Rust `Option` is like an enum, but with only two variants: some `type`, or none.  If the given `type` is non-nullable, an optimization is applied and the discriminant tag is left out completely (a value of 0 means none in this case).

If your type is non-nullable, like a pointer, set `isNonNullable` to true.

```js
const Foo = rust.enum({
  opt: rust.option('usize'),
});

const library = new Wrapper({
  get_foo: [Foo],
});

const foo.opt = library.get_foo();
console.log(foo.opt.value);
```

<a name="rustoption"></a> `RustOption` has methods that work like you would expect:
- <a name="rustoption-issome"></a> **.isSome()**
- <a name="rustoption-isnone"></a> **.isNone()**
- <a name="rustoption-expect"></a> **.expect(msg)** - throws an error with `msg` if None
- <a name="rustoption-unwrap"></a> **.unwrap()** - throws an error if None
- <a name="rustoption-unwrapor"></a> **.unwrapOr(default)**
- <a name="rustoption-unwraporelse"></a> **.unwrapOrElse(fn)**
&nbsp;

### <a name="rust-option-class"></a> new rust.Option(type, value, [, isNonNullable[, tagSize]])
Create a new option of `type` with a `value`. Value can be an actual value or it can be undefined for none. You can use `rust.Some(type, value)` and `rust.None(type)` for this purpose too.

```js
const Foo = rust.enum({
  opt: rust.option('usize'),
});

const library = new Wrapper({
  give_foo: [Foo],
});

const foo = new Foo({
  opt: new rust.Option('usize', 123);
});

// new rust.Option('usize', 123) === new rust.Some('usize', 123)
// new rust.Option('usize') === new rust.None('usize')

library.give_foo(foo);
```

<br/>


## Tests
Find them in the `/docs/tests` directory.  
[Try em][tests] now in your browser of choice.

Tests for `wasm-ffi` use mocha in the browser because I want to see how `wasm-ffi` fares across different browsers and WebAssembly implementations. I'll probably port them to run on node later too.


<br/>


## License
MIT
