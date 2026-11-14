# React 学习笔记：TypeScript + HTTP 只读待办

## 0. React 项目怎么初始化

### 0.1 从零建一个 Vite + React + TypeScript 项目

确认已安装 Node.js 和 npm，可以用 `node -v`、`npm -v` 查看版本。

```powershell
npm create vite@latest my-react-app -- --template react-ts
cd my-react-app
npm install
npm run dev
```

- `react-ts` 选择 React + TypeScript 模板。
- `npm install` 安装 `package.json` 声明的依赖。`npm run dev` 执行其中的 `dev` 脚本，启动开发服务器。浏览器打开终端输出的地址，通常是 `http://localhost:5173/`。
- React 提供组件和 Hooks，React DOM 把组件渲染到浏览器页面，Vite 负责开发服务器和打包。
- `@latest` 使用当前脚手架，生成的依赖版本会随模板更新。

也可以运行 `npm run build`，先用 TypeScript 检查类型，再由 Vite 生成 `dist/`。

### 0.2 从 HTML 到第一个组件

浏览器先加载 `index.html`。其中的 `div` 是 React 要使用的 DOM 容器，模块脚本指向应用入口：

```html
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
```

`src/main.tsx` 找到容器，创建 React 根并渲染 `App`：

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const container = document.getElementById('root')
if (!container) throw new Error('找不到 #root 挂载点')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

1. `getElementById('root')` 查找 HTML 里的容器。HTML 和入口脚本的 ID 要一致，否则得到 `null`。
2. `createRoot(container)` 创建 React 根，`.render(...)` 把组件树渲染进这个容器。
3. `App` 是 `src/App.tsx` 导出的根组件，`<App />` 是使用它的 JSX 写法。`.tsx` 文件可以同时写 TypeScript 和 JSX。
4. `StrictMode` 会在开发环境增加检查，包括额外执行一次 Effect 的设置与清理。本练习的首次 GET 在 `App` 的 Effect 中发起，入口文件负责挂载组件。

## 1. 这一轮换了什么

- 数据不再来自 `localStorage`，而是 `GET /mock/todos.json`
- 页面要能显示四种画面：加载中、有数据、空数组、请求失败
- 失败后能重试，重试期间不能重复发请求

技术栈：Vite + React 18 + TypeScript + Axios。请求写法参照 Ragent `frontend/src/services/api.ts`（`axios.create` 建实例、`baseURL` 走环境变量）。

## 2. 文件职责：谁管什么

```
src/
├── main.tsx                 # 入口：createRoot 挂到 #root，引全局样式
├── App.tsx                  # 页面组件：持状态、发请求、决定渲染哪一屏
├── App.css                  # 全站样式（所有组件的 class 都在这里）
├── index.css                # 全局：body 渐变底、字体、box-sizing
├── types/todo.ts            # Todo 接口：数据长什么形状
├── api/todos.ts             # axios 实例 + 一次 GET + 错误翻译
└── components/
    ├── TodoList.tsx         # 列表壳 + 空状态 + 统计
    ├── TodoItem.tsx         # 单条：状态圆点、文案、徽标
    ├── LoadingState.tsx     # 骨架屏
    └── ErrorNotice.tsx      # 错误卡片 + 重试按钮
```

`todos.ts` 管**怎么拿到**，`App.tsx` 管**存在哪、何时拿**，组件管**长什么样**，CSS 管**好不好看**。

## 3. 类型

### 3.1 Todo 接口

```ts
export interface Todo {
  id: number
  value: string
  isCompleted: boolean
}
```

**类型是编译期契约**，`import type { Todo }` 打包后整行消失，不进 浏览器的bundle。

### 3.2 三态联合类型

```ts
type RequestStatus = 'loading' | 'success' | 'error'
```

作用等价 Java 的 `enum`，但只活在编译期（运行时就是个字符串，没有枚举对象）。它把 `status` 锁死在三值内，写成 `'ok'` 立刻爆红

**注意：三个状态值能表达四种画面**，因为"成功但空数组"不是新状态，而是 `success` + `todos.length === 0` 的组合。

## 4. 状态：useState 与 useRef 的分工

```ts
const [todos, setTodos] = useState<Todo[]>([])
const [status, setStatus] = useState<RequestStatus>('loading')
const [errorMessage, setErrorMessage] = useState('')
const isRequesting = useRef(false)
```

### 4.1 泛型不能省

`useState([])` 会把 `[]` 推断成 `never[]`（空数组没有元素可推断），后面 `setTodos(data)` 直接报错。所以必须写 `useState<Todo[]>([])`。

初始值用 `[]` 而不是 `null`，下游 `todos.map()` 就永远不用判空。

### 4.2 ref 做闸门

`setState` 是**异步批处理**的：调了 `setState(true)` 之后，同一个事件循环里再读，拿到的还是旧值。双击的两次 `click` 落在同一帧，两次都读到"没在请求"，于是发两次 GET。

`useRef(false)` 返回 `{ current: false }`，**改 `.current` 不触发重渲染**，本质是组件实例上的一个普通成员变量。它是同步的，所以 `if (isRequesting.current) return` 立刻生效。

判断法则：**要影响画面 → `useState`；只是流程控制 / 计时器 / 存上一次的值 → `useRef`**。

## 5. 请求层

### 5.1 建实例，不用全局 axios

```ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})
```

- `import.meta.env` 是 Vite 的机制，只有 `VITE_` 前缀的变量才会被注入前端产物 —— 这是**安全边界**，防止把数据库密码之类打包进 JS
- 这个类型来自 `tsconfig.json` 的 `"types": ["vite/client"]`，删掉就会报 `Property 'env' does not exist`
- 建实例而不是直接用全局 `axios`：配置集中、不被第三方库污染，后续拦截器（token、401）也挂在这里

### 5.2 泛型只是承诺，运行时还得再挡一次

```ts
const response = await http.get<Todo[]>(url)
if (!Array.isArray(response.data)) {
  throw new Error('接口返回的数据格式不正确：期望待办数组')
}
return response.data
```

`http.get<Todo[]>` **不会校验运行时数据**，它只是告诉编译器"相信我"。所以加一道 `Array.isArray`进行检验。

但要知道它的强度：只保证"是个数组"，**不保证每个元素有 `id` / `value` / `isCompleted`**。后端把 `value` 改名成 `title`，这里照样放行，崩在渲染层。

## 6. 挂载时触发：useEffect 与稳定的函数依赖

```ts
const loadTodos = useCallback(async () => { /* 请求逻辑 */ }, [])

useEffect(() => {
  void loadTodos()
}, [loadTodos])
```

- **不能写 `useEffect(async () => {...})`**：effect 回调必须返回清理函数或 `undefined`，`async` 函数永远返回 Promise，React 会把它当清理函数调用并报错。所以在同步回调里调 async 函数。
- **`void`**：明确声明"我知道它返回 Promise，故意不 await"，避免 lint 的 floating promise 警告。
- **不能写在组件体里**：渲染必须纯。写在渲染里，每次渲染都发请求。

本例的 `loadTodos` 由首次加载和重试共用，所以用 `useCallback` 保持函数引用在普通重渲染之间稳定。若每次渲染都创建新函数，`[loadTodos]` 会检测到依赖变化并重新运行 Effect，可能反复发请求。开发环境下 `StrictMode` 仍会额外运行一次设置与清理，此时正在进行的请求由 `isRequesting.current` 拦住重复进入。

## 7. 渲染：三态四画面

```tsx
{status === 'loading' && <LoadingState />}
{status === 'error' && (
  <ErrorNotice message={errorMessage} onRetry={() => void loadTodos()} />
)}
{status === 'success' && <TodoList todos={todos} />}
```

- `&&`左边为 `true` 才渲染组件；为 `false` 时 React 什么都不渲染
- 多行 JSX 必须用括号包起来，否则 `return` 后换行会被 ASI（自动分号插入）截断，函数返回 `undefined`，页面空白
- 空数组不单独开分支，交给 `TodoList` 内部判断 —— `App` 只关心"请求成不成功"，"成功但没数据"属于展示层

## 8. 回调 prop：React 里的 emit

```tsx
// ErrorNotice.tsx
interface ErrorNoticeProps {
  message: string
  onRetry: () => void      // 相当于 Vue 的 emit('retry')
}
```

```tsx
// App.tsx 传入
<ErrorNotice message={errorMessage} onRetry={() => void loadTodos()} />
```

两个细节：

1. **为什么不再直接传 `onRetry={loadTodos}`**：直接传引用，React 调用时会把**点击事件对象当第一个参数**传进去。现在 `loadTodos` 不接参数所以碰巧没事，一旦签名变成 `loadTodos(force?: boolean)`，`force` 收到的是 `MouseEvent` —— 包一层箭头函数等于声明"参数和时机由我控制"。
2. **子组件不认识 axios，也不改状态**，只负责"报告用户点了重试"。改不改、怎么改，父组件定

对照 Java：回调 prop ≈ 传入一个 `Consumer<T>` / 监听器接口；父组件是服务端，子组件只能发起请求，不能绕过入口直接改库。

## 9. 错误分类：`response` 有没有值

```ts
if (axios.isAxiosError(error)) {
  if (error.response) { /* 服务端答复了，只是答复的是错误 */ }
  if (error.code === 'ECONNABORTED') { /* 超时 */ }
  if (error.code === 'ERR_NETWORK') { /* 没走通 */ }
}
```

| 情况 | `response` | `code` | 提示 |
|---|---|---|---|
| 404 / 500 | **有** | — | 读服务端 `message` + 状态码 |
| 超时 | 无 | `ECONNABORTED` | 请求超时 |
| 断网 / 跨域被拦 | 无 | `ERR_NETWORK` | 网络错误，请求未到达 |

**有 `response` = 服务端答复了；没有 = 请求根本没走通**。两类问题排查方向完全不同，提示语必须分开。

`toErrorMessage(error: unknown)` 用 `unknown` 而不是 `any`：`any` 会关掉检查，`unknown` 要求用之前先证明类型。`axios.isAxiosError()` 是**类型守卫**，返回 `true` 的分支里 `error` 自动收窄成 `AxiosError`，才能安全访问 `.response` / `.code` —— 类比 Java 的 `instanceof` 后强转。

## 10. 一次完整的请求与重试

| 步骤 | 谁 | 做什么 |
|---|---|---|
| 1 | `App` 挂载 | `useEffect` 调 `loadTodos()`，`status = 'loading'` |
| 2 | `loadTodos` | 过闸门 → 置位 → 调 `fetchTodos()` |
| 3 | `api/todos.ts` | `http.get<Todo[]>` → `response.data` 是 `Todo[]` |
| 4 | `App` | `setTodos(data)`、清错误、`status = 'success'` |
| 5 | `TodoList` | 收到 `todos` props，`map` 出 `TodoItem` |
| 6 | `TodoItem` | 收到 `todo` props，渲染圆点 + 文案 + 徽标 |
| 7 | 失败时 | `catch` → 清空列表、存错误文案、`status = 'error'` |
| 8 | `ErrorNotice` | 显示文案，点按钮调 `onRetry` |
| 9 | 回到第 2 步 | 闸门拦住重复点击，成功后第 4 步清掉旧错误 |

`finally` 里复位闸门是**必须**的：放到 `try` 末尾，一旦走 `catch` 就永远停在 `true`，之后每次重试都被直接 return，页面永久卡死且不报错。
