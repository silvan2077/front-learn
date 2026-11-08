# JavaScript 学习笔记

## 1. 语言基础

### 1.1 变量声明：const 优先

```js
const name = '学习 CSS';   // 绑定后不可重新赋值
let count = 3;             // 需要重新赋值时才用 let
// var 不再使用：函数作用域 + 变量提升，规则老旧；let/const 是块级作用域
```

声明变量时不需要指定类型，**变量没有类型，值才有类型**（动态类型）

### 1.2 类型种类

| JS 类型 | 说明 | Java |
|---|---|---|
| `number` | 统一的浮点类型（float64），没有 int/long | `0.1 + 0.2 !== 0.3`；超过 2^53 的整数丢精度，金额计算要小心 |
| `string` | 不可变；模板字符串用反引号 | 拼接规则比 Java 宽松（`'a' + 1` 合法） |
| `boolean` | — | — |
| `null` | "有意为空"，需显式赋值 | null |
| `undefined` | "没有值"：变量未初始化、函数无返回值、对象上不存在的属性 | Java 没有对应物 |
| `object` / `Array` / `function` | 数组、函数都是对象 | 数组 ≈ `ArrayList`，但没有泛型 |

### 1.3 相等判断：永远用 `===`

`==` 会做隐式类型转换（`'1' == 1` 为 true），是著名的坑。**`===` 同时比较类型和值，才符合直觉**。注意对象例外：`===` 对对象比较的是引用——这点和 Java 的 `==` 一样，且 JS 没有内置 `equals()`，内容比较需逐键或 `JSON.stringify` 后比较。

同理，`if (x)` 会做真值转换：`0`、`''`、`null`、`undefined`、`NaN` 都算"假"。

### 1.4 高频语法

```js
// 模板字符串（≈ String.format，但可读性更好）
const msg = `待办 ${name}，共 ${count} 条`;

// 解构：从对象/数组按名按位取值（≈ Java 17 record 的解构体验）
const { title } = { title: '待办清单' };
const [first, second] = ['吃饭', '睡觉'];

// 展开运算符：复制/合并，生成新数组，不改原数组
const next = [...todos, newTodo];
```

## 2. 数组与对象

数组方法和 Java Stream 语义几乎一一对应，但**直接在数组上调用、立即执行、返回新数组**：

```js
const todos = [
  { id: 1, text: '吃饭', done: true },
  { id: 2, text: '睡觉', done: false },
];

todos.filter(t => !t.done)             // ≈ stream().filter(...)
     .map(t => t.text)                 // ≈ stream().map(...)
     .join('、');                       // ≈ Collectors.joining

todos.find(t => t.id === 1);           // ≈ findFirst()，返回元素或 undefined
todos.some(t => t.done);               // ≈ anyMatch
todos.every(t => t.done);              // ≈ allMatch
todos.reduce((sum, t) => sum + (t.done ? 1 : 0), 0);  // ≈ reduce(0, Integer::sum)
```

修改式操作是另一组：`push`（尾部追加 ≈ add）、`splice(i, 1)`（删除指定位置）、`findIndex` / `indexOf`。

对象字面量 ≈ Map 与 record 的混用体：

```js
const todo = { id: 3, text: '学习 JS', done: false };  // 键不用引号
todo.text;            // 点访问
todo[key];            // 键是变量时用方括号
'text' in todo;       // 键是否存在（≈ containsKey）
Object.keys(todo);    // ≈ keySet
```

## 3. 函数、箭头函数与 this

### 3.1 函数是一等公民

函数可赋值、可传参、可返回——比 Java 的 lambda 更彻底（没有"函数式接口"这层中间物）：

```js
function add(a, b) { return a + b; }            // 声明式（有提升）
const add = function (a, b) { return a + b; };  // 函数表达式
const add = (a, b) => a + b;                    // 箭头函数（最常用）
```

箭头函数细节：单参数可省括号（`t => t.text`）；函数体只有一行可省 `return`，写成 `{}` 时必须显式 `return`。

### 3.2 this：JS 与 Java 分歧最大的概念

- **Java**：`this` 永远指向当前实例，编译期确定。
- **JS 普通函数**：`this` 由**调用方式**在运行时决定（`obj.fn()` 里是 obj；裸调用是 undefined/window）。
- **JS 箭头函数**：不绑定自己的 this，直接用外层作用域的 this。

实践习惯：**事件回调、定时器回调一律用箭头函数**，能避开绝大多数 this 坑。

## 4. DOM 与事件

### 4.1 选取元素

```js
document.querySelector('.todo-input');       // CSS 选择器，第一个匹配
document.querySelectorAll('.delete-button'); // 所有匹配（NodeList，可用 forEach）
document.getElementById('todo-input');       // 专用方法：只按 id 查找，返回该元素或 null
```

querySelector 的参数就是一个 CSS 选择器字符串

实际用法：页面加载时**一次性取好**，后面所有操作复用这三个引用，而不是每次操作都重新查找：

```js
const input = document.querySelector('.todo-input');
const addButton = document.querySelector('.todo-button');
const list = document.querySelector('.todo-list');
```

### 4.2 读改元素

```js
const input = document.querySelector('.todo-input');
input.value;               // 表单控件用 value 读输入（不是 textContent！）
input.value = '';          // 清空输入框
item.classList.add('done');   // class 操作：add / remove / toggle / contains
item.remove();                // 删除节点
span.textContent;             // 纯文本内容（.name 里的任务文字）
```

安全提示：用户输入永远不要塞进 `innerHTML`（XSS 注入面），这会认为用户输入的是代码，类似于SQL注入；纯文本一律用 `textContent`。

### 4.3 创建元素

```js
const li = document.createElement('li');  // 创建，此时还不在页面上
li.className = 'item';                    // 设置 class
document.querySelector('.todo-list').append(li);  // 挂到页面，此刻才可见
```

要点：**创建顺序与 DOM 嵌套顺序一致**；节点在 append 到页面之前不可见，挂上那一刻才渲染。

```js
// 02-js-todo/todo.js（节选）：li.item > label.item-left > (checkbox + span.name) + button
const checkbox = document.createElement('input');
checkbox.className = 'todo-checkbox';
checkbox.type = 'checkbox';

const name = document.createElement('span');
name.textContent = text;          // 用户输入一律 textContent，不用 innerHTML

label.append(checkbox, name);     // append 可一次挂多个子节点
li.append(label, deleteButton);
```

### 4.4 事件监听

```js
document.querySelector('.todo-button').addEventListener('click', () => {
  // 每次点击执行；箭头函数避免 this 指向按钮本身
});
```

实际用法（02-js-todo/todo.js L54-62）：两个入口复用同一个 `addTodo`：

```js
addButton.addEventListener('click', addTodo);   // 注意：传函数名，不加括号
input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    addTodo();
  }
});
```

**高频错误**：写成 `addEventListener('click', addTodo())` ——加括号是"立刻执行一次，把返回值 undefined 注册为回调"，点击时什么都不会发生。传函数名 ≈ Java 里传 `this::addTodo` 方法引用，而不是调用结果。

### 4.5 事件委托

问题：删除按钮是动态创建的，逐个 `addEventListener` 意味着每加一条绑一次、删节点还得解绑。

方案：事件会从子元素**冒泡**到祖先。只在父容器 `.todo-list` 上绑一次，用 `e.target` 判断实际点击的是谁：

```js
list.addEventListener('click', (e) => {
  const btn = e.target.closest('.delete-button');  // 从点击处向上找最近匹配
  if (!btn) return;                                // 点的不是删除按钮
  const item = btn.closest('.item');  // 第二层：再从按钮向上找所在条目
  item.remove();
});
```

### 4.6 script 标签与执行时机

浏览器按文档顺序执行 JS。script 放在 `<head>` 里直接查 DOM，元素还不存在（querySelector 返回 null）。标准解法：

```html
<script src="todo.js" defer></script>   <!-- 推荐：下载不阻塞解析，DOM 就绪后才执行 -->
```

或把 `<script>` 放在 `</body>` 前。

### 4.7 输入校验与录入体验

```js
const text = input.value.trim();   // trim 去掉首尾空白：纯空格也不算有效输入
if (text === '') {
  input.focus();                   // 空输入：不添加，焦点留在输入框
  return;                          // 提前返回，后面的创建逻辑不再执行
}

input.value = '';   // 添加成功后清空输入框并保持焦点，方便连续录入
input.focus();
```

## 5. 异步与事件循环：和线程模型说再见

### 5.1 单线程 + 事件循环

JS 是**单线程**：同一时刻只执行一段代码，没有锁、没有并发修改——消除了 Java 的一整类问题，也带来铁律：**任何长时间阻塞都会冻结整个页面**

耗时操作（网络、定时器）由浏览器其他线程完成，完成后把回调放进队列，等主线程空闲时执行——这就是**事件循环**：

```js
console.log('1');
setTimeout(() => console.log('3'), 0);   // 即使 0ms，也要等当前代码全部跑完
console.log('2');
// 输出：1、2、3
```

队列还分两层：Promise 回调是**微任务**（当前代码一结束就执行），setTimeout 是**宏任务**（下一轮循环）：

```js
setTimeout(() => console.log('宏任务'));
Promise.resolve().then(() => console.log('微任务'));
// 顺序：微任务 → 宏任务。面试高频题，也是理解流式响应更新时机的基础
```

### 5.2 Promise ≈ CompletableFuture

| JS | Java 对照 |
|---|---|
| `new Promise((resolve, reject) => ...)` | 手动创建异步任务 |
| `p.then(onOk, onErr)` / `p.catch(...)` | `whenComplete` / `exceptionally` |
| `Promise.all([a, b])` | `allOf` |
| `await p` | 把 thenCompose 链写成顺序代码 |

`async/await` 是 Promise 的语法糖，让异步看起来像同步的 Java 顺序代码：

```js
async function loadTodos() {
  try {
    const resp = await fetch('/api/todos');  // 发出请求，在此"暂停"，但不阻塞线程
    if (!resp.ok) {                          // 必须手动检查！
      throw new Error(`HTTP ${resp.status}`);
    }
    return await resp.json();                // 读 body 并解析 JSON
  } catch (err) {
    console.error('加载失败', err);           // 只有网络层错误才走这里
  }
}
```

**最大的坑**：Java HttpClient 收到 500 会抛异常，而 **fetch 只有网络层失败才 reject，HTTP 4xx/5xx 照常 resolve**——必须检查 `resp.ok` / `resp.status`。
