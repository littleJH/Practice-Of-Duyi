// 斐波那契数列迭代器

function createFibonacciIterator() {
  let n = 1
  let prev0 = 1,
    prev1 = 1

  return {
    next() {
      const result = {
        value: prev0 + prev1,
        done: false,
      }
      prev0 = prev1
      prev1 = result.value
      n++
      return result
    },
  }
}

const feiboIter = createFibonacciIterator()

for (let i = 0; i < 10; i++) {
  console.log('🚀 ~ feiboIter.next():', feiboIter.next())
}
