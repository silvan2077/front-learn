# Vue 学习笔记

## 1. Vue 解决什么问题

对照原生 JS 版待办：每次状态变化都要手动"找元素 → 改 DOM"——querySelector 取值、createElement 建节点、append 挂载、手动清空输入框。

Vue 把这件事接管了：**只需要改数据，DOM 由框架自动更新**。

## 2. 项目骨架与运行

```
my-vue-app/
├── index.html          # 唯一的 HTML 页面，只有一个 <div id="app">
├── src/main.js         # 入口：createApp(App).mount('#app')
└── src/App.vue         # 根组件
```

- `npm run dev` 启动开发服务器（默认 localhost:5173），改代码浏览器自动热更新，不用手动刷新
- `.vue` 单文件组件 = 三段式：`<script setup>`（状态与逻辑）、`<template>`（视图模板）、`<style scoped>`（样式只作用于本组件，不会污染别的组件）

对照 Java 理解：script 是字段和方法，template 是这个类的展示形态，scoped 样式相当于私有成员。

## 3. 用到的组合式 API

### 3.1 ref：响应式数据

```js
const value = ref('')          // 输入框内容
const list = ref([ ... ])      // 待办数组
```

- ref 包装后的数据是**响应式**的：改它，用到它的视图自动更新
- **script 里读写要 `.value`，template 里不用**（自动解包）——`value.value` 读起来怪，但第二个 `.value` 就是字符串本身
- ref 对数组是**深层**响应式：改 `list.value[0].isCompleted`，视图照样更新

对照 Java：把字段包进一个可监听的容器，setter 被框架拦截后通知视图——机制上接近 AOP 环绕通知，Vue 3 用 Proxy 实现。

### 3.2 v-model：双向绑定

```html
<input v-model="value" type="text" />
```

v-model ≈  `:value="value"` + `@input="value = $event.target.value"` 的组合：输入 → 数据变；数据变 → 输入框变。

对照 js 版：不再需要读 `input.value`、不再需要手动清空——`add()` 里 `value.value = ''` 执行后输入框自动空了。v-model 用在 checkbox 上绑定的是布尔值—— `v-model="item.isCompleted"`，直接绑数组元素的属性；

### 3.3 事件绑定与修饰符

```html
<button type="button" class="todo-button" @click="add">Add Todo</button>
<input ... @keyup.enter="add" />
```

- `@click="add"` ≈ `addEventListener('click', add)`——**传函数名不加括号**的规则原样适用
- `@keyup.enter` 的 `.enter` 是**事件修饰符**：相当于 `if (event.key === 'Enter')` 的语法糖。常用的还有 `.prevent`（≈ preventDefault）、`.stop`（≈ stopPropagation）
- 事件值也可以是**内联表达式**：`@click="activeFilter = f"`——处理只有一行赋值时直接写模板里最省事；逻辑一复杂就换回传方法名

### 3.4 列表渲染 v-for 与 :key

```html
<div v-for="item in list" :key="item.id" ...>
```

- `:key` 必须给，且要**唯一、稳定**：Vue 靠 key 识别"哪条是哪条"，从而最小化更新 DOM
- 用 index 当 key 的坑：删除中间一项后，后面所有项的 index 前移，Vue 会错误地复用 DOM 节点——checkbox 勾选状态这类"节点内部状态"会串到别的行上
- **对照后端：key 就是主键**——永远用业务唯一标识，不用下标。所以数据结构里加了 `id` 字段，`del` 从 `splice(index, 1)` 改为按 id 过滤：

```js
list.value = list.value.filter(item => item.id !== id)
```

### 3.5 :class 绑定

```html
:class="{ item: true, completed: item.isCompleted }"
```

对象语法：键是类名，值是布尔。比原来的三元 + 数组更清晰，还带来一个 CSS 红利——`.completed` 只写差异部分（删除线 + 透明度），基础样式复用 `.item`，不再复制十行。

## 4. 原生 JS 版 → Vue 版 对照表

| 原生 JS（02-js-todo） | Vue（03_vue） |
|---|---|
| `querySelector` 取元素引用存起来 | 不需要——模板直接引用数据 |
| `input.value` 读输入、手动清空 | v-model 双向同步 |
| `createElement` + `append` 手动建节点 | 改数组，DOM 自动增量更新 |
| `addEventListener('click', add)` | `@click="add"` |
| keydown 里判断 `e.key === 'Enter'` | `@keyup.enter="add"` |
| 勾选样式靠 CSS `:checked + .name` 兄弟选择器 | 状态 `isCompleted` 驱动 `:class` |
| `closest` 事件委托 | 不需要——每个按钮绑定自己的处理函数 |

事件委托解决的是"手动管 DOM"的成本；DOM 交给框架管之后，委托的必要性基本消失（极端性能场景除外）。

## 5. 条件渲染：v-if / v-else / v-show

```html
<!-- v-if 复合条件：有任务且全部完成才显示 -->
<p v-if="totalCount > 0 && activeCount === 0" class="done-all">全部完成！</p>

<!-- v-if / v-else 二选一；template v-else 包裹分支但不产生真实 DOM 节点 -->
<div v-if="visibleList.length === 0" class="empty">这里空空如也，先添加一条吧</div>
<template v-else>
  <div v-for="item in visibleList" :key="item.id" ...>...</div>
</template>

<!-- v-show：重复任务的高频提示，每次按键都可能开关 -->
<p v-show="isDuplicate" class="warn">该任务已存在，换一个吧</p>
```

| | v-if | v-show |
|---|---|---|
| 条件为假时 | 不渲染——DOM 里根本没有这个元素 | 渲染了，只是 display:none |
| 切换成本 | 真实的创建/销毁 | 改一个样式属性 |
| 适用场景 | 状态很少变化（权限块、空状态） | 频繁开关（输入提示） |

验证方法：DevTools 的 Elements 面板里，v-if 隐藏时**搜不到**元素，v-show 隐藏时**元素在但带 display:none**

一个细节：空状态判断的是 `visibleList.length === 0` 而不是 `list.length`——筛选到"已完成"且没有已完成项时，用户看到的也是空状态。**条件跟着"用户看到的数据"走**。

## 6. 侦听器 watch 与计算属性 computed

**官方结论：能用 computed 就别用 watch。**

两者职责：

| | computed | watch |
|---|---|---|
| 是什么 | 由数据**派生**出的数据 | 数据变化时执行的**副作用** |
| 本轮场景 | 统计值、筛选结果 | 写 localStorage、重复检测 |
| 对照 Java | 带缓存的 getter | 领域事件监听器 |

computed：声明"我依赖什么"，框架自动重算 + 缓存，模板里当普通数据用：

```js
const totalCount = computed(() => list.value.length)
const activeCount = computed(() => list.value.filter(item => !item.isCompleted).length)
const visibleList = computed(() => { /* 按当前筛选 tab 返回子集 */ })
```

watch：数据变化时执行副作用：

```js
watch(value, (text) => { /* some() 查重 → 开关 isDuplicate */ })

watch(list, (newValue) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue))
}, { deep: true })
```

职责分工值得记：watch 只负责**亮提示**（把 `isDuplicate` 打开/关闭）；真正**拦截重复**的是 `add()` 里的 `some()` 再查一次——提示亮着用户照样能点按钮，写入口的校验不能省。对照后端：查询给提示，保存接口自己再校验一遍。

**两个坑**

1. watch 回调的参数是**解包后的值**——`watch(list, (newValue) => ...)` 里 newValue 就是数组本身，**不要再 `.value`**。本轮把 `newValue.value` 写进了代码，localStorage 里存的就是字符串 `"undefined"`，被运行验证当场抓住。ref 解包规则完整版：**模板里不用、watch 回调参数不用、script 其他地方要用**。
2. 监听数组**内部**变化（勾选某项的 isCompleted）必须 `{ deep: true }`，否则只有整个数组被替换（如 `list.value = filter(...)`）才触发。

## 7. localStorage 持久化：启动读取与 id 防冲突

第 6 节的 watch 负责**写入**；对应的**读取**在启动时做一次，是普通逻辑，不涉及响应式：

```js
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.error('本地存档损坏，使用默认数据', err)
  }
  return [ /* 默认三条数据 */ ]
}
const list = ref(load())
```

三步：读缓存 → 损坏兜底 → 默认数据。try/catch 不能省——存档可能被手动改坏、被别的程序写坏，`JSON.parse` 一抛异常就降级到默认数据，不能让应用起不来。对照后端：读外部存储做防御性解析，坏数据走兜底，而不是让启动失败。

**nextId 防冲突**：数据从 localStorage 恢复后，id 计数器不能从 1 重来，否则新条目会撞上已有 id——key 重复，3.4 的正确性问题换个马甲又回来了：

```js
let nextId = list.value.reduce((max, item) => Math.max(max, item.id), 0) + 1
```

reduce 累计求最大值再 +1，对照 Java Stream 的 `mapToInt(Item::getId).max().orElse(0) + 1`，就是数据库自增主键"取当前最大值 + 1"的思路。另一个细节：`nextId` 是普通变量不是 ref——它只在 `add()` 里自增，不驱动视图。**不需要渲染的数据不用包 ref**。

至此读写闭环：`push`、`filter` 整体替换、勾选 `isCompleted`，都会触发第 6 节的 deep watch 写回 localStorage；刷新后 `load()` 再读回来。

## 8. 筛选 tab：普通数组、内联事件与 active 高亮

```js
const filters = ['全部', '未完成', '已完成']   // 普通数组，不需要 ref
const activeFilter = ref('全部')
```

```html
<button
  v-for="f in filters"
  :key="f"
  type="button"
  :class="{ filter: true, active: activeFilter === f }"
  @click="activeFilter = f"
>{{ f }}</button>
```

- `filters` 永远不变，用普通数组即可——**要不要包 ref，看它会不会变、视图依不依赖它**，不是所有数据都要响应式
- `:key="f"`：字符串数组的 key 直接用字符串本身（唯一且稳定），不用像对象数组那样另找 id 字段
- `@click="activeFilter = f"` 是**内联表达式**：处理只有一行赋值时直接写模板里最省事；逻辑一复杂就换回传方法名（3.3 的规则不变）
- `:class` 这次驱动的是"当前选中哪个 tab"

对照后端：`activeFilter` 是查询条件，`visibleList`是按条件返回的结果集——切换 tab 不动数据本体，只改"看哪部分"。
