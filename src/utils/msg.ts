import { invoke } from '@tauri-apps/api/core'

export const commands = async () => {
  try {
    // 调用一个名为 'greet' 的命令，并传递一个参数 name
    const greetingMessage = await invoke('greet', { name: 'World' })
    console.log(greetingMessage) // 输出: "Hello, World!"
  } catch (e) {
    console.error(e)
  }
}
