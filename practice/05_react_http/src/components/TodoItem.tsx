import type { Todo } from '../types/todo'

interface TodoItemProps {
  /** 单条待办由父组件通过 props 下行传入，组件内部只读 */
  todo: Todo
}

export default function TodoItem({ todo }: TodoItemProps) {
  return (
    <li className={todo.isCompleted ? 'todo todo--done' : 'todo'}>
      {/*
        状态圆点：纯指示，不是控件。
        之前用的是带边框的圆圈 + 勾选符号，视觉上像 checkbox，点下去却没反应，
        所以改成小圆点——没有方框/圆圈轮廓，不会被读成可点击的复选框。
      */}
      <span className="todo__status" aria-hidden="true" />
      <span className="todo__value">{todo.value}</span>
      <span className={todo.isCompleted ? 'todo__badge todo__badge--done' : 'todo__badge'}>
        {todo.isCompleted ? '已完成' : '未完成'}
      </span>
    </li>
  )
}
