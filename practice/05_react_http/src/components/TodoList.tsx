import TodoItem from './TodoItem'
import type { Todo } from '../types/todo'

interface TodoListProps {
  todos: Todo[]
}

/**
 * 展示组件：只接收数据 props，不碰请求、不改数据。
 * 空数组分支放在这里，页面组件只根据 status 决定挂载哪个状态组件。
 */
export default function TodoList({ todos }: TodoListProps) {
  const completedCount = todos.filter((todo) => todo.isCompleted).length

  if (todos.length === 0) {
    return (
      <section className="panel panel--empty">
        <p className="empty__title">请求成功，但暂时没有待办</p>
        <p className="empty__hint">接口返回了空数组 []，所以这里展示空状态。</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">待办清单</h2>
        <span className="panel__meta">
          共 {todos.length} 项 · 已完成 {completedCount} 项
        </span>
      </div>
      <ul className="todo-list">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </ul>
      <p className="todo-list__note">只读展示：本轮不支持勾选、编辑与删除</p>
    </section>
  )
}
