interface LoadingStateProps {
  hint?: string
}

/** 加载中：三条骨架 + 文案，与「有数据」「空数组」「失败」在视觉上完全不同 */
export default function LoadingState({ hint = '正在加载待办…' }: LoadingStateProps) {
  return (
    <section className="panel" aria-busy="true" aria-live="polite">
      <div className="panel__head">
        <h2 className="panel__title">加载中</h2>
        <span className="panel__meta">GET /mock/todos.json</span>
      </div>
      <div className="skeleton">
        <span className="skeleton__row" />
        <span className="skeleton__row" />
        <span className="skeleton__row" />
      </div>
      <p className="loading__hint">{hint}</p>
    </section>
  )
}
