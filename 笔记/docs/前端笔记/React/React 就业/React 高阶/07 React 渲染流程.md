# React 渲染流程

---



> 面试题：
>
> 1. 是否了解过 React 的整体渲染流程？里面主要有哪些阶段？
> 2. React 中哪些地方用到了位运算？
>
> 3. beginWork 中主要做一些什么工作？整体的流程是怎样的？
>
> 4. completeWork 中主要做一些什么工作？整体的流程是怎样的？
> 5. 说一说 React 中的 updateQueue





React 的渲染流程分为两大阶段和三大模块

![2023-02-23-101849](http://jiahe-picbed.oss-cn-shenzhen.aliyuncs.com/typora-image/2023-02-23-101849.png)	

**两大阶段**

- render：使用 **调度器和调和器** 计算出最重要渲染的虚拟 DOM
- commit：根据计算出的虚拟 DOM，在对应的 **宿主环境** 渲染具体的 UI

**三大模块**

- 调度器 scheduler：调度任务，为任务赋予优先级和过期时间，在浏览器空闲时根据优先级执行，从而解决更新任务阻塞浏览器渲染造成的卡顿问题
- 调和器 reconciler：
- 渲染器 renderer：



## 一、render 阶段



### Scheduler 调度器

<u> 调度器的根本目的就是在浏览器的空闲时间执行更新任务，防止阻塞渲染 </u>

浏览器本身就有在空闲时间执行任务的 *requestIdleCallback*，以及在每一帧渲染之前执行指定任务的 *requestAnimationFrame*，还有能够执行宏任务并让出主线程的 *setTimeout*。这些 api 都能够做到在空闲时间执行任务，但是 Scheduler 最终选择自己模拟一个 *requestIdleCallback*，而不是用现成的 api，原因有下：

1. requestAnimationFrame

   浏览器每一帧要执行的任务顺序：事件处理、执行 JS 代码、执行 *requestAnimationFrame*，样式计算 Style，布局 Layout，绘制 Paint 。*requestAnimationFrame* 既不会阻塞浏览器渲染，并且与浏览器重新渲染的频率一致。既然如此，为什么不用？

   因为 *requestAnimationFrame* 只能在重新渲染之前执行一次，并且如果任务过于复杂，还是会阻塞后去的渲染。

   再者，不同浏览器执行 *requestAnimationFrame* 的时机是不同的，例如 safari 和 edge 浏览器是将 requestAnimationFrame 放到渲染之后执行的，chrome 和 firefox 是将 requestAnimationFrame 放到渲染之前执行的

2. setTimeout

   这个的问题就简单了，因为如果 setTimeout 嵌套超过 5 层，即使设置延时为 0，实际上延时也被设置为 4ms，这对于每一帧 16.66ms 来说是过于浪费了

3. requestIdleCallback

   使用 requestIdleCallback 能够将复杂任务拆分成多个简单任务，它提供了 `IdleDeadline` 对象，让你可以检查当前帧的剩余空闲时间以便在浏览器空闲时间执行，本身是非常契合要求的，但可惜的是只有 Chrome 支持

   

#### 模拟 *requestIdleCallback*

要模拟 requestIdleCallback，需要具备两个功能：

1. 能够暂停执行，主动让出主线程
2. 主线程空闲时能够恢复任务的执行

能够满足条件的就只有事件循环中的 **宏任务**，将没有执行完的任务放入任务队列，等待下一次事件循环再执行

而 Schedule 选择产生宏任务的方式是 *MessageChannel*，原因上面分析过了



*MessageChannel* 接口允许我们创建一个新的消息通道，并通过它的两个 [`MessagePort`](https://developer.mozilla.org/zh-CN/docs/Web/API/MessagePort) 属性发送数据。

下面看看 *MessageChannel* 是怎么产生宏任务的

```js
const channel = new MessageChannel()

channel.port1.onmessage = (event) => {
    // 这里要执行的任务就可以放到宏任务队列中执行
}
channel.port2.postMessage('111')
```





#### 异步调度原理

> 源码入口：packages\scheduler\src\forks\Scheduler.js

##### unstable_scheduleCallback

这个函数的作用：

1. 创建任务

2. 根据任务的 **延迟时间** 和 **优先级** 设置任务的开始时间和过期时间，并将其添加到不同的队列中

   - 设置了延迟时间的任务，就是延时任务，添加到 `timerQueue` 队列中
   - 没有设置延迟时间的任务，就是普通任务，添加到 `taskQueue` 队列中

   注意，`switch (priorityLevel)` 根据优先级设置 *expirationTime* 过期时间时，当 `priorityLevel === ImmediatePriority` 时，此时过期时间比当前时间还小，表明要立即执行

   ![2022-12-29-065931](http://jiahe-picbed.oss-cn-shenzhen.aliyuncs.com/typora-image/2022-12-29-065931.png)	

3. 执行任务

   - 延时任务：在定时器的回调中执行 `requestHostTimeout(handleTimeout, startTime - currentTime)`
   - 普通任务：立即执行 `requestHostCallback()`

```js
let getCurrentTime: () => number | DOMHighResTimeStamp;	// 获取高精度时间

export const NoPriority = 0;
export const ImmediatePriority = 1;
export const UserBlockingPriority = 2;
export const NormalPriority = 3;
export const LowPriority = 4;
export const IdlePriority = 5;

// Timeout 对应的值
export const userBlockingPriorityTimeout = 250;
export const normalPriorityTimeout = 5000;
export const lowPriorityTimeout = 10000;

var taskQueue = []; // 存放普通任务
var timerQueue = []; // 存放延时任务

function unstable_scheduleCallback(
  priorityLevel: PriorityLevel,	// 任务优先级
  callback: Callback,	// 要执行的回调
  options?: {delay: number},	// 延迟执行的时间
): Task {
  var currentTime = getCurrentTime(); // 获取当前时间

  var startTime;	// 任务开始时间
  if (typeof options === 'object' && options !== null) {
    var delay = options.delay;
    if (typeof delay === 'number' && delay > 0) {
      startTime = currentTime + delay;	// 如果设置了延时，开始时间要加上这个 delay
    } else {
      startTime = currentTime;
    }
  } else {
    startTime = currentTime;
  }

  var timeout;
  // 根据任务的优先级设置 timeout
  switch (priorityLevel) {
    case ImmediatePriority:
      // 立即执行
      timeout = -1;
      break;
    case UserBlockingPriority:
      // Eventually times out
      timeout = userBlockingPriorityTimeout;
      break;
    case IdlePriority:
      // Never times out
      timeout = maxSigned31BitInt;
      break;
    case LowPriority:
      // Eventually times out
      timeout = lowPriorityTimeout;
      break;
    case NormalPriority:
    default:
      // Eventually times out
      timeout = normalPriorityTimeout;
      break;
  }

    
  // 任务的过期时间等于 开始时间+timeout
  var expirationTime = startTime + timeout;

  // 新建一个任务
  var newTask: Task = {
    id: taskIdCounter++,	// 任务id
    callback,	// 要执行的回调
    priorityLevel,	// 任务优先级
    startTime,	// 任务的开始时间
    expirationTime,	// 任务的过期时间
    sortIndex: -1,	// 用于小顶堆排序
  };

  if (startTime > currentTime) {	// 说明是 延时任务
    // This is a delayed task.
    newTask.sortIndex = startTime;	
    push(timerQueue, newTask);	
    // peek：从队列中取出第一个
    // 普通任务队列为空，即普通任务全部执行完了，并且当前任务是延时队列中最新的任务
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      // All tasks are delayed, and this is the task with the earliest delay.
      if (isHostTimeoutScheduled) {
        // Cancel an existing timeout.
        cancelHostTimeout();
      } else {
        isHostTimeoutScheduled = true;
      }
     
      // 把延时任务放在 settimeout 中执行
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {	// 普通任务
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);
    if (enableProfiling) {
      markTaskStart(newTask, currentTime);
      newTask.isQueued = true;
    }
    // Schedule a host callback, if needed. If we're already performing work,
    // wait until the next time we yield.
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback();	// 最终进行普通任务的调度
    }
  }

  return newTask;	// 向外部返回任务
}
```



##### requestHostCallback 和 schedulePerformWorkUntilDeadline

对于普通任务，执行

*requestHostCallback* ：调用 *schedulePerformWorkUntilDeadline*

*schedulePerformWorkUntilDeadline*：根据不同的宿主环境使用不同的产生宏任务的方法

- Nodejs 和 IE：*setImmediate*
- 大多数情况下：*MessageChannel*
- 意外情况使用 *setTimeout* 兜底



```js
function requestHostCallback() {
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}

let schedulePerformWorkUntilDeadline;
if (typeof localSetImmediate === 'function') {
  // Node.js and old IE.
  // There's a few reasons for why we prefer setImmediate.
  //
  // Unlike MessageChannel, it doesn't prevent a Node.js process from exiting.
  // (Even though this is a DOM fork of the Scheduler, you could get here
  // with a mix of Node.js 15+, which has a MessageChannel, and jsdom.)
  // https://github.com/facebook/react/issues/20756
  //
  // But also, it runs earlier which is the semantic we want.
  // If other browsers ever implement it, it's better to use it.
  // Although both of these would be inferior to native scheduling.
  schedulePerformWorkUntilDeadline = () => {
    localSetImmediate(performWorkUntilDeadline);
  };
} else if (typeof MessageChannel !== 'undefined') {
  // DOM and Worker environments.
  // We prefer MessageChannel because of the 4ms setTimeout clamping.
  const channel = new MessageChannel();
  const port = channel.port2;
  channel.port1.onmessage = performWorkUntilDeadline;
  schedulePerformWorkUntilDeadline = () => {
    port.postMessage(null);
  };
} else {
  // We should only fallback here in non-browser environments.
  schedulePerformWorkUntilDeadline = () => {
    // $FlowFixMe[not-a-function] nullable value
    localSetTimeout(performWorkUntilDeadline, 0);
  };
}
```



##### performWorkUntilDeadline

这个函数是在上面的 `channel.port1.onmessage = performWorkUntilDeadline;` 

主要作用就是执行 *flushWork*，返回时候还有剩余任务，如果还有剩余任务，将新建一个 *MessageChannel*，在下一个事件循环中继续执行

```js
const performWorkUntilDeadline = () => {
  if (isMessageLoopRunning) {
    const currentTime = getCurrentTime();

    startTime = currentTime;

    let hasMoreWork = true;
    try {
      // 执行 flushWork，返回值表示还有没有剩余任务  
      hasMoreWork = flushWork(currentTime);	
    } finally {	
      if (hasMoreWork) {
        // 如果有剩余任务，将创建一个新的 MessageChannel，在下一轮时间循环中继续执行
        schedulePerformWorkUntilDeadline();
      } else {
        isMessageLoopRunning = false;
      }
    }
  }
};
```





##### flushWork 和 workLoop

*flushWork* 的作用简单来说就是调用 *workLoop*

*workLoop* 则是在一个 while 循环中不停取出任务执行，当然还要判断是否过期和是否需要交还主线程

退出 while 循环后，会判断最后一次取出的 `currentTash` 是否为 null，如果为 null，继续取出 *timerQueue* 的第一个延时任务并执行。

最后，如果 *taskQueue* 和 *timerQueue* 都空了，就返回 true，否则返回 false，赋值给上面的 `hasMoreWork`

```js
/**
 * 
 * @param {*} initialTime 任务开始执行的时间
 * @returns 
 */
function flushWork(initialTime) {
  // ...
  try {
    if (enableProfiling) {
      try {
        // 核心实际上是这一句，调用 workLoop
        return workLoop(initialTime);
      } catch (error) {
        // ...
      }
    } else {
      // 核心实际上是这一句，调用 workLoop
      return workLoop(initialTime);
    }
  } finally {
    // ...
  }
}


/**
 * 
 * @param {*} initialTime 任务开始执行的时间
 * @returns 
 */
function workLoop(initialTime: number) {
  let currentTime = initialTime;
  advanceTimers(currentTime);	// 在这里遍历延时任务队列
  currentTask = peek(taskQueue);
  while (
    currentTask !== null &&
    !(enableSchedulerDebugging && isSchedulerPaused)
  ) {
    // 当前任务的过期时间大于当前时间，说明任务还没有过期
    // shouldYieldToHost() 表示是否应该暂停，归还主线程
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      // 进入这里说明任务还没到需要立即执行的时候，并且需要归还主线程了
      break;
    }
    const callback = currentTask.callback;
    if (typeof callback === 'function') {
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
	  // 在这里执行 callback
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime();
      if (typeof continuationCallback === 'function') {
        // If a continuation is returned, immediately yield to the main thread
        // regardless of how much time is left in the current time slice.
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        currentTask.callback = continuationCallback;
        if (enableProfiling) {
          // $FlowFixMe[incompatible-call] found when upgrading Flow
          markTaskYield(currentTask, currentTime);
        }
        advanceTimers(currentTime);
        return true;
      } else {
        if (enableProfiling) {
          // $FlowFixMe[incompatible-call] found when upgrading Flow
          markTaskCompleted(currentTask, currentTime);
          // $FlowFixMe[incompatible-use] found when upgrading Flow
          currentTask.isQueued = false;
        }
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
        advanceTimers(currentTime);
      }
    } else {
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }
  // Return whether there's additional work
  if (currentTask !== null) {
    return true;
  } else {
    const firstTimer = peek(timerQueue);
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }
    return false;
  }
}
```



##### shouldYieldToHost

这个函数的作用是判断是否需要交还主线程

```js
let frameInterval = frameYieldMs;
let startTime = -1;

function shouldYieldToHost(): boolean {
  const timeElapsed = getCurrentTime() - startTime;
  if (timeElapsed < frameInterval) {
    // 因执行任务所阻塞的时间还没有达到需要交还的时间frameYieldMs，默认是 5ms
    return false;
  }
  // Yield now.
  return true;
}
```





##### advanceTimers

这个函数的作用是遍历所有延时任务，发现 `timer.startTime <= currentTime` 的也就是已经到可以执行的时间的任务，但不是立即执行，而是放进 *taskQueue* 中，等待 *workLoop* 执行

```js
function advanceTimers(currentTime: number) {
  // Check for tasks that are no longer delayed and add them to the queue.
  let timer = peek(timerQueue);
  while (timer !== null) {
    if (timer.callback === null) {
      // Timer was cancelled.
      pop(timerQueue);
    } else if (timer.startTime <= currentTime) {
      // Timer fired. Transfer to the task queue.
      pop(timerQueue);
      timer.sortIndex = timer.expirationTime;
      push(taskQueue, timer);
      if (enableProfiling) {
        markTaskStart(timer, currentTime);
        timer.isQueued = true;
      }
    } else {
      // Remaining timers are pending.
      return;
    }
    timer = peek(timerQueue);
  }
}
```



##### requestHostTimeout 和 handleTimeout

对于普通任务的调度，使用的是 *requestHostCallback*，而对于延时任务的调度，使用的则是 *requestHostTimeout*

*requestHostTimeout*：实际上调用的就是 *setTimeout*，并在其中调用传入的 *handleTimeout*

*handleTimeout*：首先要执行 *advanceTimers* 方法，将所有已经到执行时机的任务放入 *taskQueue* 中，然后检查 *taskQueue* 是否不为空并执行 *requestHostCallback*。如果为空，则检查 *timerQueue* 是否为空，不为空则进入 *requestHostTimeout* 

```js
function requestHostTimeout(
  callback: (currentTime: number) => void,
  ms: number,
) {
  taskTimeoutID = localSetTimeout(() => {
    callback(getCurrentTime());
  }, ms);
}

/**
 *
 * @param {*} currentTime 当前时间
 */
function handleTimeout(currentTime) {
  isHostTimeoutScheduled = false;
  // 遍历timerQueue，将时间已经到了的延时任务放入到 taskQueue
  advanceTimers(currentTime);

  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
      // 从普通任务队列中拿一个任务出来
      isHostCallbackScheduled = true;
      // 采用调度普通任务的方式进行调度
      requestHostCallback(flushWork);
    } else {
      // taskQueue任务队列里面是空的
      // 再从 timerQueue 队列取一个任务出来
      // peek 是小顶堆中提供的方法
      const firstTimer = peek(timerQueue);
      if (firstTimer !== null) {
        // 取出来了，接下来取出的延时任务仍然使用 requestHostTimeout 进行调度
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}
```



### Reconciler 调和器

调和是 render 阶段的第二阶段工作

根据调度器结果的不同，调和器的起点也是不同的
- 如果调度器返回 *Sync*，则调和器从 *performSyncWorkOnRoot* 开始
- 如果调度器返回 *Concurrent*，则调和器从 *performConcurrentWorkOnRoot* 开始
- 最终都是要调用 *performUnitOfWork* 这个函数

> packages/react-reconciler/src/ReactFiberWorkLoop.js

```js
function performSyncWorkOnRoot (root, lanes) {
  // 在这里面会调用 renderRootSync 方法从而调用 workLoopSync
}

function performConcurrentWorkOnRoot (root, lanes) {
    // 在这里面会根据调度结果判断是否需要并发
    shouldSlice ? renderRootConcurrent(root, lanes) : renderRootSync(root, lanes)
}

function renderRootConcurrent () {
    workLoopConcurrent()
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function workLoopConcurrent () {
    while(workInProgress !== null && !shouldYield()) {
        performUnitOfWork(workInProgress)
    }
}
```



**performUnitOfWork**

先来看看整体的代码逻辑

```js
function performUnitOfWork (unitFiber) {
    // 获取当前 Fiber 对应的 current Tree 中的 Fiber
    const current = unitFiber.alternate
    let next
    // “递”
    next = beginWork(current, unitFiber, NoLanes)
    if(next !== null) {
        // 如果 beginWork 返回的结果不为 null，说明还有子节点，就赋值给 workInProgress 让上面的 while 循环继续
        // 那么就继续对子节点执行 beginWork，对应整个递归遍历中 “递” 的过程
        workInProgress = next
    } else {
        // 否则说明已经没有子节点了，那么就开始执行 completeWork
        // 对应整个递归遍历中 “归” 的过程
        completeWork(unitFiber)
    }
}
```

综上，整个调和过程的工作分为两阶段

- “递” 阶段
- “归” 阶段



递归过程图示

![image-20240829162719155](http://jiahe-picbed.oss-cn-shenzhen.aliyuncs.com/typora-image/image-20240829162719155.png) 



#### “递” 阶段 beginWork

*beginWork* 的主要工作是根据传入的 FIberNode 创建下一级的 FiberNode，期间会用到 diff 进行复用

1. 首先会判断当前是 update 更新还是 mount 首次渲染

   ```js
   if(current !== null) {
       // update
   } else {
       // mount
   }
   ```

   1. 如果是 update，判断新老 props、context、组件类型是否发生变化，从而决定是否需要更新，通过 `didReceiveUpdate = true` 保存
   2. 如果是 mount，直接设置 `didReceiveUpdate = false`

2. 随后根据 `workInProgress.tag` 判断 Fiber 的类型，在 React 源码中有 28 重  tag，并对这些 Fiber 做一定的处理

   下面是几种 tag 和含义：

   - HostComponent：原生组件，例如 div、p、span 等

   - FunctionComponent & IncompleteFunctionComponent：

     IncompleteFunctionComponent 对应 function 组件 mount 的 tag

     FunctionComponent 对应 function 组件在 update 的 tag

   - HostText：文本元素

3. 所有经过处理的 Fiber 都会进入到 *reconcileChildren* 的处理，这个函数会根据 current 是否为 null 来判断进入 mount 还是 update，从而决定要不要做“副作用追踪”，对应的变量是 `shouldTrackSideEffects`

   - false：不追踪副作用，不过 flags 标记，因为是 mount 阶段，啥也没有
   - true：追踪副作用，做 flags 标记，因为是 update 阶段，发生了更新

   这些 flags 标记决定了在 commit 阶段对 Fiber 进行何种操作

   ```ts
   export function reconcileChildren(
     current: Fiber | null,
     workInProgress: Fiber,
     nextChildren: any,
     renderLanes: Lanes,
   ) {
       if(current === null) {
           createChildReconciler(false)
       } else {
           createChildReconciler(true)
       }
   }
   
   // shouldTrackSideEffects 是否追踪副作用
   function createChildReconciler(shouldTrackSideEffects: boolean)
   ```

4. 接下来就是大名鼎鼎的 diff 算法了，根据 diff 的结果决定 Fiber 能否复用

   - 能复用且需要移动的，会打上  `Placement`  flag
   - 不能复用需要插入的，也会打赏 `Placement` flag
   - 需要删除的，会放入一个 `deletions` 数组重，等待 commit 阶段统一删除



*beginWork* 方法图示

![image-20240829162823969](http://jiahe-picbed.oss-cn-shenzhen.aliyuncs.com/typora-image/image-20240829162823969.png)





#### “归” 阶段 completeWork

*completeWork*  跟 *beginWork* 一样，也要判断是 mount 阶段还是 update 阶段，也要进行 `workInProgress.tag` 的区分

```ts
function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
     switch (workInProgress.tag) {
         // ...
         case HostComponent:
             if(current !== null) {
                 // update 
                 updateHostComponent(...)
             } else {
                 // mount
                 const instance = craeteInstance(...)
                 appendAllChildren(...)
             }
     }
 }
```



##### mount 阶段

首先会通过 *createInstance* 创建 FiberNode 对应的  DOM 元素

下面是 React-DOM 对应的 *createInstance* 方法，不同的宿主环境方法不同

```js
function createInstance(type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
   if (typeof props.children === 'string' || typeof props.children === 'number') {
     // children 为 string / number 时做一些特殊处理
   }
  // 创建 DOM 元素
  var domElement = createElement(type, props, rootContainerInstance, parentNamespace);
  // 。。。
  return domElement;
}
```

接下来执行 *appendAllChildren* 方法，它的执行步骤如下

1. 从当前的 FiberNode 往下遍历，遇到第一个 DOM 元素，执行 *appendInitialChild* 方法，将这些元素插入到 parend 的末尾

2. 继续遍历兄弟节点，对兄弟节点一样执行步骤一
3. 如果兄弟节点也都遍历完了，就对父节点一样执行步骤一
4. 如果父节点已经是根节点了，那么就退出遍历

经过上面的遍历，最终会形成一棵完整的DOM树

```ts
function appendAllChildren(
  parent: Instance,
  workInProgress: Fiber,
  needsVisibilityToggle: boolean,
  isHidden: boolean,
) {
    let node = workInProgress.child;
    while (node !== null) {
      if (node.tag === HostComponent || node.tag === HostText) {
        // 原生 DOM 元素
        appendInitialChild(parent, node.stateNode);
      } else if (node.child !== null) {
        // 如果不是 DOM 元素，就一直往下查找
        node.child.return = node;
        node = node.child;
        continue;
      }
      if (node === workInProgress) {
        // 说明已经遍历完了
        return;
      }
   
      // 如果没有兄弟节点或者已经遍历完了所有兄弟节点，则向父节点遍历
      while (node.sibling === null) {
		// 
        if (node.return === null || node.return === workInProgress) {
          return;
        }
        node = node.return;
      }

      // 遍历兄弟节点
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }
```



接下来，通过 *finalizeInitialChildren* 方法完成属性的初始化操作，主要包括以下几类属性以及对应的方法：

- styles：*setValueForStyles*

- innerHTML：*setInnerHTML*

- 文本内容：*setTextContent*

- 针对一些元素监听一些事件：*listenToNonDelegatedEvent*，例如：

  ```js
  	case 'iframe':
      case 'object':
      case 'embed':
        // We listen to this event in case to ensure emulated bubble listeners still fire for the load event.
        listenToNonDelegatedEvent('load', domElement);
        props = rawProps;
        break;
  
  	case 'img':
      case 'image':
      case 'link':
        // We listen to these events in case to ensure emulated bubble
        // listeners still fire for error and load events.
        listenToNonDelegatedEvent('error', domElement);
        listenToNonDelegatedEvent('load', domElement);
        props = rawProps;
        break;
  ```

  

- 其它：*setValueForProperty*



最后，通过 *bubbleProperties* 方法来进行 flags 的冒泡，至于作用，后文会讲



##### update 阶段

mount 是完成属性的初始化，update 就是完成属性更新的标记，注意是 **标记**，被标记的变化会放在 *Fiber.updateQueue* 中，同时会标记 `Fiber.flags |= Update`

*updateHostComponent* 的主要逻辑是在 *diffProperties* 方法里面

- 第一次遍历，主要是标记更新前有，更新没有的属性，实际上也就是标记删除了的属性
- 第二次遍历，主要是标记更新前后有变化的属性，实际上也就是标记更新了的属性

```js
function diffProperties(domElement, tag, lastRawProps, nextRawProps, rootContainer){
  // 保存变化属性的 key、value
  let updatePayload = null;
  // 更新前的属性
  let lastProps;
  // 更新后的属性
  let nextProps;
  
  //...
  // 标记删除“更新前有，更新后没有”的属性
  for(propKey in lastProps){
    if(nextProps.hasOwnProperty(propKey) || !lastProps.hasOwnProperty(propKey) || lastProps[propKey] == null){
      continue;
    }
    
    if(propKey === STYLE){
      // 处理 style
    } else {
      //其他属性
      (updatePayload = updatePayload || []).push(propKey, null);
    }
  }
  
  // 标记更新“update流程前后发生改变”的属性
  for(propKey in lastProps){
    let nextProp = nextProps[propKey];
    let lastProp = lastProps != null ? lastProps[propKey] : undefined;
    
    if(!nextProps.hasOwnProperty(propKey) || nextProp === lastProp || nextProp == null && lastProp == null){
      continue;
    }
    
    if(propKey === STYLE) {
      // 处理 stlye
    } else if(propKey === DANGEROUSLY_SET_INNER_HTML){
      // 处理 innerHTML
    } else if(propKey === CHILDREN){
      // 处理单一文本类型的 children
    } else if(registrationNameDependencies.hasOwnProperty(propKey)) {
      if(nextProp != null) {
        // 处理 onScroll 事件
      } else {
        // 处理其他属性
      }
    }
  }
  //...
  return updatePayload;
}
```



*completeWork* 方法图示

![image-20240829164203640](http://jiahe-picbed.oss-cn-shenzhen.aliyuncs.com/typora-image/image-20240829164203640.png)



##### flags 冒泡



## 二、commit 阶段



![image-20240829190937624](http://jiahe-picbed.oss-cn-shenzhen.aliyuncs.com/typora-image/image-20240829190937624.png)



### renderer 渲染器



