import { useState, type FormEvent } from 'react'

interface TodoFormProps {
  /**
   * 表单只上报“用户想新增的内容”，列表怎么加、id 怎么生成由 App 决定。
   */
  onAdd: (value: string) => void
}

/**
 * 新增表单：输入草稿是自己的局部 state，提交成功后才交给 App。
 * Vue v-model 的 React 对应写法：
 *   Vue   → <input v-model="draft" />
 *   React → value={draft} + onChange={(e) => setDraft(e.target.value)}
 */
export default function TodoForm({ onAdd }: TodoFormProps) {
  const [draft, setDraft] = useState('')
  // 校验提示也是表单自己的状态，出了这个组件没人关心它
  const [formError, setFormError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // 阻止浏览器默认行为：form 提交默认会整页刷新、把输入拼到 URL 上
    event.preventDefault()
    const value = draft.trim()
    if (value === '') {
      setFormError('内容不能为空：请输入待办内容')
      return
    }
    // 上报给 App 处理新增待办
    onAdd(value)
    // 清理输入框和校验提示
    setDraft('')
    setFormError('')
  }

  return (
    <section className="panel">
      <div className="panel__head">
        <h2 className="panel__title">新增待办</h2>
        <span className="panel__meta">受控输入 · 只更新本次会话</span>
      </div>
      <form className="todo-form" onSubmit={handleSubmit}>
        <div className="todo-form__row">
          <input
            className="todo-form__input"
            type="text"
            value={draft}
            // 受控输入：输入框的显示值和组件里的 state 永远同步
            onChange={(event) => {
              setDraft(event.target.value)
              if (formError !== '') setFormError('')
            }}
            placeholder="请输入待办内容，回车或点击按钮进行提交"
            aria-label="新增待办"
          />
          <button type="submit" className="todo-form__submit">
            新增
          </button>
        </div>
        {formError !== '' && (
          <p className="todo-form__error" role="alert">
            {formError}
          </p>
        )}
      </form>
    </section>
  )
}
