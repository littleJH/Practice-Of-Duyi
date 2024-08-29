const loaderUtils = require('loader-utils')

function loader(buffer) {
  const result =
    buffer.byteLength > 10000 ? toFile.call(this, buffer) : toBase64(buffer)
  return `module.exports = \`${result}\``
}

function toBase64(buffer) {
  return 'data:image/png;base64,' + buffer.toString('base64')
}

function toFile(buffer) {
  const filename = loaderUtils.interpolateName(this, '[name]-[contenthash:5].[ext]', {
    content: buffer,
  })
  this.emitFile(filename, buffer)
  return filename
}

loader.raw = true // 告诉 loader 返回的是二进制数据

module.exports = loader
