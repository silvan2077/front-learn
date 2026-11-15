import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchTodos, toErrorMessage } from './api/todos'
import { loadStoredTodos, saveTodos } from './storage/todos'
import type { Todo } from './types/todo'
import type { FilterKind } from './types/filter'
import LoadingState from './components/LoadingState'
import ErrorNotice from './components/ErrorNotice'
import TodoForm from './components/TodoForm'
import FilterBar from './components/FilterBar'
import TodoList from './components/TodoList'
import './App.css'

/** 请求状态仍是三种；"success" 现在表示"已经有数据"，来源可以是存档或 GET */
type RequestStatus = 'loading' | 'success' | 'error'

export default function App() {
  /* ---------------------------------------------------------------------
   * 启动顺序：
   * 1. useState 惰性初始化保证存档只在首次渲染时读一次
   * 2. 存在有效存档 → todos 直接用它，status 直接是 success，跳过 GET
   * 3. 没有可用存档（null，含"从没存过"和"存档损坏"）→ loading → 挂载后 GET
   * 注意区分：null（没存过/损坏）和 []（用户删光了，合法状态）是两回事
   * -------------------------------------------------------------------- */
  const [archivedTodos] = useState(() => loadStoredTodos())
  const [todos, setTodos] = useState<Todo[]>(archivedTodos ?? [])
  const [status, setStatus] = useState<RequestStatus>(archivedTodos ? 'success' : 'loading')
  const [errorMessage, setErrorMessage] = useState('')
  // 存储写入失败的提示（配额占满、浏览器禁用存储等）；只提示，不阻塞页面操作
  const [storageError, setStorageError] = useState('')
  // 筛选条件和输入草稿不持久化：刷新后回到默认值
  const [filter, setFilter] = useState<FilterKind>('all')

  // 防重复请求：setStatus 要等下一次渲染才生效，双击的两次点击会落在同一帧里，
  // 用 ref 做同步闸门，重试期间第二次点击直接返回。
  const isRequesting = useRef(false)

  // 获取待办列表：只在"没有可用存档"这个时机才会被调用
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

  // 首次加载：有存档就不发请求（Network 面板里看不到初始 GET）
  useEffect(() => {
    if (archivedTodos !== null) return
    void loadTodos()
  }, [archivedTodos, loadTodos])

  /* ---------------------------------------------------------------------
   * 持久化：等初始化成功（有存档或首次 GET 成功）后，todos 每次变化都写回。
   * 这就是 Vue 版 watch(list, ..., { deep: true }) 的 React 对应物：
   * 事件处理函数只负责改 state，React 提交渲染后由 Effect 同步到浏览器存储。
   * status !== 'success' 时（还在 loading / GET 失败）绝不写入，
   * 否则启动时的默认空数组会先把好存档覆盖掉。
   * -------------------------------------------------------------------- */
  useEffect(() => {
    // 初始化成功前不会进行写入
    if (status !== 'success') return
    try {
      saveTodos(todos)
      setStorageError('')
    } catch (error) {
      // 写入失败（配额占满/存储被禁用）：页面照常可操作，只提示本次改动没保存
      console.error('写入浏览器存储失败', error)
      setStorageError('本次改动未能保存到浏览器存储，页面仍可继续操作')
    }
  }, [todos, status])

  /* ---------------------------------------------------------------------
   * 三个写操作：与上一轮相同，仍然只改 state；
   * "顺便存到 localStorage"这件事不在这些函数里做，统一交给上面的 Effect。
   * -------------------------------------------------------------------- */

  function addTodo(value: string) {
    setTodos((prev) => [
      ...prev,
      {
        // 取当前最大 id + 1：恢复自存档的列表同样适用，删掉最大 id 后再新增也不会撞号
        id: Math.max(...prev.map((todo) => todo.id), 0) + 1,
        value,
        isCompleted: false,
      },
    ])
  }

  function toggleTodo(id: number) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo,
      ),
    )
  }

  function deleteTodo(id: number) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id))
  }

  // 派生数据：渲染时从 todos 现算
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
          <span className="page__badge">本地持久化</span>
        </div>
        <p className="page__subtitle">React + TypeScript · localStorage 存取与兜底</p>
      </header>

      {/* 存储写入失败提示：黄色警示条，出现后页面功能照常 */}
      {storageError !== '' && (
        <p className="storage-warning" role="alert">
          {storageError}
        </p>
      )}

      {/* 请求态互斥挂载；有存档时挂载即 success，不会出现加载画面 */}
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
          {/* 与 Vue 版本一致：有任务且全部完成时显示 */}
          {todos.length > 0 && activeCount === 0 && (
            <p className="done-all">全部完成！</p>
          )}
        </>
      )}

      <footer className="page__footer">
        <div>
          模拟数据：<code>/mock/todos.json</code> · 首次打开作为初始值，之后的改动保存在浏览器
          localStorage
        </div>
        <div>
          空状态 <code>?mock=empty</code> · 失败 <code>?mock=error</code> · 慢网络{' '}
          <code>?delay=1500</code>
        </div>
      </footer>
    </main>
  )
}
