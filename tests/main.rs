use std::ffi::CString;
use std::ffi::CStr;
use std::os::raw::{c_char, c_void, c_ulong, c_short, c_ushort};

extern crate wasm_glue;

#[allow(improper_ctypes)]
extern {
    fn callback() -> *mut c_char;
    fn callback_struct(ptr: *mut PlainStruct);
    fn callback_slice(slice: &[u16]);
}


#[no_mangle]
pub fn hook() {
    wasm_glue::hook();
}

#[no_mangle]
pub fn allocate(length: usize) -> *mut c_void {
    let mut v = Vec::with_capacity(length);
    let ptr = v.as_mut_ptr();
    std::mem::forget(v);
    ptr
}

#[no_mangle]
pub fn deallocate(ptr: *mut c_void, length: usize) {
    unsafe {
        std::mem::drop(Vec::from_raw_parts(ptr, 0, length));
    }
}


#[no_mangle]
pub fn return_int() -> u32 {
    123
}

#[no_mangle]
pub fn return_float() -> f64 {
    -123.456
}

#[no_mangle]
pub fn return_bool() -> bool {
    false
}

#[no_mangle]
pub fn no_parameters() {}

#[no_mangle]
pub fn add(a: u32, b: u32) -> u32 {
    a + b
}

#[no_mangle]
pub fn flip_bool(arg: bool) -> bool {
    !arg
}

#[no_mangle]
pub fn return_string() -> *mut c_char {
    let cstring = CString::new("passed string").unwrap();
    cstring.into_raw()
}

#[no_mangle]
pub fn strings_match(ptr_a: *const c_char, ptr_b: *const c_char) -> bool {
    assert!(!ptr_a.is_null());
    assert!(!ptr_b.is_null());

    let data_a = unsafe { CStr::from_ptr(ptr_a) };
    let data_b = unsafe { CStr::from_ptr(ptr_b) };

    data_a == data_b
}

#[no_mangle]
pub fn sum_u32_array(ptr: *const u32, length: usize) -> u32 {
    assert!(!ptr.is_null());

    let slice = unsafe {
        std::slice::from_raw_parts(ptr, length)
    };

    slice.iter().sum()
}

#[no_mangle]
pub fn sum_u8_array(ptr: *const u8, length: usize) -> u8 {
    assert!(!ptr.is_null());

    let slice = unsafe {
        std::slice::from_raw_parts(ptr, length)
    };

    slice.iter().sum()
}

#[no_mangle]
pub fn mutate_u32_pointer(ptr: *mut u32) {
    assert!(!ptr.is_null());
    let value = unsafe { &mut *ptr };
    *value = 777;
}

#[no_mangle]
pub fn get_f64_pointer(value: f64) -> *mut f64 {
    Box::into_raw(Box::new(value * 2.0))
}

#[no_mangle]
pub fn get_u64_pointer(value: u32) -> *mut u64 {
    Box::into_raw(Box::new(value as u64))
}

#[derive(Debug)]
#[repr(C)]
pub struct PlainStruct {
    a: c_char,
    b: c_ulong,
    c: c_short,
}

#[no_mangle]
pub fn return_plain_struct() -> *mut PlainStruct {
    Box::into_raw(Box::new(PlainStruct { a: 1, b: 2, c: 3 }))
}

#[no_mangle]
pub fn give_plain_struct(ptr: *mut PlainStruct) -> u32 {
    assert!(!ptr.is_null());
    let plain = unsafe { &mut *ptr };

    plain.b
}

#[derive(Debug)]
#[repr(C)]
pub struct ArrayStruct {
    array: [c_char; 3],
}

#[no_mangle]
pub fn return_array_struct() -> *mut ArrayStruct {
    Box::into_raw(Box::new(ArrayStruct { array: [1, 2, 3] }))
}

#[no_mangle]
pub fn give_array_struct(ptr: *mut ArrayStruct) -> c_char {
    assert!(!ptr.is_null());
    let array_struct = unsafe { &mut *ptr };

    array_struct.array.iter().sum()
}

#[derive(Debug)]
#[repr(C)]
pub struct PointerStruct {
    p: *mut c_char,
}

#[no_mangle]
pub fn return_pointer_struct() -> *mut PointerStruct {
    let ptr = Box::into_raw(Box::new(20));
    Box::into_raw(Box::new(PointerStruct { p: ptr }))
}

#[no_mangle]
pub fn give_pointer_struct(ptr: *mut PointerStruct) -> c_char {
    assert!(!ptr.is_null());
    let pointer_struct = unsafe { &mut *ptr };

    unsafe { *pointer_struct.p }
}

#[derive(Debug)]
#[repr(C)]
pub struct StringStruct {
    str: *mut c_char,
}

#[no_mangle]
pub fn return_string_struct() -> *mut StringStruct {
    let cstring = CString::new("hello").unwrap();
    Box::into_raw(Box::new(StringStruct { str: cstring.into_raw() }))
}

#[no_mangle]
pub fn give_string_struct(ptr: *mut StringStruct) -> *mut c_char {
    assert!(!ptr.is_null());
    let string_struct = unsafe { &mut *ptr };

    string_struct.str
}

#[derive(Debug)]
#[repr(C)]
pub struct CompoundStruct {
    x: c_ushort,
    y: ArrayStruct,
}

#[no_mangle]
pub fn return_compound_struct() -> *mut CompoundStruct {
    Box::into_raw(Box::new(CompoundStruct {
        x: 5,
        y: ArrayStruct { array: [ 6, 7, 8 ] }
    }))
}

#[no_mangle]
pub fn give_compound_struct(ptr: *mut CompoundStruct) -> c_char {
    assert!(!ptr.is_null());
    let compound_struct = unsafe { &mut *ptr };

    compound_struct.y.array.iter().sum()
}

#[derive(Debug)]
#[repr(C)]
pub struct ComplexStruct {
    one:   bool,
    two:   c_ulong,
    three: PlainStruct,
    four:  [CompoundStruct; 2],
    five:  c_short,
}

#[no_mangle]
pub fn return_complex_struct() -> *mut ComplexStruct {
    Box::into_raw(Box::new(ComplexStruct {
        one: true,
        two: 2,
        three: PlainStruct { a: 1, b: 2, c: 3 },
        four: [
            CompoundStruct {
                x: 5,
                y: ArrayStruct { array: [ 1, 2, 3 ] }
            },
            CompoundStruct {
                x: 10,
                y: ArrayStruct { array: [ 4, 5, 6 ] }
            }
        ],
        five: 5,
    }))
}

#[no_mangle]
pub fn give_complex_struct(ptr: *mut ComplexStruct) -> c_char {
    assert!(!ptr.is_null());
    let compound_struct = unsafe { &mut *ptr };

    let a: c_char = compound_struct.four[0].y.array.iter().sum();
    let b: c_char = compound_struct.four[1].y.array.iter().sum();

    a + b
}

#[no_mangle]
pub fn return_pointer_plain_struct() -> *mut *mut PlainStruct {
    let ptr = Box::into_raw(Box::new(PlainStruct { a: 1, b: 2, c: 3 }));
    Box::into_raw(Box::new(ptr))
}

#[no_mangle]
pub fn give_pointer_plain_struct(ptrptr: *mut *mut PlainStruct) -> u32 {
    assert!(!ptrptr.is_null());
    let ptr = unsafe { &mut *ptrptr };

    assert!(!ptr.is_null());
    let plain: &PlainStruct = unsafe { std::mem::transmute(ptr) };

    plain.b
}

#[no_mangle]
pub fn trigger_callback() -> *mut c_char {
    let ptr = unsafe { callback() };
    ptr
}

#[no_mangle]
pub fn trigger_callback_struct() {
    let ptr = Box::into_raw(Box::new(PlainStruct { a: 1, b: 2, c: 3 }));
    unsafe { callback_struct(ptr) };
}

#[no_mangle]
pub fn console_log() {
    println!("rust: console.log message");
}

#[no_mangle]
pub fn console_error() {
    eprintln!("rust: console.error message");
}

#[no_mangle]
pub fn cause_panic() {
    println!("rust: this unwrap will panic");
    None::<Option<u32>>.unwrap();
}

#[no_mangle]
pub fn return_some_option_usize() -> *mut Option<usize> {
    Box::into_raw(Box::new(Some(123123123)))
}

#[no_mangle]
pub fn return_none_option_usize() -> *mut Option<usize> {
    Box::into_raw(Box::new(None))
}

#[no_mangle]
pub fn take_option(ptr: *mut Option<usize>) -> bool {
    let opt = unsafe { Box::from_raw(ptr) };
    opt.is_some()
}

#[no_mangle]
pub fn return_vec_char() -> *mut Vec<u8> {
    Box::into_raw(Box::new(vec![1, 2, 3]))
}

#[no_mangle]
pub fn borrow_vec_shorts(ptr: *mut Vec<u16>) -> u16 {
    let vec = unsafe { &*ptr };
    vec.iter().sum()
}

#[no_mangle]
pub fn give_vec_shorts(ptr: *mut Vec<u16>) -> u16 {
    let vec = unsafe { Box::from_raw(ptr) };
    vec.iter().sum()
}

#[no_mangle]
pub fn give_slice_shorts(ptr: *mut &[u16]) -> u16 {
    let slice = unsafe { Box::from_raw(ptr) };
    slice.iter().sum()
}

#[no_mangle]
pub fn borrow_rust_str(ptr: *mut &str) -> usize {
    let string = unsafe { &*ptr };
    string.len()
}

#[no_mangle]
pub fn give_rust_string(ptr: *mut String) -> usize {
    let string = unsafe { Box::from_raw(ptr) };
    string.len()
}

#[no_mangle]
pub fn return_rust_string() -> *mut String {
    Box::into_raw(Box::new(String::from("Rust string!")))
}

#[no_mangle]
pub fn trigger_slice_callback() {
    let v = [1, 2, 3];

    unsafe {
        callback_slice(&v[..]);
    }
}

#[derive(Debug)]
#[repr(C)]
pub enum Enum {
    One(u16),
    Two(Option<String>),
    Three,
}

#[no_mangle]
pub fn return_enum(num: u8) -> *mut Enum {
    let string = String::from("from enum!");

    match num {
        1 => Box::into_raw(Box::new(Enum::One(123))),
        2 => Box::into_raw(Box::new(Enum::Two(Some(string)))),
        _ => Box::into_raw(Box::new(Enum::Three)),
    }
}

#[no_mangle]
pub fn borrow_enum(ptr: *mut Enum) -> u16 {
    let value = unsafe { &*ptr };

    match *value {
        Enum::One(num) => num,
        Enum::Two(_) => 2,
        Enum::Three => 3,
    }
}

#[no_mangle]
pub fn return_tuple() -> *mut (usize, &'static str) {
    Box::into_raw(Box::new( (4444, "in a tuple!") ))
}

#[no_mangle]
pub fn give_tuple(ptr: *mut (usize, u16)) -> usize {
    let tup = unsafe { Box::from_raw(ptr) };
    tup.0 + tup.1 as usize
}

#[no_mangle]
pub fn return_complex_rust() -> *mut (Option<Vec<Enum>>, usize) {
    let vec = vec![
        Enum::One(1),
        Enum::Two(Some(String::from("dois"))),
        Enum::Three,
    ];

    Box::into_raw(Box::new( (Some(vec), 123) ))
}
