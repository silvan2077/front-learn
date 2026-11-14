/**
 * 三种筛选：key 是 state 里存的值，按钮文案在 FilterBar 里定义。
 * 筛选条件不改数据本身，只决定渲染时“看得见哪些”。
 */
export type FilterKind = 'all' | 'active' | 'completed'
