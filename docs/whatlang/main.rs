use std::cell::RefCell;
use std::ffi::CStr;
use std::os::raw::{c_char, c_void};

extern crate whatlang;

thread_local!(
    static RESULT: RefCell<Option<DetectResult>> = RefCell::new(None);
);

#[repr(C)]
pub struct DetectResult {
    lang: String,
    confidence: f64,
    is_reliable: bool,
}

#[no_mangle]
pub fn detect(ptr: *const c_char) -> *const DetectResult {
    RESULT.with(|cell| {
        let mut wrapper = cell.borrow_mut();

        let input = unsafe {
            assert!(!ptr.is_null());
            CStr::from_ptr(ptr).to_string_lossy()
        };

        let info_result = whatlang::detect(&input);

        if let Some(info) = info_result {
            *wrapper = Some(DetectResult {
                lang: info.lang().eng_name().to_string(),
                confidence: info.confidence(),
                is_reliable: info.is_reliable(),
            });
        } else {
            *wrapper = Some(DetectResult {
                lang: String::from("Unknown"),
                confidence: 0.0,
                is_reliable: false,
            });
        }

        let result = wrapper.as_ref().unwrap();
        &*result as *const DetectResult
    })
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
