import TodoItem from './TodoItem'
import type { Todo } from '../types/todo'

interface TodoListProps {
  /** 传进来的已经是筛选后的“可见列表”，全量数据始终在 App 里 */
  todos: Todo[]
  /** 全量统计基于完整列表计算，不受当前筛选影响 */
  totalCount: number
  completedCount: number
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

/**
 * 展示组件：只接收数据与回调 props，不碰请求、不改数据。
 * 空态文案与 Vue 版本保持一致：visibleList 为空就是同一句
 * 「这里空空如也，先添加一条吧」，不再区分“真空了”还是“被筛选藏起来了”。
 */
export default function TodoList({
  todos,
  totalCount,
  completedCount,
  onToggle,
  onDelete,
}: TodoListProps) {
  if (todos.length === 0) {
    return (
      <section className="panel panel--empty">
        <p className="empty__title">这里空空如也，先添加一条吧</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">待办清单</h2>
        <span className="panel__meta">
          共 {totalCount} 项 · 已完成 {completedCount} 项
        </span>
      </div>
      <ul className="todo-list">
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} />
        ))}
      </ul>
    </section>
  )
}
