use std::ffi::{CStr, CString};
use std::os::raw::{c_char, c_void};

extern {
    fn rotate();
    fn get_input_value(selector: *const c_char) -> u32;
}

// A hacky way to allocate / deallocate memory in rust stable.
//
// Another way to do this would be to use heap::alloc, but that's still unstable
// You can check the progress on RFC #1974
// @ https://github.com/rust-lang/rust/issues/27389
//
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
pub fn say(ptr: *const c_char) -> *const c_char {
    assert!(!ptr.is_null());

    let hello = unsafe { CStr::from_ptr(ptr) };
    let greeting = format!("{}, World!", hello.to_string_lossy());

    CString::new(greeting).unwrap().into_raw()
}

#[no_mangle]
pub fn get_sum(ptr: *const u32, length: usize) -> u32 {
    assert!(!ptr.is_null());

    let slice = unsafe {
        std::slice::from_raw_parts(ptr, length)
    };

    slice.iter().sum()
}

#[no_mangle]
pub fn get_pointer() -> *mut u32 {
    Box::into_raw(Box::new(123))
}


#[no_mangle]
pub fn pass_pointer(ptr: *mut u32) -> u32 {
    assert!(!ptr.is_null());
    let value = unsafe { &mut *ptr };

    *value
}

#[repr(C)]
pub struct Person {
    name: *const c_char,
    age: u8,
    favorite_number: u32,
}

#[no_mangle]
pub fn get_person() -> *mut Person {
    let name = CString::new("Jean-Luc Picard").unwrap();

    Box::into_raw(Box::new(Person {
        name: name.into_raw(),
        age: 61,
        favorite_number: 1701,
    }))
}

#[no_mangle]
pub fn person_facts(ptr: *mut Person) -> *const c_char {
    assert!(!ptr.is_null());
    let person = unsafe { &mut *ptr };
    let name = unsafe { CStr::from_ptr(person.name).to_string_lossy() };

    let fact = if person.age as u32 > person.favorite_number {
        format!("{} is older than his favorite_number", name)
    } else {
        format!("{} is younger than his favorite_number", name)
    };

    CString::new(fact).unwrap().into_raw()
}

#[no_mangle]
pub fn barrel_roll() {
    unsafe { rotate() };
}

#[no_mangle]
pub fn multiply_input(dom_selector: *const c_char) -> u32 {
    unsafe { get_input_value(dom_selector) * 2 }
}
