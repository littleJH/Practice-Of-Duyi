function* task() {
  console.log('start run task')
  const response = yield fetch('https://www.baidu.com/')
  const text = yield response.text()
  console.log('🚀 ~ function*task ~ text:', text)

  return text
}

function run(generatorFunction) {
  const generator = generatorFunction()
  let result = generator.next() // 启动任务

  function handerResult() {
    if (result.done) {
      return // 如果任务完成，不做任何处理
    }
    if (typeof result.value.then === 'function') {
      // 如果是异步任务，等待完成再进行下一次迭代
      result.value.then(
        (data) => {
          result = generator.next(data)
          handerResult()
        },
        (err) => generator.throw(err),
      )
    }
    // 不是异步任务，直接进行下一次迭代
    else {
      result = generator.next(result.value)
      handerResult()
    }
  }

  handerResult()
}

run(task)
