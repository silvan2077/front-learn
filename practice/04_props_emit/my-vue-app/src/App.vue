<script setup>
import { ref, computed, watch } from 'vue'
import TodoForm from './components/TodoForm.vue'
import TodoItem from './components/TodoItem.vue'

// ===== 基础数据 =====
const STORAGE_KEY = 'vue-todos'

// 读缓存->损坏兜底->默认数据
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (err) {
    console.error('本地存档损坏，使用默认数据', err)
  }
  return [
    { id: 1, value: '吃饭', isCompleted: true },
    { id: 2, value: '睡觉', isCompleted: false },
    { id: 3, value: '学习vue', isCompleted: false },
  ]
}

// 将值装进对象，方便vue拦截变化
const value = ref('')
const list = ref(load())

// id 计数器：从存档里取最大 id + 1，刷新后不会与已有数据冲突
let nextId = list.value.reduce((max, item) => Math.max(max, item.id), 0) + 1

// computed来定义【依赖别的响应式数据自动算出来的值】
// 自带缓存，依赖不变就不会重复计算，只读为主。
//  —— 统计（派生数据，自动重算，不要手动维护）=====
const totalCount = computed(() => list.value.length)
const activeCount = computed(() => list.value.filter(item => !item.isCompleted).length)


// ===== 筛选后展示的列表 =====
const filters = ['全部', '未完成', '已完成']
const activeFilter = ref('全部')
const visibleList = computed(() => {
  if (activeFilter.value === '未完成') return list.value.filter(item => !item.isCompleted)
  if (activeFilter.value === '已完成') return list.value.filter(item => item.isCompleted)
  return list.value
})


// 侦听器 watch 单个 ref —— 重复任务实时检测
const isDuplicate = ref(false)
watch(value, (text) => {
  const t = text.trim()
  // some() ≈ Java Stream 的 anyMatch
  isDuplicate.value = t !== '' && list.value.some(item => item.value === t)
})

// 侦听器 watch 深层监听 —— 持久化到 localStorage
// deep: true 让数组内部的变化（比如勾选 isCompleted）也能被侦听到
// 注意：watch 回调的参数是"解包后的值"（数组本身），不要再 .value
watch(list, (newValue) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue))
}, { deep: true })

function add() {
  const text = value.value.trim()
  if (!text) return
  // 拦截重复任务
  if (list.value.some(item => item.value === text)) return

  // 添加元素
  list.value.push({
    id: nextId++,
    value: text,
    isCompleted: false,
  })
  value.value = '' // v-model 双向绑定：清空数据，输入框跟着自动清空
}

function del(id) {
  // 按唯一 id 过滤，而不是按 index：删中间项时不会定位错行
  list.value = list.value.filter(item => item.id !== id)
}

// TodoItem 上报勾选操作（toggle(id, checked)）：按 id 找到对应任务，
// 由父组件修改数据——props 只读，子组件不能直接改
function toggle(id, checked) {
  const item = list.value.find(item => item.id === id)
  if (item) item.isCompleted = checked
}
</script>

<template>
  <div class="todo-app">
    <div class="title">Todo App</div>

    <!-- TodoForm：组件 v-model 同步输入文本，add 事件请求添加；
         输入框、按钮和重复提示都拆在子组件里，DOM 层级不变 -->
    <TodoForm v-model="value" :is-duplicate="isDuplicate" @add="add" />

    <!-- v-for ：遍历普通字符串数组渲染筛选按钮，:key 用唯一字符串，当做主键 -->
    <div class="filters">
      <button
        v-for="f in filters"
        :key="f"
        type="button"
        :class="{ filter: true, active: activeFilter === f }"
        @click="activeFilter = f"
      >{{ f }}</button>
    </div>

    <!-- v-if / v-else：两个分支只渲染一个。
         空状态判断的是 visibleList（筛选后可能为空，即使 list 本身不为空） -->
    <div v-if="visibleList.length === 0" class="empty">
      这里空空如也，先添加一条吧
    </div>

    <!-- template v-else：包裹分支但不产生真实 DOM 节点 -->
    <template v-else>
      <!-- 循环渲染待办列表；这次遍历的是 computed 筛选后的 visibleList -->
      <!-- 单条拆到 TodoItem：props 下行数据（id/value/isCompleted），toggle/delete 事件上行操作 -->
      <TodoItem
        v-for="item in visibleList"
        :key="item.id"
        :id="item.id"
        :value="item.value"
        :is-completed="item.isCompleted"
        @toggle="toggle"
        @delete="del"
      />
    </template>

    <!-- v-if 复合条件：有任务且全部完成时才显示 -->
    <p v-if="totalCount > 0 && activeCount === 0" class="done-all">全部完成！</p>

    <!-- 统计行：两个 computed，依赖变化时自动重算 -->
    <div class="stats">共 {{ totalCount }} 项，未完成 {{ activeCount }} 项</div>
  </div>
</template>

<style scoped>
.todo-app {
  box-sizing: border-box;
  max-width: 720px;
  margin: 0 auto;
  padding: 32px;
  background: #ffffff;
  border-radius: 12px;
}

.title {
  margin: 0 0 30px;
  text-align: center;
  font-size: 36px;
  font-weight: 700;
}

.filters {
  display: flex;
  gap: 8px;
  margin: 0 0 24px;
}

.filter {
  border: none;
  padding: 6px 14px;
  border-radius: 14px;
  background: #f1f2f4;
  color: #555;
  cursor: pointer;
  font: inherit;
  font-size: 14px;
}

.filter.active {
  background: linear-gradient(
    to right,
    rgb(113, 65, 168),
    rgba(44, 114, 251, 1)
  );
  color: #fff;
}

.empty {
  margin: 24px 0;
  color: #888;
  text-align: center;
}

.done-all {
  margin: 24px 0 0;
  color: #1a7f37;
  text-align: center;
  font-weight: 600;
}

.stats {
  margin-top: 24px;
  color: #888;
  font-size: 14px;
  text-align: center;
}
</style>
