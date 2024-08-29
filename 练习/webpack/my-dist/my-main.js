/**
 * 模拟 webpack 打包结果
 */

;(function (modules, entry = './src/index.js') {
  // require 函数，调用它相当于运行模块，得到导出的对象
  function require(moduleId) {
    const func = modules[moduleId] // 得到模块对应的函数
    // 用于保存导出的结果
    const module = {
      exports: {},
    }
    // 运行模块代码
    func(module, module.exports, require)
  }
  // 根据 entry 入口开始执行，递归调用
  require(entry)
})({
  // 该对象保存了所有模块，以及模块对应的代码，在函数环境中运行
  './src/index.js': function (module, exports, require) {
    console.log('module index')
    const a = require('./src/a.js')
  },
  './src/a.js': function (module, exports, require) {
    console.log('module a')
    module.exports = {
      a: 'aaa',
    }
    const b = require('./src/b.js')
  },
  './src/b.js': function (module, exports, require) {
    console.log('module b')
    module.exports = {
      b: 'bbb',
    }
  },
})
