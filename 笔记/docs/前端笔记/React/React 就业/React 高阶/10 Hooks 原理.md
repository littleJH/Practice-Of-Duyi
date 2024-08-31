# Hooks 原理
---

> 面试题：Hook是如何保存函数组件状态的？为什么不能在循环，条件或嵌套函数中调用 Hook ？



## Hook

针对 Hook 有三种策略，或者说三种类型的 *Dispatcher*

- HooksDispatcherOnMount：

  ```js title="HooksDispatcherOnMount"
  const HooksDispatcherOnMount: Dispatcher = {
    readContext,
  
    use,
    useCallback: mountCallback,
    useContext: readContext,
    useEffect: mountEffect,
    useImperativeHandle: mountImperativeHandle,
    useLayoutEffect: mountLayoutEffect,
    useInsertionEffect: mountInsertionEffect,
    useMemo: mountMemo,
    useReducer: mountReducer,
    useRef: mountRef,
    useState: mountState,
    useDebugValue: mountDebugValue,
    useDeferredValue: mountDeferredValue,
    useTransition: mountTransition,
    useSyncExternalStore: mountSyncExternalStore,
    useId: mountId,
  };
  ```

  







## Hook 执行流程

在 FunctionComponent 进入到 render 阶段，在 *beginWork* 的执行中，匹配到 `workInProgress.tag === FcuntionComponent ` 时，会执行 *updateFunctionComponent* 方法。

我们直到 *beginWork* 方法会根据传入的 FiberNode 创建下一级的 FIberNode。对于 FC，会先在 *renderWithHooks* 中执行我们写的 FC 函数组件，返回值交给 *reconcilerChildren* 去调和（diff）

在 FC 函数组件的执行过程中，就会执行各种各样的 Hooks

*renderWithHooks* 相关代码：

```ts title="renderWithHooks"
export function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes,
): any {
  renderLanes = nextRenderLanes;
  currentlyRenderingFiber = workInProgress;

  // 
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.lanes = NoLanes;

    // 判断是 mount 还是 update，来初始化对应的上下文对象
    // 不同的上下文对象对每个 Hook 有不同的方法
    ReactSharedInternals.H =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;

  // 在每一次 renderWithHooks 结束前调用，防止在函数组件外部调用 hooks
  finishRenderingHooks(current, workInProgress, Component);

  return children;
}
```



### useState 举例

```jsx
function () {
    const [count, setCount] = useState(1)
    return <div onClick={() => setCount(val => val + 1)}>{count}</div>
}
```

根据 mount 还是 update 执行不同的方法



#### mount

mount 执行的是 `HooksDispatcherOnMount.useState` 对应的 `mountState` 方法

```ts title="mountState"
function mountState (initialState) {
  // hook 的创建
	const hook = mountWorkInProgressHook()
    
 	// 初始化 hook 的属性
  hook.memoizedState = hook.baseState = initialState;
  
  const queue = {
    pending: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: (initialState: any),
  };
  hook.queue = queue;

  // 设置 dispatch 
  const dispatch: Dispatch<BasicStateAction<S>> = (dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any);
  queue.dispatch = dispatch;
  
  // 返回 [state, setState]
  return [hook.memoizedState, dispatch];
}
```



上面在执行 mountState 的时候，首先调用了 mountWorkInProgressHook，该方法的作用就是创建一个 hook 对象，相关代码如下：

```ts title="mountWorkInProgressHook"
function mountWorkInProgressHook () {
  const hook: Hook = {
    memoizedState: null,	// hook 自身维护的状态

    baseState: null,
    baseQueue: null,
    queue: null,	// hook 自身维护的更新队列

    next: null, // 指向下一个 hook
  };
  
	// hooks 是以链表的形式保存的
  if (workInProgressHook === null) {
    // 这是当前 hooks 链表的第一个 hook，将创建的 hook 作为链表的头节点
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // 将创建的 hook 添加到链表末尾
    workInProgressHook = workInProgressHook.next = hook;
  }

  return workInProgressHook
}
```



当函数组件完成初始化后，会形成一个 Hook 链表：

```jsx
function App() {
  const [number, setNumber] = React.useState(0); // 第一个hook
  const [num, setNum] = React.useState(1); // 第二个hook
  const dom = React.useRef(null); // 第三个hook
  React.useEffect(() => {
    // 第四个hook
    console.log(dom.current);
  }, []);
  return (
    <div ref={dom}>
      <div onClick={() => setNumber(number + 1)}> {number} </div>
      <div onClick={() => setNum(num + 1)}> {num}</div>
    </div>
  );
}
```

![image-20240830214913413](http://jiahe-picbed.oss-cn-shenzhen.aliyuncs.com/typora-image/image-20240830214913413.png)





#### update

mount 执行的是 `HooksDispatcherOnUpdate.useState` 对应的 `updateState` 方法

```ts title="updateState"
function updateState<S>(
  initialState: (() => S) | S,
) {
  return updateReducer(basicStateReducer, initialState);
}

function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
) {
  const hook = updateWorkInProgressHook();
  return updateReducerImpl(hook, ((currentHook: any): Hook), reducer);
}

function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  const hook = updateWorkInProgressHook();
  return updateReducerImpl(hook, ((currentHook: any): Hook), reducer);
}
```



为什么在 `updateState` 方法中又调用 `updateReducer` 方法呢？

简单来说 `useState` 就是简化版的 `useReducer`，区别在于 `updateReducer` 传入的第一个参数是 `basicStateReducer` 还是我们自己书写的 `reducer` 函数



在 `updateReducer` 中调用了 `updateWorkInProgressHook` 方法

mount 阶段中已经对 hooks 链表构建，那么在 update 阶段，会对

```ts title="updateWorkInProgressHook"
function updateWorkInProgressHook(): Hook {
  // This function is used both for updates and for re-renders triggered by a
  // render phase update. It assumes there is either a current hook we can
  // clone, or a work-in-progress hook from a previous render pass that we can
  // use as a base.
  let nextCurrentHook: null | Hook;
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;
    if (current !== null) {
      nextCurrentHook = current.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    nextCurrentHook = currentHook.next;
  }

  let nextWorkInProgressHook: null | Hook;
  if (workInProgressHook === null) {
    nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
  } else {
    nextWorkInProgressHook = workInProgressHook.next;
  }

  if (nextWorkInProgressHook !== null) {
    // There's already a work-in-progress. Reuse it.
    workInProgressHook = nextWorkInProgressHook;
    nextWorkInProgressHook = workInProgressHook.next;

    currentHook = nextCurrentHook;
  } else {
    // Clone from the current hook.

    if (nextCurrentHook === null) {
      const currentFiber = currentlyRenderingFiber.alternate;
      if (currentFiber === null) {
        // This is the initial render. This branch is reached when the component
        // suspends, resumes, then renders an additional hook.
        // Should never be reached because we should switch to the mount dispatcher first.
        throw new Error(
          'Update hook called on initial render. This is likely a bug in React. Please file an issue.',
        );
      } else {
        // This is an update. We should always have a current hook.
        throw new Error('Rendered more hooks than during the previous render.');
      }
    }

    currentHook = nextCurrentHook;

    const newHook: Hook = {
      memoizedState: currentHook.memoizedState,

      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,

      next: null,
    };

    if (workInProgressHook === null) {
      // This is the first hook in the list.
      currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else {
      // Append to the end of the list.
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }
  return workInProgressHook;
}
```







