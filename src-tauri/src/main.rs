// 将可执行入口代理到库的 run()，以加载命令与插件
fn main() {
    tauri_app_lib::run();
}
