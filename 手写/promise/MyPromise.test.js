const MyPromise = require('./MyPromise')

describe('MyPromise', () => {
  test('MyPromise.resolve', () => {
    return MyPromise.resolve('resolved value').then(value => {
      expect(value).toBe('resolved value')
    })
  })

  test('MyPromise.reject', () => {
    return MyPromise.reject('rejected reason').catch(reason => {
      expect(reason).toBe('rejected reason')
    })
  })

  test('MyPromise.all with all resolved', () => {
    const promise1 = MyPromise.resolve(3)
    const promise2 = 42
    const promise3 = new MyPromise((resolve) => {
      setTimeout(resolve, 100, 'foo')
    })

    return MyPromise.all([promise1, promise2, promise3]).then(values => {
      expect(values).toEqual([3, 42, 'foo'])
    })
  })

  test('MyPromise.all with one rejected', () => {
    const promise1 = MyPromise.resolve(3)
    const promise2 = MyPromise.reject('error')
    const promise3 = new MyPromise((resolve) => {
      setTimeout(resolve, 100, 'foo')
    })

    return MyPromise.all([promise1, promise2, promise3]).catch(reason => {
      expect(reason).toBe('error')
    })
  })

  test('MyPromise.race', () => {
    const promise1 = new MyPromise((resolve) => {
      setTimeout(resolve, 500, 'one')
    })
    const promise2 = new MyPromise((resolve) => {
      setTimeout(resolve, 100, 'two')
    })

    return MyPromise.race([promise1, promise2]).then(value => {
      expect(value).toBe('two')
    })
  })

  test('MyPromise.allSettled', () => {
    const promise1 = MyPromise.resolve('resolved')
    const promise2 = MyPromise.reject('rejected')

    return MyPromise.allSettled([promise1, promise2]).then(results => {
      expect(results).toEqual([
        { status: 'fulfilled', value: 'resolved' },
        { status: 'rejected', reason: 'rejected' }
      ])
    })
  })

  test('MyPromise.any with one resolved', () => {
    const promise1 = MyPromise.reject('error')
    const promise2 = MyPromise.resolve('success')

    return MyPromise.any([promise1, promise2]).then(value => {
      expect(value).toBe('success')
    })
  })

  test('MyPromise.any with all rejected', () => {
    const promise1 = MyPromise.reject('error1')
    const promise2 = MyPromise.reject('error2')

    return MyPromise.any([promise1, promise2]).catch(reasons => {
      expect(reasons).toEqual(['error1', 'error2'])
    })
  })

  test('MyPromise.then', () => {
    return new MyPromise((resolve) => {
      resolve('value')
    }).then(value => {
      expect(value).toBe('value')
    })
  })

  test('MyPromise.catch', () => {
    return new MyPromise((_, reject) => {
      reject('reason')
    }).catch(reason => {
      expect(reason).toBe('reason')
    })
  })

  test('MyPromise.finally', () => {
    const onFinally = jest.fn()

    return new MyPromise((resolve) => {
      resolve('value')
    }).finally(onFinally).then(value => {
      expect(value).toBe('value')
      expect(onFinally).toHaveBeenCalled()
    })
  })

  test('MyPromise.finally with rejection', () => {
    const onFinally = jest.fn()

    return new MyPromise((_, reject) => {
      reject('reason')
    }).finally(onFinally).catch(reason => {
      expect(reason).toBe('reason')
      expect(onFinally).toHaveBeenCalled()
    })
  })
})
