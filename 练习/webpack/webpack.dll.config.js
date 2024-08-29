// 手动分包

const webpack = require('webpack')
const path = require('path')

module.exports = {
  mode: 'production',
  entry: {
    jquery: "jquery",
    lodash: 'lodash'
  },
  output: {
    filename: "dll/[name].js",
    library: "[name]"
  },
  plugins: [
    new webpack.DllPlugin({
      name: "[name]",
      path: path.resolve(__dirname, 'dist/dll/[name].manifest.json'),
    })
  ]
}