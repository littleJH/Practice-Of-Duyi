const path = require('path')
const yaml = require('yaml')
const fs = require('fs')
const webpack = require('webpack')
const MyPlugin = require('./plugins/my-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpackBundleAnalyzer = require("webpack-bundle-analyzer")
// const bundleAnalyzer = require('webpack-bundle-analyzer')
// const statsWebpackPlugin = require('stats-webpack-plugin')

if (!fs.existsSync('log')) {
  fs.mkdirSync('log')
}
const currentTime = new Date().getTime()
fs.writeFileSync(`log/build-log-${currentTime}.txt`, '')

const getEnvConfig = () => {
  const env = process.env.NODE_ENV || 'development'

  const config = yaml.parse(
    fs.readFileSync(path.resolve(__dirname, `.config/.${env}.yaml`), 'utf-8'),
  )
  return config?.WEBPACK_CONFIG || {}
}

const handleProcessPlugin = (percent, message, ...args) => {
  const log = `${(percent * 100).toFixed(2)}% ${message} ${args.join(' ')}\n`
  fs.appendFileSync(`log/build-log-${currentTime}.txt`, log)
}

module.exports = {
  mode: getEnvConfig()?.mode || 'development',
  plugins: [
    new HtmlWebpackPlugin({
      template: 'public/index.html',
    }),
    new webpack.ProgressPlugin(handleProcessPlugin),
    new MyPlugin(),
    new MiniCssExtractPlugin({
      filename: 'assets/[name].css'
    }),
    new webpack.DllReferencePlugin({
      manifest: path.resolve(__dirname, 'dist/dll/jquery.manifest.json')
    }),
    new webpack.DllReferencePlugin({
      manifest: path.resolve(__dirname, 'dist/dll/lodash.manifest.json')
    }),
    new webpackBundleAnalyzer.BundleAnalyzerPlugin()
  ],
  entry: {
    main: './src/index.js',
  },
  devServer: {
    open: true,
    hot: true
  },
  devtool: 'source-map',
  output: {
    publicPath: "/",
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: {
      keep: /dll/
    },
  },
  module: {
    rules: [
      {
        test: /\.(png)|(jpg)|(gif)|(jpeg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name]-[hash:5].[ext]'
        }
        /**
         * file-loader 和 url-loader 已弃用！！！
         * css-loader v6 已经使用新的 url(...) 转换语法
         * 默认启用 asset modules
         * 这是 webpack 5 新增功能
         * 
         * "Asset Modules允许您使用资产文件（字体、图标等），而无需配置额外的加载程序。"
         * https://webpack.js.org/guides/asset-modules/#resource-assets
         * 
         * 
         */

        // use: [{
        //   loader: 'file-loader',
        //   options: {
        //     name: '[name]-[hash:5].[ext]',
        //     outputPath: 'images/'
        //   }
        // }],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          // {
          //   loader: 'style-loader',
          // },
          {
            loader: 'css-loader',
            options: {
              esModule: true,
              modules: {
                namedExport: true,
              },
            },
          },
        ],
      },
      {
        test: /\.(pcss)|(postcss)$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
            },
          },
          {
            loader: 'less-loader',
          },
        ],
      },
      // {
      //   test: /\.html$/i,
      //   loader: 'html-loader',
      // },
      {
        test: /\.(?:js|mjs|cjs)$/,
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
    ],
  },
  externals: {
    lodash: '_',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@assets': path.resolve(__dirname, 'assets'),
    },
  },
  stats: {
    preset: "minimal"
  },
}
