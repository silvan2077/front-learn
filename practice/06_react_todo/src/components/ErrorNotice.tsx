interface ErrorNoticeProps {
  message: string
  /**
   * 回调 prop：相当于 Vue 里子组件 emit('retry')。
   * 子组件不认识 axios，也不改请求状态，只负责“报告用户点了重试”。
   */
  onRetry: () => void
}

export default function ErrorNotice({ message, onRetry }: ErrorNoticeProps) {
  return (
    <section className="panel panel--error" role="alert">
      <div className="panel__head">
        <h2 className="panel__title">加载失败</h2>
        <span className="panel__meta">请求没有拿到待办数据</span>
      </div>
      <p className="error__message">{message}</p>
      <button type="button" className="error__retry" onClick={onRetry}>
        重试
      </button>
    </section>
  )
}
