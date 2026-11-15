import type { Todo } from '../types/todo'

/**
 * 练习使用的存储 key：带命名空间前缀，避免和其他练习/项目的存档互相覆盖。
 * 浏览器按"源"划分存储：换端口、换域名就是另一份 localStorage。
 */
export const STORAGE_KEY = 'front-learn:react-todos'

/**
 * 单条记录的合法性检查：id 是整数、value 是字符串、isCompleted 是布尔值。
 * 用 unknown 接住任意来路不明的数据，先验后用——存档是"不可信输入"。
 */
function isValidTodo(record: unknown): record is Todo {
  if (record === null || typeof record !== 'object') return false
  const item = record as Record<string, unknown>
  return (
    typeof item.id === 'number' &&
    Number.isInteger(item.id) &&
    typeof item.value === 'string' &&
    typeof item.isCompleted === 'boolean'
  )
}

/**
 * 读存档。返回值只有两种含义，调用方必须区分：
 *   Todo[]    → 有合法存档（可能是空数组 []，表示"用户删光了"，同样是合法状态）
 *   null      → 没有存档，或存档损坏（解析失败 / 结构不对 / ID 重复或越界）→ 调用方走初始 GET
 * @returns 合法的待办数组，或 null
 */
export function loadStoredTodos(): Todo[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    // getItem 没有记录时返回 null：这是"从没存过"，和"存了空数组"必须分开
    if (raw === null) return null

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      console.error('本地存档不是待办数组，已忽略存档并回退到接口数据', parsed)
      return null
    }
    // 逐条校验，有一条不合法就认为整个存档不可信，整体走 GET 兜底
    if (!parsed.every((record) => isValidTodo(record))) {
      console.error('本地存档里有不合结构的记录，已忽略存档并回退到接口数据', parsed)
      return null
    }
    // 跨条目校验（单条校验覆盖不了的 ID 不变式）：
    //   1. ID 不允许重复——React 用 id 当列表 key，重复会撞 key，按 id 增删也会误伤
    //   2. 最大 ID 必须还能安全 +1——App 用 max+1 生成新 ID，
    //      达到或超过 Number.MAX_SAFE_INTEGER 时递增会失去精度，新增立刻撞号
    const ids = parsed.map((record) => record.id)
    const hasDuplicateIds = new Set(ids).size !== ids.length
    const maxId = ids.reduce((max, id) => Math.max(max, id), 0)
    if (hasDuplicateIds || maxId >= Number.MAX_SAFE_INTEGER) {
      console.error('本地存档的待办 ID 重复或超出可安全递增的范围，已忽略存档并回退到接口数据', parsed)
      return null
    }
    return parsed
  } catch (error) {
    // JSON.parse 对 "not-json" 这类内容会直接抛错，落到这里
    console.error('读取本地存档失败，已回退到接口数据', error)
    return null
  }
}

/**
 * 写存档。localStorage 的 setItem 可能抛异常（配额被占满、浏览器禁用存储），
 * 所以这里只负责写，让调用方（App 的持久化 Effect）决定失败后怎么办。
 */
export function saveTodos(todos: Todo[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}
