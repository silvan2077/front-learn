// 待办清单交互脚本

// ===== 1. 获取页面元素 =====
// script 标签加了 defer，执行到这里时 DOM 已经解析完成，可以安全查找
const input = document.querySelector('.todo-input');
const addButton = document.querySelector('.todo-button');
const list = document.querySelector('.todo-list');

// ===== 2. 添加待办 =====
// 点击按钮或回车键都可以添加
function addTodo() {
  // trim() 去掉首尾空白，纯空格输入也不算有效内容
  const text = input.value.trim();
  if (text === '') {
    // 空输入：不添加，让输入框保持焦点等待重新输入
    input.focus();
    return;
  }

  // 按静态页的 li 结构创建节点：
  // li.item > label.item-left > (input.todo-checkbox + span.name) + button.delete-button
  const li = document.createElement('li');
  li.className = 'item';

  const label = document.createElement('label');
  label.className = 'item-left';

  const checkbox = document.createElement('input');
  checkbox.className = 'todo-checkbox';
  checkbox.type = 'checkbox';

  const name = document.createElement('span');
  name.className = 'name';
  // textContent 只当纯文本处理，用户输入是安全的；
  name.textContent = text;
  
  label.append(checkbox, name);

  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-button';
  // 习惯：显式写 type，防止以后放进 form 时默认变成提交按钮
  deleteButton.type = 'button';
  deleteButton.textContent = '删除';

  li.append(label, deleteButton);
  // 挂到页面这一刻才真正可见
  list.append(li);

  // 清空输入框并保持焦点，方便连续录入
  input.value = '';
  input.focus();
}

// 点击"添加"按钮
addButton.addEventListener('click', addTodo);

// 输入框内按回车也能添加：keydown 事件里检查具体按键
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addTodo();
  }
});

// ===== 3. 删除待办：事件委托 =====
// 删除按钮是动态创建的，逐个绑定意味着每加一条绑一次；
// 改为在父容器上只绑一次，靠事件冒泡 + e.target 找到实际点击的位置
list.addEventListener('click', (event) => {
  // closest 从点击处向上找最近的匹配祖先（含自身），
  // 点在勾选框或文字上时找不到删除按钮，直接退出
  const deleteButton = event.target.closest('.delete-button');
  if (!deleteButton) {
    return;
  }

  // 再从删除按钮向上找到它所在的条目并移除
  const item = deleteButton.closest('.item');
  item.remove();
});
