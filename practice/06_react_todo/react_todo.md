# React 学习笔记：表单与待办交互

## 1. 从只读到能操作

页面打开时读一次模拟数据，后续操作只改 React state，刷新后会回到那 5 条待办。

最密切的几个文件：

```text
App.tsx                  # 完整的 todos、筛选条件，以及三个修改列表的函数
components/TodoForm.tsx  # 输入草稿、空白校验、提交
components/FilterBar.tsx # 当前选中的筛选按钮
components/TodoList.tsx  # 显示筛过的列表，往下传数据和回调
components/TodoItem.tsx  # 一条待办的复选框、状态和删除按钮
```

输入框里还没提交的字只在 `TodoForm` 里用，放它自己那里就够了。列表、统计和筛选都由 `App` 计算，子组件通过 props 拿各自需要的值。

## 2. 输入框里的值是谁管的

04 用 `v-model` 把输入框和数据连起来。React 这里通过`value` 管显示，`onChange` 把用户刚输入的值交回 state：

```tsx
// TodoForm.tsx，省略样式和其他属性
const [draft, setDraft] = useState('')

<input
  value={draft}
  onChange={(event) => setDraft(event.target.value)}
/>
```

如果只传 `value={draft}`，却没在 `onChange` 里更新 `draft`，这个受控输入框就会保持原值,用户在页面输入内容也不会改变。成功提交后调 `setDraft('')`，下一次渲染传下去的 `value` 是空字符串，输入框也跟着清空。

提交统一交给 `<form onSubmit={handleSubmit}>`。新增按钮是 `type="submit"`，所以点按钮和在输入框按回车都走同一个表单入口。Vue 里的 `@submit.prevent`，在这里就是开头的`event.preventDefault()`。

```tsx
function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  const value = draft.trim()
  if (value === '') {
    setFormError('内容不能为空：请输入待办内容')
    return
  }

  onAdd(value)
  setDraft('')
  setFormError('')
}
```

## 3. 勾一条待办的完整流程

05 的圆点只显示状态，这次换成真的复选框。

文本框用 `value`，复选框用布尔值 `checked`：

```tsx
// TodoItem.tsx
<input
  type="checkbox"
  checked={todo.isCompleted}
  onChange={() => onToggle(todo.id)}
/>
```

对照 04，Vue 子组件用 `emit('toggle', id, checked)`，这次 React 子组件拿到 `onToggle` 后只传 `id`，由 `App` 根据当前的完成状态取反。

```tsx
// App.tsx
function toggleTodo(id: number) {
  setTodos((prev) =>
    prev.map((todo) =>
      todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo,
    ),
  )
}
```

比如在「未完成」里勾选「睡觉」，`TodoItem` 先把这条的 ID 传给 `App`。上面的 `map` 在完整列表里替换目标项

新增和删除也是同一个套路：

| 操作 | 子组件传什么 | `App` 怎么得到新数组 |
| --- | --- | --- |
| 新增 | `onAdd(value)` | 展开 `prev`，末尾追加一条 |
| 勾选 | `onToggle(id)` | `map`，只为目标项建一个新对象 |
| 删除 | `onDelete(id)` | `filter`，把目标项排除掉 |

`setTodos(prev => ...)` 里的 `prev` 是 React 处理到这次更新时传入的状态。写法上容易记混的是，`map` 虽然会返回新数组，数组里的原对象还是那些对象，所以改完成状态时也要用 `{ ...todo, isCompleted: ... }` 复制目标项。新增的 ID 取当前最大值加一，空列表从 1 开始。删掉最大 ID 后，它可能被下次新增复用，和剩余条目不会撞号。

## 4. 筛选结果为什么没存 state

切标签只改 `filter`。三个值是 `'all' | 'active' | 'completed'`，`FilterBar` 把选中的值交给 `App`。到渲染时再拿完整列表计算：

```tsx
const completedCount = todos.filter((todo) => todo.isCompleted).length
const activeCount = todos.length - completedCount
const visibleTodos = todos.filter((todo) => {
  if (filter === 'active') return !todo.isCompleted
  if (filter === 'completed') return todo.isCompleted
  return true
})
```

比如总共 5 项、已完成 2 项，切到「未完成」只会显示 3 条，列表头仍然写「共 5 项 · 已完成 2 项」。条目用的是 `visibleTodos`，统计用的是完整的 `todos`。跟 Vue 里的 `computed` 是同一个思路，这里作为渲染时计算的普通变量就够了。

## 5. 哪些逻辑放在 Effect 里

- 页面挂载后，`useEffect` 调 `loadTodos()` 拿初始数据。
- 用户点重试，错误组件通过回调直接再调一次 `loadTodos()`。新增、勾选和删除也由各自的事件触发，这三个操作只调用 `setTodos`。
- 可见列表、完成数随着渲染重新计算。比如勾选后任务移出「未完成」这件事，已经由筛选条件处理了。
