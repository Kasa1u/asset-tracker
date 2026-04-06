// src-tauri/src/lib.rs

// 必须先声明我们要用这个插件
use tauri_plugin_sql::{Builder, Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // 注册 SQL 插件
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|_app| {
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}