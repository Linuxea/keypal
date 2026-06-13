use rdev::{listen, Event, EventType, Key};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Emitter};

static LISTENER_RUNNING: AtomicBool = AtomicBool::new(false);

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct KeyEvent {
    pub key: String,
    pub timestamp: u64,
    pub is_backspace: bool,
    pub is_char: bool,
    pub char: Option<String>,
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn key_name(key: &Key) -> String {
    format!("{:?}", key)
}

fn is_backspace(key: &Key) -> bool {
    matches!(key, Key::Backspace | Key::Delete)
}

fn key_to_char(key: &Key) -> Option<&'static str> {
    use Key::*;
    match key {
        // Whitespace / control chars
        Space => Some(" "),
        Return => Some("\n"),
        Tab => Some("\t"),

        // Letters (lowercase; AI doesn't need case-sensitive)
        KeyA => Some("a"),
        KeyB => Some("b"),
        KeyC => Some("c"),
        KeyD => Some("d"),
        KeyE => Some("e"),
        KeyF => Some("f"),
        KeyG => Some("g"),
        KeyH => Some("h"),
        KeyI => Some("i"),
        KeyJ => Some("j"),
        KeyK => Some("k"),
        KeyL => Some("l"),
        KeyM => Some("m"),
        KeyN => Some("n"),
        KeyO => Some("o"),
        KeyP => Some("p"),
        KeyQ => Some("q"),
        KeyR => Some("r"),
        KeyS => Some("s"),
        KeyT => Some("t"),
        KeyU => Some("u"),
        KeyV => Some("v"),
        KeyW => Some("w"),
        KeyX => Some("x"),
        KeyY => Some("y"),
        KeyZ => Some("z"),

        // Digits (top row)
        Num0 => Some("0"),
        Num1 => Some("1"),
        Num2 => Some("2"),
        Num3 => Some("3"),
        Num4 => Some("4"),
        Num5 => Some("5"),
        Num6 => Some("6"),
        Num7 => Some("7"),
        Num8 => Some("8"),
        Num9 => Some("9"),

        _ => None,
    }
}

pub fn start(app: AppHandle) {
    if LISTENER_RUNNING.swap(true, Ordering::SeqCst) {
        return;
    }

    let app_handle = app.clone();
    thread::spawn(move || {
        let callback = move |event: Event| {
            let key = match event.event_type {
                EventType::KeyPress(k) => k,
                _ => return,
            };

            let backspace = is_backspace(&key);
            let name = key_name(&key);
            let (is_char, ch) = match key_to_char(&key) {
                Some(c) => (true, Some(c.to_string())),
                None => (false, None),
            };

            let payload = KeyEvent {
                key: name,
                timestamp: now_ms(),
                is_backspace: backspace,
                is_char,
                char: ch,
            };

            let _ = app_handle.emit("key-event", payload);
        };

        if let Err(e) = listen(callback) {
            eprintln!("[keypal] rdev listen failed: {:?}", e);
            LISTENER_RUNNING.store(false, Ordering::SeqCst);
        }
    });

    let _ = Arc::new(app);
}
