<script setup>
import { computed } from 'vue'

// 显式声明契约：文本走组件 v-model（modelValue / update:modelValue），添加请求走 add 事件
const props = defineProps({
  modelValue: { type: String, default: '' },
  isDuplicate: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'add'])

// 可写 computed：get 读父组件传入的 modelValue，set 用 update:modelValue 上抛
// 输入框因此仍能用 v-model；父组件清空 value 后，这里也会跟着自动清空
const value = computed({
  get: () => props.modelValue,
  set: (text) => emit('update:modelValue', text),
})
</script>

<template>
  <div class="todo-form">
    <!-- 双向绑定：输入框的值会自动同步到 value 变量，反之亦然 -->
    <input
      v-model="value"
      type="text"
      class="todo-input"
      placeholder="Add a todo"
      @keyup.enter="emit('add')"
    />
    <button type="button" class="todo-button" @click="emit('add')">Add Todo</button>
  </div>

  <!-- v-show：元素始终渲染，只切换 display。
       适合像这样“每次按键都可能开关”的高频提示 -->
  <p v-show="isDuplicate" class="warn">该任务已存在，换一个吧</p>
</template>

<style scoped>
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
</style>
