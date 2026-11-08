# HTML 与 CSS 学习笔记

- HTML 为骨架，用来组织标题、输入区域和待办列表。
- CSS 设置背景、字体、间距、布局和交互状态。

HTML 负责内容与语义，CSS 负责呈现；后续 JavaScript 将负责添加任务等业务交互。

## 1. HTML：结构与语义

### 1.1 文档骨架

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>待办清单</title>
</head>
<body>
  <!-- 页面可见内容 -->
</body>
</html>
```

| 写法 | 作用 |
| --- | --- |
| `<!DOCTYPE html>` | 声明 HTML 文档类型，使浏览器使用标准模式 |
| `lang="zh-CN"` | 声明页面主要语言，帮助辅助技术等理解内容 |
| `charset="UTF-8"` | 明确文档字符编码，文件本身也应保存为 UTF-8 |
| `viewport` | 让移动端布局视口匹配设备宽度，初始缩放比例为 1 |

`viewport` 不会自动让所有布局适配手机，还要配合可收缩布局和媒体查询。

### 1.2 根据用途选择标签

* `main`：页面主要内容，每页最多一个
* `section`：有标题的内容分区，用`aria-label`提供名称
* `input`：text为文本框，checkbox为复选框
* `ul`+`li`：组成无序列表
* `div`：块级元素，没有专门语义的容器
* `span`：行内元素，和其他行内元素排在同一行

### 1.3 label 的两种关联方式

显式关联：

```html
<label for="todo-input">待办内容</label>
<input id="todo-input" type="text">
```

`for` 对应控件的 `id`。点击标签会让文本框获得焦点，不是选中其中全部文字。页面内的 `id` 应唯一。

包裹控件：

```html
<label class="item-left">
  <input class="todo-checkbox" type="checkbox">
  <span class="name">学习 HTML 和 CSS</span>
</label>
```

点击任务文字也能切换复选框。当前删除按钮放在 `label` 外，避免把两种操作混在标签内。

### 1.4 常见属性

- `class`：可重复使用；CSS 用 `.todo-input` 选择对应元素。
- `id`：标识`特定`元素；可用于标签关联、片段定位等。
- `placeholder`：输入示例。
- `type="button"`：普通按钮，不自动提交表单。
- `checked`：布尔属性，表示初始选中；写成 `checked="false"` 仍表示有该属性。

当前添加区域不是 `form`，点击添加也没有行为。后续实现提交时，再结合 `form`、提交按钮和事件处理设计。

## 2. CSS 规则与选择器

```css
.title {
  text-align: center;
  font-size: 36px;
}
```

`.title` 是选择器，花括号内是声明；每条声明由属性和值组成。

| 页面中的写法 | 含义 |
| --- | --- |
| `body` | 元素选择器 |
| `.todo-app` | 类选择器 |
| `input, button` | 选择器列表，两类元素都应用规则 |
| `*` | 通配选择器,主要作为全局都要 |
| `*::before`、`*::after` | 选择伪元素；当前规则不会自动创建它们 |
| `.todo-button:hover` | 鼠标悬停状态 |
| `input:focus-visible` | 浏览器判断需要显示焦点提示的状态，常见于键盘操作 |
| `.todo-checkbox:checked + .name` | 选中复选框后紧邻的同级 `.name` 元素 |

伪类描述状态，例如 `:checked`；伪元素选择元素的特定部分或生成内容，例如 `::before`。

### 2.1 完成状态的纯 CSS 实现

```css
.todo-checkbox:checked + .name {
  color: #777;
  text-decoration: line-through;
}
```

执行关系是：用户勾选 → 浏览器更新控件状态 → 选择器匹配 → 任务文字改变样式。

`+` 要求两个元素具有相同父元素，而且 `.name` 必须是复选框后紧邻的元素；中间的空白、换行和注释不影响匹配。调整 HTML 嵌套结构后，这条规则可能不再匹配。

## 3. 盒模型、间距与居中

元素的盒模型包含：内容、`padding`（内边距）、`border`（边框）、`margin`（外边距）。

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

全局重置盒边距，`border-box` 让设置的宽高包含内边距和边框，不包含外边距。例如宽度 200px、左右内边距各 16px、边框各 1px，内容宽度为 166px。

### 3.1 简写顺序

- `padding: 32px`：四边都是 32px。
- `padding: 40px 20px`：上下 40px，左右 20px。
- `margin: 0 0 30px`：上 0，左右 0，下 30px。
- 四个值的顺序：上、右、下、左。
- `border-radius: 24px 0 0 24px`：左上、右上、右下、左下。

### 3.2 内容容器水平居中

```css
.todo-app {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px;
}
```

普通块级容器在可用空间内伸展，最大宽度限制为 720px。空间有剩余时，左右自动外边距平分剩余空间，实现水平居中。

`text-align: center` 主要控制容器内的行内内容对齐，不等于把这个容器自身居中。

`body` 的 `min-height: 100vh` 表示最小高度为视口高度，内容更多时仍能继续增长；它不表示垂直居中。

## 4. Flex：输入区域与任务行

```css
.input-group {
  display: flex;
}

.todo-input {
  flex: 1;
  min-width: 0;
}

.todo-button {
  flex-shrink: 0;
}
```

- Flex 布局作用于容器的直接子元素。
- 默认主轴横向排列，因此输入框和按钮在一行。
- `flex: 1` 允许输入框伸展并参与收缩；可理解为占用按钮之外的可用空间。
- `min-width: 0` 允许子项突破默认最小尺寸限制继续收缩，降低窄屏溢出的风险。
- `flex-shrink: 0` 阻止按钮按 Flex 收缩比例被压缩，但不保证极端窄屏永不溢出。

任务行也使用 Flex：左侧标签 `flex: 1`，右侧删除按钮不收缩，所以左侧占据剩余空间。

## 5. Grid：待办列表间距

```css
.todo-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
```

没有声明多列，列表项则按默认网格放置形成单列，`gap` 统一控制行间距。

Flex 更常用于一个方向的排列，Grid 更适合同时控制行列；此处两者都可以

`ul` 默认带列表标记和间距，这里设置`list-style:none`将其清除。

## 8. 字体、颜色与视觉效果

| 写法 | 含义 |
| --- | --- |
| `font-family: system-ui, sans-serif` | 优先使用系统界面字体，再使用无衬线字体 |
| `line-height: 1.5` | 无单位行高，按元素自身字号计算 |
| `font: inherit` | 让输入框、按钮继承父元素的字体相关设置 |
| `font-weight: 600` | 字重，实际呈现还取决于字体支持 |
| `linear-gradient(...)` | 渐变背景 |
| `border-radius` | 圆角 |
| `background: transparent` | 背景透明，下面的内容仍可透出 |
| `accent-color` | 调整受支持原生控件的强调色 |
| `overflow-wrap: anywhere` | 必要时允许长字符序列在任意位置换行 |

### 阴影

```css
box-shadow: 0 2px 8px #00000018;
```

依次为水平偏移 0、垂直偏移 2px、模糊半径 8px、阴影颜色。八位十六进制颜色最后两位 `18` 为透明度通道，约为 9.4% 不透明度；这里不是十进制的 18%。

### 悬停效果

```css
.todo-button:hover {
  filter: brightness(1.1);
}
```

鼠标悬停时提高亮度，比更换背景色更平滑

## 9. 键盘操作和焦点

```css
input:focus-visible,
button:focus-visible {
  outline: 3px solid #3453c7;
  outline-offset: 3px;
}
```

- `outline` 给焦点元素绘制轮廓，不占据正常布局空间。
- `outline-offset` 让轮廓与元素边缘保持距离。
- `:focus-visible` 为键盘操作时显示焦点圈，`:focus`为键盘和鼠标操作都触发

不要简单地用 `outline: none` 移除焦点提示。使用原生按钮和复选框，可以复用浏览器的键盘支持。

## 10. 响应式与层叠

```css
@media (max-width: 480px) {
  .todo-app {
    padding: 24px 16px;
  }

  .title {
    font-size: 28px;
  }
}
```

当视口宽度不超过 480 CSS 像素时，媒体查询中的规则参与样式计算。这里的 480px 是练习选择的断点，不是所有手机的固定宽度。
