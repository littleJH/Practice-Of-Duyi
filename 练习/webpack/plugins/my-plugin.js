const fs = require('fs')
const circularJson = require('circular-json')

module.exports = class MyPlugin {
  apply(compile) {
    compile.hooks.emit.tap('MyPlugin', (compilation) => {})
  }
}
