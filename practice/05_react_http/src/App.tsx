import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchTodos, toErrorMessage } from './api/todos'
import type { Todo } from './types/todo'
import LoadingState from './components/LoadingState'
import ErrorNotice from './components/ErrorNotice'
import TodoList from './components/TodoList'
import './App.css'

/** 请求状态只有三种，四种页面状态由 status + todos.length 组合出来 */
type RequestStatus = 'loading' | 'success' | 'error'

export default function App() {
  // 页面组件持有全部数据：待办列表、请求状态、错误文案
  // 显式泛型：避免 useState 里类型推断错误
  const [todos, setTodos] = useState<Todo[]>([])
  const [status, setStatus] = useState<RequestStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  // 防重复请求：setStatus 要等下一次渲染才生效，双击的两次点击会落在同一帧里，
  // 用 ref 做同步闸门，重试期间第二次点击直接返回。
  const isRequesting = useRef(false)


  // 获取待办列表
  // 使用useCallback来缓存函数，避免每次渲染都新建函数
  const loadTodos = useCallback(async () => {
    // 守卫子句，在await之前，同步执行，可以挡住双击
    if (isRequesting.current) return
    isRequesting.current = true
    setStatus('loading')

    try {
      // 1. Axios 拿回来的 response.data 就是 Todo[]
      // fetchTodos返回的是Promise<Todo[]>,await之后data才是Todo[]
      const data = await fetchTodos()
      // 2. react18会批处理成一次渲染，同时更新多个状态
      setTodos(data)
      setErrorMessage('')
      setStatus('success')
    } catch (error) {
      // 3. 失败分支：清空旧数据，只留错误提示，避免同时展示旧列表
      setTodos([])
      setErrorMessage(toErrorMessage(error))
      setStatus('error')
    } finally {
      isRequesting.current = false
    }
  }, [])

  // 首次加载：组件挂载后发起一次 GET
  useEffect(() => {
    void loadTodos()
  }, [loadTodos])

  return (
    <main className="page">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">待办列表</h1>
          <span className="page__badge">只读</span>
        </div>
        <p className="page__subtitle">React + TypeScript · 一次同源 GET</p>
      </header>

      {/* 三种状态互斥挂载，第四种（成功但空数组）由 TodoList 内部判断 */}
      {status === 'loading' && <LoadingState />}
      {status === 'error' && (
        <ErrorNotice message={errorMessage} onRetry={() => void loadTodos()} />
      )}
      {status === 'success' && <TodoList todos={todos} />}

      <footer className="page__footer">
        <div>
          模拟数据：<code>/mock/todos.json</code>
        </div>
        <div>
          空状态 <code>?mock=empty</code> · 失败 <code>?mock=error</code> · 慢网络{' '}
          <code>?delay=1500</code>
        </div>
      </footer>
    </main>
  )
}
