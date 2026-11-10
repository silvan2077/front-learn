 <script setup>
// 显式声明契约：props 只读下行（id / value / isCompleted），操作经 emit 上行（toggle / delete）
defineProps({
  id: { type: Number, required: true },
  value: { type: String, required: true },
  isCompleted: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle', 'delete'])
</script>

<template>
  <!-- 动态class：根据 isCompleted 切换 completed 类名 -->
  <div :class="{ item: true, completed: isCompleted }">
    <div>
      <!-- props 只读：不再用 v-model 直接改 item.isCompleted，
           :checked 只负责展示，变化时把 id 和勾选布尔值上报给父组件 -->
      <input
        :checked="isCompleted"
        type="checkbox"
        @change="emit('toggle', id, $event.target.checked)"
      />
      <span class="name">{{ value }}</span>
    </div>

    <button type="button" class="del" @click="emit('delete', id)">del</button>
  </div>
</template>

<style scoped>
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
</style>
