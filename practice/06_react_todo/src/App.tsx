import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchTodos, toErrorMessage } from './api/todos'
import type { Todo } from './types/todo'
import type { FilterKind } from './types/filter'
import LoadingState from './components/LoadingState'
import ErrorNotice from './components/ErrorNotice'
import TodoForm from './components/TodoForm'
import FilterBar from './components/FilterBar'
import TodoList from './components/TodoList'
import './App.css'

/** 请求状态仍是三种；页面画面由 status + todos.length + filter 组合出来 */
type RequestStatus = 'loading' | 'success' | 'error'

export default function App() {
  // App 持有页面全部状态：完整列表、请求状态、筛选条件
  // 写操作（新增/勾选/删除）只在 state 里改，本轮不写回服务端，刷新后重新 GET
  const [todos, setTodos] = useState<Todo[]>([])
  const [status, setStatus] = useState<RequestStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  // 筛选条件放在 App：可见列表和统计都依赖它，列表组件不该各自猜
  const [filter, setFilter] = useState<FilterKind>('all')

  // 防重复请求：setStatus 要等下一次渲染才生效，双击的两次点击会落在同一帧里，
  // 用 ref 做同步闸门，重试期间第二次点击直接返回。
  const isRequesting = useRef(false)

  // 获取待办列表：只有“和接口同步”这个时机才用 useEffect
  const loadTodos = useCallback(async () => {
    if (isRequesting.current) return
    isRequesting.current = true
    setStatus('loading')

    try {
      const data = await fetchTodos()
      setTodos(data)
      setErrorMessage('')
      setStatus('success')
    } catch (error) {
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

  /* -----------------------------------------------------------------------
   * 三个写操作：用户触发，直接在事件处理函数里更新 state，不走 HTTP。
   * setTodos(prev => ...) 用函数式更新：基于最新数组算新数组，不依赖闭包里的旧值。
   * -------------------------------------------------------------------- */

  function addTodo(value: string) {
    setTodos((prev) => [
      ...prev,
      {
        // 取当前最大 id + 1：删掉最大 id 后再新增也不会和剩余项撞 id
        id: Math.max(...prev.map((todo) => todo.id), 0) + 1,
        value,
        isCompleted: false,
      },
    ])
  }

  // 添加一个新数组
  function toggleTodo(id: number) {
    // map 返回新数组：只替换目标项，其余项保持原引用
    setTodos(
      // 函数式更新：基于最新数组算新数组，不依赖闭包里的旧值
      (prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo,
      ),
    )
  }

  function deleteTodo(id: number) {
    // filter 同样返回新数组：把目标项排除掉
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
  }

  /* -----------------------------------------------------------------------
   * 派生数据：渲染时从 todos 现算，不额外存 state。
   * -------------------------------------------------------------------- */
  const completedCount = todos.filter((todo) => todo.isCompleted).length
  const activeCount = todos.length - completedCount
  const visibleTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.isCompleted
    if (filter === 'completed') return todo.isCompleted
    return true
  })

  return (
    <main className="page">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">待办列表</h1>
          <span className="page__badge">可交互</span>
        </div>
        <p className="page__subtitle">React + TypeScript · 受控表单与回调 props</p>
      </header>

      {/* 请求态互斥挂载，逻辑与上一轮相同 */}
      {status === 'loading' && <LoadingState />}
      {status === 'error' && (
        <ErrorNotice message={errorMessage} onRetry={() => void loadTodos()} />
      )}
      {status === 'success' && (
        <>
          <TodoForm onAdd={addTodo} />
          <FilterBar filter={filter} onChange={setFilter} />
          <TodoList
            todos={visibleTodos}
            totalCount={todos.length}
            completedCount={completedCount}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
          />
          {/* 与 Vue 版本一致：有任务且全部完成时显示（v-if="totalCount > 0 && activeCount === 0"） */}
          {todos.length > 0 && activeCount === 0 && (
            <p className="done-all">全部完成！</p>
          )}
        </>
      )}

      <footer className="page__footer">
        <div>
          模拟数据：<code>/mock/todos.json</code> · 新增/勾选/删除只更新本次会话，刷新后还原
        </div>
        <div>
          空状态 <code>?mock=empty</code> · 失败 <code>?mock=error</code> · 慢网络{' '}
          <code>?delay=1500</code>
        </div>
      </footer>
    </main>
  )
}
