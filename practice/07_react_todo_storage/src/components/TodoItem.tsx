import type { Todo } from '../types/todo'

interface TodoItemProps {
  /** 单条待办由父组件通过 props 下行传入，组件内部只读 */
  todo: Todo
  /**
   * 回调 props：相当于 Vue 里 emit('toggle', id) / emit('delete', id)。
   * 条目自己不改数据，只报告“用户对哪条做了什么”，怎么改数组由 App 决定。
   */
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li className={todo.isCompleted ? 'todo todo--done' : 'todo'}>
      {/*
        受控复选框：显示状态完全由 checked={todo.isCompleted} 决定，
        用户点击只触发 onChange 上报 id，下次渲染 props 变了框才变。
        上一轮的装饰圆点换成了真复选框。
      */}
      <input
        className="todo__checkbox"
        type="checkbox"
        checked={todo.isCompleted}
        onChange={() => onToggle(todo.id)}
        aria-label={`切换「${todo.value}」的完成状态`}
      />
      <span className="todo__value">{todo.value}</span>
      <span className={todo.isCompleted ? 'todo__badge todo__badge--done' : 'todo__badge'}>
        {todo.isCompleted ? '已完成' : '未完成'}
      </span>
      <button
        type="button"
        className="todo__delete"
        onClick={() => onDelete(todo.id)}
        aria-label={`删除「${todo.value}」`}
      >
        删除
      </button>
    </li>
  )
}
