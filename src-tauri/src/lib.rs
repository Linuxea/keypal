mod commands;
mod keylistener;

use tauri::{Manager, PhysicalPosition, WindowEvent};

fn window_label() -> &'static str {
    "main"
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::exit_app,
            commands::save_window_position,
            commands::get_default_position,
            commands::is_packed,
            commands::append_log,
            commands::log_path,
        ])
        .setup(|app| {
            let main_window = app
                .get_webview_window(window_label())
                .expect("main window missing");

            if let Ok(Some(monitor)) = main_window.current_monitor() {
                let size = monitor.size();
                let scale = monitor.scale_factor();
                let margin = 48.0 * scale;
                let x = (size.width as f64 - 128.0 - margin) as i32;
                let y = (size.height as f64 - 128.0 - margin) as i32;

                let _ = main_window.set_position(PhysicalPosition::new(
                    x.max(0) as i32,
                    y.max(0) as i32,
                ));
            }

            let app_handle = app.handle().clone();
            keylistener::start(app_handle.clone());

            let _main_window = main_window;
            let _ = app_handle;

            Ok(())
        })
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { .. } => {
                let _ = window.app_handle().exit(0);
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
