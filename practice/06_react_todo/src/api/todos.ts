import axios from 'axios'
import type { Todo } from '../types/todo'

// baseURL / timeout 集中在这里，组件里不再关心请求细节。
// 本轮模拟数据与页面同源，baseURL 留空即可。
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

// 创建axios实例，用来发送请求，export将实例导出，方便其他模块调用
export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

/* ---------------------------------------------------------------------------
 * 以下 mock 开关只为本轮验收服务（真实接口接入后可整体删掉）：
 *   /               → 正常返回 5 条待办
 *   /?mock=empty    → 返回 []
 *   /?mock=error    → 服务端返回 500
 *   /?delay=1500    → 请求前等待 1500ms，便于观察加载态
 * ------------------------------------------------------------------------- */
type MockScenario = 'default' | 'empty' | 'error'

function readMockScenario(): MockScenario {
  const scenario = new URLSearchParams(window.location.search).get('mock')
  return scenario === 'empty' || scenario === 'error' ? scenario : 'default'
}

function readMockDelay(): number {
  const delay = Number(new URLSearchParams(window.location.search).get('delay'))
  return Number.isFinite(delay) && delay > 0 ? delay : 0
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 三个路径的分流
function mockUrlFor(scenario: MockScenario): string {
  if (scenario === 'empty') return '/mock/todos-empty.json'
  // 这个路径由 vite.config.ts 里的 dev 中间件接手，固定返回 500
  if (scenario === 'error') return '/mock/todos-error.json'
  return '/mock/todos.json'
}

/**
 * 唯一的一次同源 GET：拿到待办数组。
 * 类型标注写在 http.get<Todo[]> 上，response.data 就已经是 Todo[]。
 */
export async function fetchTodos(): Promise<Todo[]> {
  const delay = readMockDelay()
  if (delay > 0) await sleep(delay)

  const response = await http.get<Todo[]>(mockUrlFor(readMockScenario()))

  // 接口不可信：运行时再挡一次，避免非数组数据把渲染层带崩
  if (!Array.isArray(response.data)) {
    throw new Error('接口返回的数据格式不正确：期望待办数组')
  }
  return response.data
}

/** 从响应体里挑出服务端给的 message（Ragent 的后端也是这个字段） */
function readServerMessage(payload: unknown): string | null {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message?: unknown }).message
    if (typeof message === 'string' && message.trim() !== '') return message
  }
  return null
}

/**
 * 把 axios 的各类错误收敛成一句能直接展示的中文提示。
 * （Ragent 里用 toast + 拦截器统一提示，这里练习阶段放在页面层）
 */
export function toErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const serverMessage = readServerMessage(error.response.data)
      if (serverMessage) return `请求失败：${serverMessage}（HTTP ${error.response.status}）`
      return `请求失败：服务端返回 HTTP ${error.response.status}`
    }
    if (error.code === 'ECONNABORTED') {
      return '请求超时，请稍后重试'
    }
    if (error.code === 'ERR_NETWORK') {
      return '网络错误，请求未能到达服务端'
    }
    return `请求失败：${error.message}`
  }
  if (error instanceof Error) return error.message
  return '未知错误，请稍后重试'
}
