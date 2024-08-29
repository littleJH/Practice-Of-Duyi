// 自动分包
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')

module.exports = {
  mode: 'development',
  devServer: {
    open: true,
    hot: true
  },
  entry: {
    page1: './src/tosplit/page1.js',
    page2: './src/tosplit/page2.js'
  },
  output: {
    clean: true,
    path: path.resolve(__dirname, 'dist-split'),
    filename: '[name].bundle.js'
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/, // 当匹配到相应模块时，将这些模块进行单独打包
          priority: -10, // 缓存组优先级，优先级越高，该策略越先进行处理，默认值为0
          name: 'vendors'
        },
        styles: {
          test: /\.css$/,
          priority: 0,
          minSize: 0,
          name: 'style'
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].[chunkhash:5].css",
      chunkFilename: 'common.[chunkhash:5].css'
    }),
    new HtmlWebpackPlugin({
      template: 'public/split.html',
    })
  ]
}