// 斐波那契数列生成器

function* fibonacciGenerator() {
  let current = 0,
    next = 1
  while (true) {
    const reset = yield current
    ;[current, next] = [next, current + next]
    if (reset) {
      current = 0
      next = 1
    }
  }
}

const sequence = fibonacciGenerator()
console.log(sequence.next().value) // 0
console.log(sequence.next().value) // 1
console.log(sequence.next().value) // 1
console.log(sequence.next().value) // 2
console.log(sequence.next().value) // 3
console.log(sequence.next().value) // 5
console.log(sequence.next().value) // 8
console.log(sequence.next(true).value) // 0
console.log(sequence.next().value) // 1
console.log(sequence.next().value) // 1
console.log(sequence.next().value) // 2
