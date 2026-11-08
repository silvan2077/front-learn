<script setup>
import { ref, computed, watch } from 'vue'

// ===== 基础数据 =====
const STORAGE_KEY = 'vue-todos'

// 首次进入用默认数据；之后每次刷新从 localStorage 恢复（配合下方 watch）
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

const value = ref('')
const list = ref(load())

// id 计数器：从存档里取最大 id + 1，刷新后不会与已有数据冲突
// reduce 的用法就是 js.md 第 2 节 reduce(0, Integer::sum) 的同款
let nextId = list.value.reduce((max, item) => Math.max(max, item.id), 0) + 1

// ===== 场景 1：computed —— 统计（派生数据，自动重算，不要手动维护）=====
const totalCount = computed(() => list.value.length)
const activeCount = computed(() => list.value.filter(item => !item.isCompleted).length)

// ===== 场景 2：computed + 筛选 =====
const filters = ['全部', '未完成', '已完成']
const activeFilter = ref('全部')
const visibleList = computed(() => {
  if (activeFilter.value === '未完成') return list.value.filter(item => !item.isCompleted)
  if (activeFilter.value === '已完成') return list.value.filter(item => item.isCompleted)
  return list.value
})

// ===== 场景 3：侦听器 watch 单个 ref —— 重复任务实时检测 =====
const isDuplicate = ref(false)
watch(value, (text) => {
  const t = text.trim()
  // some() ≈ Java Stream 的 anyMatch（js.md 第 2 节）
  isDuplicate.value = t !== '' && list.value.some(item => item.value === t)
})

// ===== 场景 4：侦听器 watch 深层监听 —— 持久化到 localStorage =====
// deep: true 让数组内部的变化（比如勾选 isCompleted）也能被侦听到
watch(list, (newValue) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue.value))
}, { deep: true })

function add() {
  const text = value.value.trim()
  if (!text) return

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
</script>

<template>
  <div class="todo-app">
    <div class="title">Todo App</div>

    <div class="todo-form">
      <!-- 双向绑定：输入框的值会自动同步到 value 变量，反之亦然 -->
      <input
        v-model="value"
        type="text"
        class="todo-input"
        placeholder="Add a todo"
        @keyup.enter="add"
      />
      <button type="button" class="todo-button" @click="add">Add Todo</button>
    </div>

    <!-- v-show：元素始终渲染，只切换 display。
         适合像这样"每次按键都可能开关"的高频提示 -->
    <p v-show="isDuplicate" class="warn">该任务已存在，换一个吧</p>

    <!-- v-for 新场景：遍历普通字符串数组渲染筛选按钮，:key 用唯一字符串 -->
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
      <!-- 动态class：根据 item.isCompleted 切换 completed 类名 -->
      <div
        v-for="item in visibleList"
        :key="item.id"
        :class="{ item: true, completed: item.isCompleted }"
      >
        <div>
          <input v-model="item.isCompleted" type="checkbox" />
          <span class="name">{{ item.value }}</span>
        </div>

        <button type="button" class="del" @click="del(item.id)">del</button>
      </div>
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

.todo-form {
  display: flex;
  margin: 0 0 16px;
}

.todo-button {
  flex-shrink: 0;
  padding: 14px 24px;
  border: none; /* button 自带默认边框，div 没有，转成 button 后要补 */
  border-radius: 0 20px 20px 0;
  background: linear-gradient(
    to right,
    rgb(113, 65, 168),
    rgba(44, 114, 251, 1)
  );
  color: #fff;
  cursor: pointer;
  font: inherit;
  user-select: none;
}

.todo-input {
  flex: 1;
  /* 允许窄屏下收缩（同 js 版的 min-width: 0） */
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid #aaa;
  border-radius: 20px 0 0 20px;
  background: #fff;
}

.warn {
  margin: 0 0 16px;
  color: #b42323;
  font-size: 14px;
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

.item {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 80%;
  height: 50px;
  margin: 8px auto;
  padding: 16px;
  border-radius: 20px;
  box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 20px;
}

.del {
  border: none; /* 同上：button 重置 */
  background: transparent;
  padding: 4px 8px;
  color: red;
  cursor: pointer;
  font: inherit;
}

.item.completed {
  text-decoration: line-through;
  opacity: 0.4;
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
