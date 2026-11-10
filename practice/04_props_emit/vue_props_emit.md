# Vue 学习笔记：组件拆分与 props / emit

## 1. 为什么拆组件

拆组件就是**拆类**：每个组件管一块界面 + 一块职责，边界用 props / emit 说清楚。对照 Java：

组件 ≈ 类，props ≈ 只读入参，emit ≈ 回调/领域事件，"谁的数据谁改" ≈ 封装。

拆分结果：

```
src/
├── App.vue                    # 唯一持有数据的组件：value、list、筛选、统计、存档
└── components/
    ├── TodoForm.vue           # 输入区：输入框、添加按钮、重复提示
    └── TodoItem.vue           # 单条待办：勾选、文案、删除
```

## 2. 两个核心 API

### 2.1 defineProps：声明"我收什么"

```js
// TodoItem.vue
defineProps({
  id: { type: Number, required: true },
  value: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
})
```

- 显式声明后，父组件传值有类型约束，漏传 required 的属性控制台会警告——这就是组件的"接口签名"
- template 里直接用 `{{ value }}`、`:checked="isCompleted"`，**不需要** `props.` 前缀；script 里才要
- 对照 Java：`defineProps` 是构造器参数声明，只读、由外部传入

### 2.2 defineEmits：声明"我报什么"

```js
// TodoItem.vue
const emit = defineEmits(['toggle', 'delete'])
// 用法：emit('toggle', id, checked)、emit('delete', id)
```

- 子组件**不直接改数据**，只发事件报告"用户做了什么"；改不改、怎么改，父组件定
- 事件名就是接口方法名：`toggle(id, checked)`、`delete(id)` 的参数约定就是契约
- 传函数名不加括号的规则照旧：`@toggle="toggle"` 而不是 `@toggle="toggle()"`

## 3. props 只读：checkbox 的写法变化

03 里 checkbox 是 `v-model="item.isCompleted"`——直接改父组件传进来的对象。单文件里没毛病，但拆成子组件后就是**子组件改父数据**，破坏了"谁的数据谁改"。props 是只读的：

```html
<!-- TodoItem.vue：:checked 只读展示，变化上抛 -->
<input
  :checked="isCompleted"
  type="checkbox"
  @change="emit('toggle', id, $event.target.checked)"
/>
```

父组件接事件后按 id 改数据：

```js
// App.vue
function toggle(id, checked) {
  const item = list.value.find(item => item.id === id)
  if (item) item.isCompleted = checked
}
```

对照后端：子组件是前端校验/展示层，写操作必须回服务端（父组件）——不能绕过入口直接改库。

## 4. 组件 v-model：TodoForm 的文本同步

父组件写法和原生输入框一模一样，实现换成了 modelValue / update:modelValue 约定：

```html
<!-- App.vue -->
<TodoForm v-model="value" :is-duplicate="isDuplicate" @add="add" />
```

```js
// TodoForm.vue：可写 computed 做转发
const props = defineProps({
  modelValue: { type: String, default: '' },
  isDuplicate: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'add'])

const value = computed({
  get: () => props.modelValue,          // 父改（清空） → 输入框跟着变
  set: (text) => emit('update:modelValue', text),  // 输入框变 → 父数据变
})
```

- `v-model` 在组件上 ≈ `:modelValue="value"` + `@update:modelValue="value = $event"`——和 3.2 节"v-model 是语法糖"是同一条规律，只是属性名换成了约定的 modelValue
- 用可写 computed 转发而不是 `:value + @input` 朴素写法，是为了保留原生 v-model 的中文输入法合成行为（打拼音过程中不触发中间值）
- 清空路径闭环：`add()` 里 `value.value = ''` → modelValue 变 → get 返回空 → 输入框自动空

## 5. 数据流：沿一次勾选操作讲清楚

在「未完成」筛选里勾选一项，完整链路：

| 步骤 | 谁 | 做什么 |
|---|---|---|
| 1 | TodoItem 的 checkbox | 浏览器 `change` 事件发生，`$event.target.checked` 拿到新布尔值 |
| 2 | TodoItem | `emit('toggle', id, checked)` 上报——它自己不改任何数据 |
| 3 | App.vue `toggle()` | 按 id 找到任务，改 `item.isCompleted` |
| 4 | computed | `visibleList` / `activeCount` 自动重算 → 该项离开「未完成」列表，统计行变化 |
| 5 | deep watch | 数组内部变化被侦听到 → 写回 localStorage |

**谁接到浏览器事件**（子组件）、**谁修改数据**（父组件）、**谁更新统计和存档**（computed + watch 自动派生）——三者分工固定，删除、添加同理（emit delete/add → 父改数据 → 派生自动更新）。

## 6. DOM 层级不变：多根节点

TodoForm 同时管输入区和重复提示，但拆分后**不能多包一层 div**——会改变 DOM 层级和样式结构。Vue 3 允许模板有多个根节点（fragment）：

```html
<!-- TodoForm.vue：两个根节点，产物 DOM 与 03 完全一致 -->
<div class="todo-form">...</div>
<p v-show="isDuplicate" class="warn">该任务已存在，换一个吧</p>
```

scoped 样式随组件走：`.todo-form` 等在 TodoForm，`.item`/`.del` 在 TodoItem，类名不变所以视觉不变。

## 7. 对照表

| 03 单体版 | 04 组件版 |
|---|---|
| `v-model="item.isCompleted"` 直改数据 | `:checked` + `@change` 上报 toggle(id, checked) |
| `@click="del(item.id)"` 内联调用 | `emit('delete', id)` → 父 `del(id)` |
| 输入框 v-model 直绑 ref | 组件 v-model（modelValue + update:modelValue） |
| 状态、界面、样式一个文件 | 数据修改集中在 App.vue，展示拆到子组件 |
| 改待办行要通读全文 | 改待办行只看 TodoItem.vue |
