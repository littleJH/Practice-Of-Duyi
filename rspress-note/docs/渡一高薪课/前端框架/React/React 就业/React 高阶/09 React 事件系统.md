# React 事件系统

>面试题：简述一下 React 中的事件是如何处理的？

参考答案：

React 有自己的一套事件系统。如果是 Fiber 这一数据结构是用来描述 UI 的，那么 React 事件系统则是基于 Fiber 来描述与 UI 之间的交互。

对于 ReactDOM 宿主环境来说，事件系统由两部分组成：**合成事件对象** 和 **模拟事件传播机制**。

1. 合成事件对象 SyntheticEvent

   合成事件对象是对浏览器原生事件的一层封装，兼容主流浏览器，同时拥有与浏览器原生事件相同的 API，例如 `stopPropagation`、`preventDefault` 等。合成事件存在的根本目的是消除不同浏览器之间的差异。

2. 模拟事件传播机制

   基于事件委托机制，React 利用 FiberTree 实现了事件的 **捕获**、**目标**、**冒泡** 流程，并在这套流程中加入了一些特性：

   - 为事件设置了优先级
   - 事件名的定制，例如使用驼峰命名法
   - 事件行为的定制，例如原生事件 `oninput` 对应模拟事件 `onChange`



> 一系列问题：
>
> 1. React 为什么有自己的事件系统？ 
> 2. 什么是事件合成 ？ 
> 3. 如何实现的批量更新？
> 4. 事件系统如何模拟冒泡和捕获阶段？
> 5. 如何通过 dom 元素找到与之匹配的fiber？
> 6. 为什么不能用 return false 来阻止事件的默认行为？
> 7. 事件是绑定在真实的dom上吗？如何不是绑定在哪里？
> 8. V17 对事件系统有哪些改变？



## 合成事件对象 SyntheticEvent

在 SyntheticEvent 中有很多属性和方法，下面是对 `stopPropagation` 的实现

```js

function SyntheticEvent () {}

SyntheticEvent.prototype.stopPropagation = function () {
    var event = this.nativeEvent;

      if (!event) {
        return;
      }

      if (event.stopPropagation) {
        event.stopPropagation(); // $FlowFixMe - flow is not aware of `unknown` in IE
      } else if (typeof event.cancelBubble !== 'unknown') {
        // The ChangeEventPlugin registers a "propertychange" event for
        // IE. This event does not support bubbling or cancelling, and
        // any references to cancelBubble throw "Member not found".  A
        // typeof check of "unknown" circumvents this issue (and is also
        // IE specific).
        event.cancelBubble = true;
      }

      this.isPropagationStopped = functionThatReturnsTrue;
}

```



## 模拟事件传播机制

对于可以冒泡的事件，整个事件传播机制的实现步骤如下：

- 在根元素绑定对应的事件，所有子元素触发事件会根据事件委托机制触发回调
- 寻找触发事件的 DOM，找到对应的 FiberNode，收集所有从该 FiberNode 到 HostRootFiber 之间注册的该事件的回调，保存到一个数组中
- 模拟捕获阶段：反向遍历这个数组执行所有回调
- 模拟冒泡阶段：正向遍历这个数组执行所有回调



**在根元素绑定对应的事件**

```js 
export const addEvent = (container, type) => {
    container.addEventListener(type, (e) => {
        // 进行事件的派发
        dispatchEvent(e, type.toUpperCase())
    })
} 

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(jsx);
// 进行根元素的事件绑定，换句话说，就是使用我们自己的事件系统
addEvent(document.getElementById("root"), "click");
```



**事件的派发**

```js title="dispatchEvent"
/**
 *
 * @param {*} e 原生的事件对象
 * @param {*} type 事件类型，已经全部转为了大写，比如这里传递过来的是 CLICK
 */
const dispatchEvent = (e, type) => {
  // 实例化一个合成事件对象
  const se = new SyntheticEvent(e);
  // 拿到触发事件的元素
  const ele = e.target;
  let fiber;
  // 通过 DOM 元素找到对应的 FiberNode
  for (let prop in ele) {
    if (prop.toLocaleLowerCase().includes("fiber")) {
      fiber = ele[prop];
    }
  }
  // 找到对应的 fiberNode 之后，接下来我们需要收集路径中该事件类型所对应的所有的回调函数
  const paths = collectPaths(type, fiber);
  // 模拟捕获的实现
  triggerEventFlow(paths, type + "CAPTURE", se);
  // 模拟冒泡的实现
  // 首先需要判断是否阻止了冒泡，如果没有，那么我们只需要将 paths 进行反向再遍历执行一次即可
  if(!se._stopPropagation){
    triggerEventFlow(paths.reverse(), type, se);
  }
};
```



**收集路径中所有 type 类型的事件回调函数**

```js title="collectPaths"
/**
 * 该方法用于收集路径中所有 type 类型的事件回调函数
 * @param {*} type 事件类型
 * @param {*} begin FiberNode
 * @returns
 * [{
 *  CLICK : function(){...}
 * },{
 *  CLICK : function(){...}
 * }]
 */
const collectPaths = (type, begin) => {
  const paths = []; // 存放收集到所有的事件回调函数
  // 如果不是 HostRootFiber，就一直往上遍历
  while (begin.tag !== 3) {
    const { memoizedProps, tag } = begin;
    // 如果 tag 对应的值为 5，说明是 DOM 元素对应的 FiberNode
    if (tag === 5) {
      const eventName = "bind" + type; // bindCLICK
      // 接下来我们来看当前的节点是否有绑定事件
      if (memoizedProps && Object.keys(memoizedProps).includes(eventName)) {
        // 如果进入该 if，说明当前这个节点绑定了对应类型的事件
        // 需要进行收集，收集到 paths 数组里面
        const pathNode = {};
        pathNode[type] = memoizedProps[eventName];
        paths.push(pathNode);
      }
      begin = begin.return;
    }
  }
  return paths;
};
```



**模拟捕获阶段，反向遍历**

```js
/**
 *
 * @param {*} paths 收集到的事件回调函数的数组
 * @param {*} type 事件类型
 * @param {*} se 合成事件对象
 */
const triggerEventFlow = (paths, type, se) => {
  // 挨着挨着遍历这个数组，执行回调函数即可
  // 模拟捕获阶段的实现，所以需要从后往前遍历数组并执行回调
  for (let i = paths.length; i--; ) {
    const pathNode = paths[i];
    const callback = pathNode[type];
    if (callback) {
      // 存在回调函数，执行该回调
      callback.call(null, se);
    }
    if (se._stopPropagation) {
      // 说明在当前的事件回调函数中，开发者阻止继续往上冒泡
      break;
    }
  }
};
```




**模拟冒泡阶段，正向遍历**
```js
// 模拟冒泡的实现
// 首先需要判断是否阻止了冒泡，如果没有，那么我们只需要将 paths 进行反向再遍历执行一次即可
if(!se._stopPropagation){
  triggerEventFlow(paths.reverse(), type, se);
}
```
