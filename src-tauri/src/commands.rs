use tauri::{AppHandle, PhysicalPosition};
use tauri_plugin_store::StoreExt;

pub const STORE_FILE: &str = "settings.json";

#[tauri::command]
pub fn exit_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
pub fn save_window_position(app: AppHandle, x: i32, y: i32) -> Result<(), String> {
    let store = app
        .store(STORE_FILE)
        .map_err(|e| format!("store open failed: {}", e))?;
    store.set("position", serde_json::json!({ "x": x, "y": y }));
    store.save().map_err(|e| format!("store save failed: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn get_default_position(app: AppHandle) -> PhysicalPosition<i32> {
    if let Some(monitor) = app.primary_monitor().ok().flatten() {
        let size = monitor.size();
        let scale = monitor.scale_factor();
        let phys_w = size.width as f64;
        let phys_h = size.height as f64;
        let x = (phys_w - 160.0 * scale) as i32;
        let y = (phys_h - 160.0 * scale) as i32;
        PhysicalPosition::new(x.max(0), y.max(0))
    } else {
        PhysicalPosition::new(1792, 952)
    }
}

#[tauri::command]
pub fn is_packed() -> bool {
    cfg!(not(debug_assertions))
}

fn log_dir_path() -> Result<std::path::PathBuf, String> {
    let base = std::env::var("APPDATA")
        .map(std::path::PathBuf::from)
        .map_err(|_| "APPDATA not set".to_string())?;
    let dir = base.join("com.keypal.app");
    std::fs::create_dir_all(&dir).map_err(|e| format!("mkdir failed: {}", e))?;
    Ok(dir)
}

#[tauri::command]
pub fn append_log(line: String) -> Result<String, String> {
    use std::fs::OpenOptions;
    use std::io::Write;

    let dir = log_dir_path()?;
    let path = dir.join("keypal.log");

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|e| format!("open log failed: {}", e))?;

    writeln!(file, "{}", line).map_err(|e| format!("write log failed: {}", e))?;

    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn log_path() -> Result<String, String> {
    let dir = log_dir_path()?;
    Ok(dir.join("keypal.log").to_string_lossy().to_string())
}
