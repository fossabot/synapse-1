const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve('dist'),
    filename: 'index_bundle.js'
  },
  module: {
     rules: [
       {
         test: /\.css$/,
         use: [
           'style-loader',
           'css-loader'
         ]
       }
     ]
   },
  plugins: [
      new HtmlWebpackPlugin({
          template: './src/index.html',
          filename: 'index.html',
          inject: 'body'
      })
  ]
},
module.exports = {
  entry: './src/components/auth/login/login.js',
  output: {
    path: path.resolve('dist'),
    filename: 'login.js'
  },
  module: {
     rules: [
       {
         test: /\.css$/,
         use: [
           'style-loader',
           'css-loader'
         ]
       }
     ]
   },
  plugins: [
      new HtmlWebpackPlugin({
          template: './src/components/auth/login/login.html',
          filename: 'login.html',
          inject: 'body'
      })
  ]
}
