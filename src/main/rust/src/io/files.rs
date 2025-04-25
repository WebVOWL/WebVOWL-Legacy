use serde::{Deserialize, Serialize};
use std::str::{self};
use wasm_bindgen::{JsValue, prelude::wasm_bindgen};
use wasm_bindgen_futures::JsFuture;
use web_sys::{
    console,
    js_sys::{Error, Uint8Array},
};

#[derive(Serialize, Deserialize)]
pub struct JsonResult {
    pub data: Option<serde_json::Value>,
    pub status: String,
}

impl JsonResult {
    pub fn new(data: Option<serde_json::Value>, status: String) -> Self {
        JsonResult { data, status }
    }
}

#[derive(Serialize, Deserialize)]
pub struct StringResult {
    pub data: Option<String>,
    pub status: String,
}

impl StringResult {
    pub fn new(data: Option<String>, status: String) -> Self {
        StringResult { data, status }
    }
}

/// Converts a slice of bytes to a string, including invalid characters.
///
/// Strings are made of bytes ([`u8`]), and a slice of bytes
/// ([`&[u8]`][byteslice]) is made of bytes, so this function converts
/// between the two. Not all byte slices are valid strings, however: strings
/// are required to be valid UTF-8. During this conversion,
/// `from_utf8_lossy()` will replace any invalid UTF-8 sequences with
/// [`U+FFFD REPLACEMENT CHARACTER`][U+FFFD], which looks like this: �
pub fn from_utf8_lossy(v: &[u8]) -> String {
    let iter = v.utf8_chunks();

    const REPLACEMENT: &str = "\u{FFFD}";
    let mut res = String::with_capacity(v.len());

    for chunk in iter {
        res.push_str(chunk.valid());
        if !chunk.invalid().is_empty() {
            res.push_str(REPLACEMENT);
        }
    }

    res
}

fn convert_to_js<T: serde::ser::Serialize + ?Sized>(content: &T) -> JsValue {
    let serializer = serde_wasm_bindgen::Serializer::json_compatible();
    return match serde::Serialize::serialize(&content, &serializer) {
        Ok(res) => res,
        Err(error) => {
            console::error_1(&JsValue::from_str(
                format!("Failed to convert Rust value to JavaScript object: {error}").as_str(),
            ));
            return JsValue::null();
        }
    };
}

/// Reads a JavaScript file handle and returns a Rust byte vector
async fn read_web_file(web_file: web_sys::File) -> Result<Vec<u8>, Error> {
    let prom_buf = web_file.array_buffer();
    let future = JsFuture::from(prom_buf);
    let buf = future.await?;
    let array = Uint8Array::new(&buf.into());
    Ok(array.to_vec())
}

/// Parse a JavaScript file as a string.
///
/// Returns an Object `{data: SomeJSONObject, status: string}`
/// where:
/// - `data` is the JavaScript file converted to a JSON object
/// - `status` is the error message of any error that occured while processing the file.
#[wasm_bindgen]
pub async fn read_file_as_string(web_file: web_sys::File) -> JsValue {
    let bytes: Vec<u8> = match read_web_file(web_file).await {
        Ok(res) => res,
        Err(error) => {
            let err_str = error.to_string();
            let err_object = JsonResult::new(None, format!("Failed to read file: {err_str}"));
            return convert_to_js(&err_object);
        }
    };

    let s: String = String::from_utf8_lossy(&bytes).into_owned();
    let ok_object = StringResult::new(Some(s), String::new());
    return convert_to_js(&ok_object);
}

/// Parse a JavaScript file as a JSON string and return a JavaScript object of it.
///
/// Returns an Object `{data: SomeJSONObject, status: string}`
/// where:
/// - `data` is the JavaScript file converted to a JSON object
/// - `status` is the error message of any error that occured while processing the file.
#[wasm_bindgen]
pub async fn parse_json(web_file: web_sys::File) -> JsValue {
    let bytes: Vec<u8> = match read_web_file(web_file).await {
        Ok(res) => res,
        Err(error) => {
            let err_str = error.to_string();
            let err_object = JsonResult::new(None, format!("Failed to read file: {err_str}"));
            return convert_to_js(&err_object);
        }
    };

    let slice_json_object: serde_json::Value = match serde_json::from_slice(&bytes) {
        Ok(res) => res,
        Err(err1) => {
            console::warn_1(&JsValue::from_str(
                format!("Error in JSON file: {err1}").as_str(),
            ));

            // Assuming an invalid UTF-8 code point in input.
            let s = from_utf8_lossy(&bytes);

            // Clear from memory to conserve space
            drop(bytes);

            let str_json_object: serde_json::Value = match serde_json::from_str(s.as_str()) {
                Ok(res) => res,
                Err(err2) => {
                    let err_object =
                        JsonResult::new(None, format!("Failed to parse JSON file: {err2}"));
                    return convert_to_js(&err_object);
                }
            };

            let ok_object = JsonResult::new(Some(str_json_object), String::new());
            return convert_to_js(&ok_object);
        }
    };

    let ok_object = JsonResult::new(Some(slice_json_object), String::new());
    return convert_to_js(&ok_object);
}
