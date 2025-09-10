use serde::Serialize;
use tauri::ipc::Channel;
use tauri::{AppHandle, Emitter};

// 定义一个简单的问候命令
#[tauri::command]
pub async fn greet(name: String) -> Result<String, String> {
    if name.is_empty() {
        return Err("名字不能为空".to_string());
    }
    Ok(format!("你好，{}！欢迎使用 Tauri 插件！", name))
}

//3.2 事件（Events） - “广播通知”
//后端广播事件
#[tauri::command]
pub fn start_download(app: AppHandle, url: String) {
    // 后端广播事件
    let _ = app.emit("download-started", &url);
    for p in [10, 30, 70, 100] {
        let _ = app.emit("download-progress", p);
    }
    let _ = app.emit("download-finished", &url);
}

//3.3 Streams (流)
#[derive(Clone, Serialize)]
#[serde(tag = "event", content = "data", rename_all = "camelCase")]
pub enum DownloadEvent<'a> {
    Started { url: &'a str, total: usize },
    Progress { received: usize },
    Finished,
}

#[tauri::command]
pub async fn download1(_app: AppHandle, url: String, on_event: Channel<DownloadEvent<'_>>) -> Result<(), String> {
    // 发送开始事件
    on_event
        .send(DownloadEvent::Started {
            url: &url,
            total: 1000,
        })
        .map_err(|e| format!("Failed to send started event: {}", e))?;

    // 模拟下载进度
    for chunk in [120, 300, 250, 330] {
        on_event
            .send(DownloadEvent::Progress { received: chunk })
            .map_err(|e| format!("Failed to send progress event: {}", e))?;

        // 添加小延迟模拟下载过程
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    }

    // 发送完成事件
    on_event
        .send(DownloadEvent::Finished)
        .map_err(|e| format!("Failed to send finished event: {}", e))?;

    Ok(())
}


