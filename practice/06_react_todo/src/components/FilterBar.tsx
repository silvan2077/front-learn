import type { FilterKind } from '../types/filter'

/** 三个筛选项的定义集中在这里，渲染时 map 出按钮 */
const FILTERS: Array<{ key: FilterKind; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '未完成' },
  { key: 'completed', label: '已完成' },
]

interface FilterBarProps {
  /** 当前筛选条件由 App 持有，这里只负责展示与上报 */
  filter: FilterKind
  onChange: (next: FilterKind) => void
}

export default function FilterBar({ filter, onChange }: FilterBarProps) {
  return (
    <div className="filter-bar" role="group" aria-label="筛选待办">
      {FILTERS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={
            filter === key ? 'filter-bar__item filter-bar__item--active' : 'filter-bar__item'
          }
          aria-pressed={filter === key}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
