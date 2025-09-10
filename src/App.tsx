import { useState, useEffect } from 'react'
import { load, type Store } from '@tauri-apps/plugin-store'
import { invoke, Channel } from '@tauri-apps/api/core'
import { emit, listen } from '@tauri-apps/api/event'
import { myAsk, myConfirm, myMessage, mySave, myOpen } from './utils/dialog'
import { commands } from './utils/msg'
import './App.css'

type DownloadEvent =
  | { event: 'started'; data: { url: string; total: number } }
  | { event: 'progress'; data: { received: number } }
  | { event: 'finished' }

function Home() {
  const [currentTheme, setCurrentTheme] = useState('light')
  const [store, setStore] = useState<Store | null>(null)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('123456')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [status, setStatus] = useState<{ type: string; message: string } | null>(null)

  // 仅在 Tauri 环境下使用窗口与 Store 等 API
  const isTauri = typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined

  // 初始化 - 组件挂载时执行
  useEffect(() => {
    const initializeStore = async () => {
      try {
        if (!isTauri) {
          // 浏览器模式下跳过持久化存储
          document.documentElement.setAttribute('data-theme', currentTheme)
          return
        }
        // 1. 加载 Store（如果文件不存在会自动创建）
        const appStore = await load('settings.json', { defaults: {} })
        setStore(appStore)

        // 2. 尝试读取保存的主题
        const savedTheme = (await appStore.get('currentTheme')) as unknown as string | null

        if (typeof savedTheme === 'string' && savedTheme.length > 0) {
          // 3. 如果找到保存的主题，应用它
          setCurrentTheme(savedTheme)
          document.documentElement.setAttribute('data-theme', savedTheme)
        } else {
          // 4. 如果没有保存的主题，使用默认主题并保存
          await appStore.set('currentTheme', currentTheme)
          await appStore.save()
        }
      } catch (error) {
        console.error('初始化 Store 失败:', error)
        setStatus({ type: 'error', message: '初始化设置失败' })
      }
    }

    initializeStore()
  }, [])

  // 监听事件
  useEffect(() => {
    let un1: (() => void) | undefined
    let un2: (() => void) | undefined
    let un3: (() => void) | undefined
    let un4: (() => void) | undefined

    const setupListeners = async () => {
      try {
        un1 = await listen<string>('download-started', (e) => {
          console.log('开始下载:', e.payload)
          setStatus({ type: 'success', message: `开始下载: ${e.payload}` })
        })
        un2 = await listen<number>('download-progress', (e) => {
          console.log('进度:', e.payload, '%')
          setStatus({ type: 'success', message: `下载进度: ${e.payload}%` })
        })
        un3 = await listen<string>('download-finished', (e) => {
          console.log('完成下载:', e.payload)
          setStatus({ type: 'success', message: `下载完成: ${e.payload}` })
        })
        un4 = await listen<string>('test-event', (e) => {
          console.log('测试事件:', e.payload)
          setStatus({ type: 'success', message: `收到事件: ${e.payload}` })
        })
      } catch (error) {
        console.error('设置监听器失败:', error)
      }
    }

    setupListeners()

    return () => {
      un1?.()
      un2?.()
      un3?.()
      un4?.()
    }
  }, [])

  // 切换主题
  const changeTheme = async (themeName: string) => {
    try {
      // 1. 更新状态
      setCurrentTheme(themeName)

      // 2. 应用主题到页面
      document.documentElement.setAttribute('data-theme', themeName)

      // 3. 保存到 Store
      if (isTauri && store) {
        await store.set('currentTheme', themeName)
        await store.save()
        setStatus({ type: 'success', message: `主题已切换为${themeName}` })
      }
    } catch (error) {
      console.error('切换主题失败:', error)
      setStatus({ type: 'error', message: '切换主题失败' })
    }
  }

  const start = () => {
    emit('test-event', { url: 'https://a.com/file' })
    setStatus({ type: 'success', message: '测试事件已发送' })
  }

  const start2 = async () => {
    try {
      const onEvent = new Channel<DownloadEvent>()
      onEvent.onmessage = (msg) => {
        if (msg.event === 'started') {
          console.log('开始', msg.data)
          setStatus({ type: 'success', message: `下载开始: ${msg.data.url}` })
        }
        if (msg.event === 'progress') {
          console.log('进度+ ', msg.data.received)
          setStatus({ type: 'success', message: `下载进度: ${msg.data.received} bytes` })
        }
        if (msg.event === 'finished') {
          console.log('完成')
          setStatus({ type: 'success', message: '下载完成' })
        }
      }

      console.log('调用 download1 命令...')
      const result = await invoke('download1', { url: 'https://example.com', onEvent })
      console.log('download1 命令执行完成:', result)
    } catch (error) {
      console.error('download1 命令执行失败:', error)
      setStatus({ type: 'error', message: '下载命令执行失败' })
    }
  }

  const handleLogin = async () => {
    try {
      const success = await invoke('login', { username, password })
      if (success) {
        setIsLoggedIn(true)
        setStatus({ type: 'success', message: '登录成功' })
        console.log('登录成功', success)
      } else {
        setStatus({ type: 'error', message: '用户名或密码错误' })
      }
    } catch (error) {
      setStatus({ type: 'error', message: '登录失败: ' + error })
    }
  }

  const start3 = async () => {
    try {
      await invoke('start_download', { url: 'https://a.com/file' })
      setStatus({ type: 'success', message: '开始下载任务' })
    } catch (error) {
      setStatus({ type: 'error', message: '启动下载失败' })
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUsername('admin')
    setPassword('123456')
    setStatus({ type: 'success', message: '已退出登录' })
  }

  return (
    <div className="theme-switcher">
      <h2>主题切换器</h2>

      <div className="current-theme">
        <span>当前主题:</span>
        <span>{currentTheme}</span>
      </div>

      <div className="theme-buttons">
        <button
          className={`theme-button light ${currentTheme === 'light' ? 'active' : ''}`}
          onClick={() => changeTheme('light')}
        >
          浅色主题
        </button>

        <button
          className={`theme-button dark ${currentTheme === 'dark' ? 'active' : ''}`}
          onClick={() => changeTheme('dark')}
        >
          深色主题
        </button>

        <button
          className={`theme-button blue ${currentTheme === 'blue' ? 'active' : ''}`}
          onClick={() => changeTheme('blue')}
        >
          蓝色主题
        </button>
      </div>

      <div className="function-buttons">
        <button
          onClick={commands}
          className="function-button"
        >
          命令测试
        </button>
        <button
          onClick={start3}
          className="function-button"
        >
          开始下载
        </button>
        <button
          onClick={start}
          className="function-button"
        >
          发送事件
        </button>
        <button
          onClick={start2}
          className="function-button"
        >
          流式下载
        </button>
      </div>

      <div className="login-form">
        <h3>用户登录</h3>
        {!isLoggedIn ? (
          <div>
            <div className="form-group">
              <label htmlFor="username">用户名</label>
              <input
                id="username"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="用户名"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">密码</label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
              />
            </div>
            <button
              onClick={handleLogin}
              className="login-button"
            >
              登录
            </button>
          </div>
        ) : (
          <div>
            <p>已登录为: {username}</p>
            <button
              onClick={handleLogout}
              className="login-button"
            >
              退出登录
            </button>
          </div>
        )}
      </div>

      <div className="dialog-buttons">
        <button
          onClick={myOpen}
          className="dialog-button"
        >
          打开文件
        </button>
        <button
          onClick={mySave}
          className="dialog-button"
        >
          保存文件
        </button>
        <button
          onClick={myAsk}
          className="dialog-button"
        >
          询问对话框
        </button>
        <button
          onClick={myConfirm}
          className="dialog-button"
        >
          确认对话框
        </button>
        <button
          onClick={myMessage}
          className="dialog-button"
        >
          消息提示
        </button>
      </div>

      {status && <div className={`status-message status-${status.type}`}>{status.message}</div>}
    </div>
  )
}

export default Home
