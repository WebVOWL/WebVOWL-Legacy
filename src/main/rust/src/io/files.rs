use std::str;

use wasm_bindgen::{JsValue, prelude::wasm_bindgen};
use wasm_bindgen_futures::JsFuture;
use web_sys::js_sys::Uint8Array;

use crate::graph::data::OwlToWovlJSON;

/// Reads a JavaScript file handle and returns a Rust byte vector
pub async fn read_web_file(web_file: web_sys::File) -> Vec<u8> {
    let prom_buf = web_file.array_buffer();
    let future = JsFuture::from(prom_buf);
    let buf = match future.await {
        Ok(res) => res,
        Err(error) => panic!("Failed to load file {error:?}"),
    };
    let array = Uint8Array::new(&buf.into());
    array.to_vec()
}

/// Read a JS file
#[wasm_bindgen]
pub async fn read_file_as_string(web_file: web_sys::File) -> JsValue {
    let bytes: Vec<u8> = read_web_file(web_file).await;
    let s = match str::from_utf8(&bytes) {
        Ok(v) => v,
        Err(e) => panic!("Invalid UTF-8 sequence: {}", e),
    };
    return JsValue::from_str(s);
}

/// Parse a JS file as a JSON string and return a JS object of it
#[wasm_bindgen]
pub async fn parse_json(web_file: web_sys::File) -> JsValue {
    let bytes: Vec<u8> = read_web_file(web_file).await;
    let json_object: OwlToWovlJSON = serde_json::from_slice(&bytes).unwrap();
    return serde_wasm_bindgen::to_value(&json_object).unwrap();
}
