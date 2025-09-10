// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::sync::Mutex;
use tauri::Listener;
use tauri::Manager;
use tauri::State;



// 导出命令模块
mod commands;
use commands::greet;
use commands::start_download;
use commands::download1;

// 定义要共享的数据结构
#[derive(Default)]
struct AppState {
    counter: u32,
    password: String,
    username: String,
    is_logged_in: bool,
}




#[tauri::command]
fn login(
    state: State<'_, Mutex<AppState>>,
    username: String,
    password: String,
) -> Result<bool, String> {
    let mut st = state.lock().unwrap(); // 异步等待锁
    // 去除首尾空格后再比较
    let u = username.trim();
    let p = password.trim();
    if u == "admin" && p == "123456" {
        st.is_logged_in = true;
        st.username = username;
        st.password = password;
        Ok(true)
    } else {
        st.is_logged_in = false;
        Err("用户名或密码错误".to_string())
    }
}

#[tauri::command]
fn get_counter(state: State<'_, Mutex<AppState>>) -> u32 {
    let st = state.lock().unwrap();
    st.counter
}

#[tauri::command]
fn increment_counter(state: State<'_, Mutex<AppState>>) -> u32 {
    let mut st = state.lock().unwrap();
    st.counter = st.counter.saturating_add(1);
    st.counter
}

#[tauri::command]
fn set_username(state: State<'_, Mutex<AppState>>, username: String) -> String {
    let mut st = state.lock().unwrap();
    st.username = username;
    st.username.clone()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            app.listen("test-event", |event| {
                println!("广播事件test-event: {}", event.payload());
            });
            app.manage(Mutex::new(AppState {
                counter: 0,
                password: "".to_string(),
                username: "".to_string(),
                is_logged_in: false,
            }));
            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            login,
            start_download,
            download1,
            get_counter,
            increment_counter,
            set_username
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
