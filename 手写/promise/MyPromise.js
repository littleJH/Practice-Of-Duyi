const runAsMicroTask = (callback) => {
  if (globalThis === global) {
    globalThis.process.nextTick(callback)
  } else if (globalThis === window) {
    globalThis.queueMicrotask(callback)
  }
}

const isThenable = (promise) =>
  promise && typeof promise === 'object' && typeof promise.then === 'function'

class MyPromise {
  static PENDING = 'pending'
  static FULFILLED = 'fulfilled'
  static REJECTED = 'rejected'

  #state
  #value
  #reason
  #resolveQueue
  #rejectQueue

  /**
   * Creates an instance of Promise.
   * @param {Function} executor Promise 的执行器，会被立即执行，用于描述 Promise 任务
   * @memberof MyPromise
   */
  constructor(executor) {
    this.#state = MyPromise.PENDING
    this.#value = undefined
    this.#reason = undefined
    this.#resolveQueue = []
    this.#rejectQueue = []

    // 捕获执行器在执行过程中抛出的错误，调用 _reject，将状态变更为 rejected
    try {
      executor(this._resolve.bind(this), this._reject.bind(this))
    } catch (err) {
      this._reject(err)
      console.error(err)
    }
  }

  /**
   * 标记当前任务完成
   *
   * @param {*} value
   * @memberof MyPromise
   */
  _resolve(value) {
    if (this.#state === MyPromise.PENDING) {
      this._changeState(MyPromise.FULFILLED, value)
    }
  }

  /**
   * 标记当前任务失败
   *
   * @param {*} reason
   * @memberof MyPromise
   */
  _reject(reason) {
    if (this.#state === MyPromise.PENDING) {
      this._changeState(MyPromise.REJECTED, reason)
    }
  }

  /**
   *
   *
   * @param {*} state
   * @param {*} valueOrReason
   * @memberof MyPromise
   */
  _changeState(state, valueOrReason) {
    this.#state = state
    state === MyPromise.FULFILLED
      ? (this.#value = valueOrReason)
      : (this.#reason = valueOrReason)
    // 当状态发生变化时，运行所有 handlers
    this._runHandlers()
  }

  /**
   *
   *
   * @param {*} state
   * @param {*} handler
   * @memberof MyPromise
   */
  _pushHandler(state, handler) {
    if (state === MyPromise.FULFILLED) {
      this.#resolveQueue.push(handler)
    } else if (state === MyPromise.REJECTED) {
      this.#rejectQueue.push(handler)
    }
  }

  // 运行所有 handlers
  _runHandlers() {
    if (this.#state === MyPromise.FULFILLED) {
      while (this.#resolveQueue.length > 0) {
        const handler = this.#resolveQueue.shift()
        // 放到微任务队列中
        runAsMicroTask(handler)
      }
    } else if (this.#state === MyPromise.REJECTED) {
      while (this.#rejectQueue.length > 0) {
        const handler = this.#rejectQueue.shift()
        // 放到微任务队列中
        runAsMicroTask(handler)
      }
    } else return
  }

  /**
   * 承诺解析程序 [[Resolve]](psomise2, x)，
   * 处理 onFulfilled, onRejected 两个函数的返回值 x，确保 promise2 与 x 的状态的一致性。
   * @param {*} promise2 promise2 = promise1.then(onFulfilled, onRejected)
   * @param {*} x x = onFulfilled()
   * @param {*} resolve promise2 执行器函数的 resolve
   * @param {*} reject  promise2 执行器函数的 reject
   * @memberof MyPromise
   */
  _resolutionProcedure(promise2, x, resolve, reject) {
    // If promise and x refer to the same object, reject promise with a TypeError as the reason.
    // 如何才能成立？？？
    if (promise2 === x) {
      throw new Error(new TypeError('???'))
    }

    // 如果 x 是一个 promise，直接使用 x 的状态
    if (isThenable(x)) {
      // 如果 x 的状态是 pending，promise2 需要保持 pending，直到 x 的状态变为 fulfilled / rejected
      if (x.state === MyPromise.PENDING) {
        x.then(
          (value) => resolve(value),
          (error) => reject(error),
        )
      }
      // 如果 x 的状态是 fulfilled，使用 x 的 value 解决
      else if (x.state === MyPromise.FULFILLED) {
        resolve(x.value)
      }
      // 如果 x 的状态是 rejected，使用 x 的 reason 拒绝
      else if (x.state === MyPromise.REJECTED) {
        reject(x.reason)
      }
    }

    // 如果 x 是一个 object / function
    if (typeof x === 'object' || typeof x === 'function') {
      let then
      // 访问 x.then，如果抛出错误 e，则以 e 拒绝
      try {
        then = x.then
        then()
      } catch (e) {
        reject(e)
      }
      // 如果 then 是 function
      if (typeof then === 'function') {
        console.log('then is function')
        try {
          let firstCalled = false,
            secondCalled = false

          // call then 函数，以 x 作为 this，第一个参数 resolveProblem, 第二个参数 rejectProblem
          then.call(
            x,
            // 如果 resolveProblem 被调用了，且入参是 y，则进行 [[resolve]](promise2, y)
            (y) => {
              // 保证只执行一次
              !firstCalled &&
                this._resolutionProcedure(promise2, y, resolve, reject)
              firstCalled = true
            },
            // 如果 rejectProblem 被调用了，且入参是 r，则以 r 拒绝
            (r) => {
              // 保证只执行一次
              !secondCalled && reject(r)
              secondCalled = true
            },
          )

          // If both resolvePromise and rejectPromise are called, or multiple calls to the same argument are made, the first call takes precedence, and any further calls are ignored.
          // 如果同时调用 resolvePromise 和 rejectPromise，或对同一参数进行多次调用，则以第一次调用为准，以后的调用将被忽略。
          if (firstCalled && secondCalled) {
            // TODO
          }
        } catch (e) {
          !firstCalled && !secondCalled && reject(e)
        }
      }
      // 如果 then 不是 function，以 x 作为 value 解决
      else {
        resolve(x)
      }
    }
    // If x is not an object or function, fulfill promise with x.
    else {
      resolve(x)
    }
  }

  /**
   * A promise must provide a then method to access its current or eventual value or reason.
   *
   * 承诺必须提供一个 then 方法来访问其当前或最终值或理由。
   *
   * then 方法必须返回一个 Promise
   *
   * promise2 = promise1.then(onFulfilled, onRejected)
   *
   * 如果 onFulfilled 或 onRejected 返回一个值 x，则运行承诺解析程序 [[Resolve]](psomise2, x)
   *
   * 如果 onFulfilled 或 onRejected 抛出一个异常 e，promise2 必须被拒绝（reason is e）
   *
   * 如果 onFulfilled 不是一个 Function 并且 promise1 的状态是 fulfilled，promise2 的状态必须是 fulfilled，并且 value 与 promise1 保持一致
   *
   * 如果 onRejected 不是一个 Function 并且 promise1 的状态是 rejected，promise2 的状态必须是 rejected，并且 reason 与 promise1 保持一致
   *
   * 承诺解析程序 [[Resolve]](psomise2, x) 是什么？
   *
   * 简单理解：处理 onFulfilled, onRejected 两个函数的返回值 x，确保 promise2 与 x 的状态的一致性。
   *
   *
   *
   * @param {*} onFulfilled 成功的处理函数
   * @param {*} onRejected 失败的处理函数
   * @return {MyPromise}
   *
   * @memberof MyPromise
   */
  then(onFulfilled, onRejected) {
    // 状态
    const onFulfilledHandler = (resolve, reject, promise2) => {
      try {
        // onFulfilled 不是一个 Function 并且 promise1 的状态是 fulfilled
        if (
          typeof onFulfilled !== 'function' &&
          this.#state === MyPromise.FULFILLED
        ) {
          resolve(this.#value)
        } else {
          // 如果 onFulfilled 或 onRejected 返回一个值 x，则运行承诺解析程序 [[Resolve]](psomise2, x)
          const x = onFulfilled(this.#value)
          // console.log('🚀 ~ MyPromise ~ onFulfilledHandler ~ x:', x)
          this._resolutionProcedure(promise2, x, resolve, reject)
        }
      } catch (e) {
        // 如果 onFulfilled 或 onRejected 抛出一个异常 e，promise2 必须被拒绝（reason is e）
        reject(e)
      }
    }
    const onRejectedHandler = (reject, resolve, promise2) => {
      try {
        // 如果 onRejected 不是一个 Function 并且 promise1 的状态是 rejected
        if (
          typeof onRejected !== 'function' &&
          this.#state === MyPromise.REJECTED
        ) {
          reject(this.#reason)
        } else {
          // 如果 onFulfilled 或 onRejected 返回一个值 x，则运行承诺解析程序 [[Resolve]](psomise2, x)
          const x = onRejected(this.#reason)
          this._resolutionProcedure(promise2, x, resolve, reject)
        }
      } catch (e) {
        reject(e)
      }
    }

    const promise2 = new MyPromise((resolve, reject) => {
      this._pushHandler(MyPromise.FULFILLED, () =>
        onFulfilledHandler(resolve, reject, promise2),
      )
      this._pushHandler(MyPromise.REJECTED, () =>
        onRejectedHandler(reject, resolve, promise2),
      )
      this._runHandlers()
    })

    return promise2
  }

  /**
   * 用于注册失败 reject 的回调函数
   *
   * 就是 Promise.prototype.then(null, onRejected) 的简写
   *
   * @param {*} onRejected
   * @return {*}
   * @memberof MyPromise
   */
  catch(onRejected) {
    return this.then(null, onRejected)
  }

  /**
   * 用于注册无论成功还是失败都会执行的回调
   *
   * @param {*} callback
   * @return {*}
   * @memberof MyPromise
   */
  finally(callback) {
    return this.then(
      (val) => {
        callback(val)
        return val
      },
      (err) => {
        callback(err)
        throw err
      },
    )
  }

  /**
   * 根据给定的值，返回一个 已完成 的 Promise
   *
   * @param {*} value
   * @returns
   */
  static resolve(value) {
    // 如果 value 本身就是一个 Promise，直接返回
    if (value instanceof MyPromise) {
      return value
    }
    return new MyPromise((resolve, reject) => {
      /**
       * 如果 value 是一个 thanable 对象，即 PromiseLike（实现了 PromiseA+），
       * 返回新的 Promise，状态与其保持一致
       */
      if (isThenable(value)) {
        value.then(resolve, reject)
      }
      // 否则，直接返回一个 fulfilled 的 Promise
      else resolve(value)
    })
  }

  /**
   * 根据给定 reason，返回一个 已拒绝 的 Promise
   *
   * @param {*} reason
   * @returns
   */
  static reject(reason) {
    // 与 Promise.resolve() 不同，即使 reason 已经是一个 Promise，仍然返回一个新的 Promise
    return new MyPromise((_, reject) => {
      reject(reason)
    })
  }

  /**
   * 接受一个可迭代对象为输入，并返回一个新的 Promise
   *
   * 当所有输入的 Promise 都 已完成 时，返回的 Promise 也是 已完成，否则 已拒绝
   *
   * 如果 iterable 包含非 Promise 对象，这些值将被忽略，但是被包含在返回的数组中
   *
   * @param {*} iterable 可迭代对象
   * @returns {MyPromise}
   */
  static all(iterable) {
    return new MyPromise((resolve, reject) => {
      try {
        const result = [] // 结果数组
        let index = 0 // 当前索引
        let fulfilledCount = 0 // 已完成 的数量
        // 可迭代对象不一定是数组或类数组，不能使用 for 循环，也不一定有 length 属性
        for (let p of iterable) {
          const currentIndex = index
          index++
          // 非 Promise，直接添加到结果数组中
          if (!(p instanceof MyPromise)) {
            result[currentIndex] = p
            fulfilledCount++
          }
          // Promise
          else {
            p.then((res) => {
              result[currentIndex] = res
              fulfilledCount++
              // 遍历到最后一个时，已完成的数量 === 当前索引，意味全部已完成
              if (fulfilledCount === index) {
                // 异步解决
                resolve(result)
              }
            }).catch(reject)
          }
        }
        //迭代结束后 index === 0 意味 iterable 为空，同步解决
        if (index === 0) {
          resolve(result)
        }
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * 返回的 Promise 的状态取决于第一个 [已决] 的 Promise 的状态
   *
   * 如果可迭代对象中存在非Promise或已决的Promise，以第一个为准
   *
   * @param {*} iterable
   * @returns
   */
  static race(iterable) {
    return new MyPromise((resolve, reject) => {
      for (let p of iterable) {
        MyPromise.resolve(p).then(resolve, reject)
      }
    })
  }

  /**
   * 当输入的所有 Promise [已决]时，返回的 Promise 以 “描述每个结果的对象数组” 完成
   *
   * @param {*} iterable
   * @returns
   */
  static allSettled(iterable) {
    return new MyPromise((resolve) => {
      const result = []
      let index = 0
      let count = 0
      for (let p of iterable) {
        const currentIndex = index
        index++
        MyPromise.resolve(p)
          .then((value) => {
            count++
            result[currentIndex] = {
              status: MyPromise.FULFILLED,
              value,
            }
          })
          .catch((reason) => {
            count++
            result[currentIndex] = {
              status: MyPromise.REJECTED,
              reason,
            }
          })
          .finally(() => {
            // 当所有 Promise [已决]时，
            index === count && resolve(result)
          })
      }
    })
  }

  /**
   * 任何一个 Promise [已决] 时，返回的 Promise 已决
   *
   * 若全部 Promise [拒绝]，以一个包含所有 reason 的数组拒绝
   *
   * @param {*} iterable
   * @returns
   */
  static any(iterable) {
    return new MyPromise((resolve, reject) => {
      const reasons = []

      let index = 0
      let rejectedCount = 0
      for (let p of iterable) {
        const currentIndex = index
        index++
        MyPromise.resolve(p)
          .then(resolve)
          .catch((err) => {
            rejectedCount++
            reasons[currentIndex] = err
            if (rejectedCount === index) {
              reject(reasons)
            }
          })
      }
    })
  }
}

module.exports = MyPromise
