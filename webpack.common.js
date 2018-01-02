const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: {
        index: './src/index.js',
        login: './src/components/auth/login/login.js'
    },
    output: {
        path: path.resolve('dist'),
        filename: '[name]_bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: ['css-loader', 'postcss-loader']
                })
            },
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: ['css-loader', 'postcss-loader', 'sass-loader']
                })
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            },
            {
                test: /\.(png|jpg|gif|mp4)$/,
                use: [
                  {
                    loader: 'file-loader',
                    options: {}
                  }
                ]
              }
        ]
    },
    resolve: {
        alias: {
            Components: path.resolve(__dirname, 'src/components/'),
            Utilities: path.resolve(__dirname, 'src/utilities/')
            }
    },
  plugins: [
      new ExtractTextPlugin("[name].css"),
      new HtmlWebpackPlugin({
          template: './src/index.html',
          filename: 'index.html',
          chunks: ['index']
      }),
      new HtmlWebpackPlugin({
          template: './src/components/auth/login/login.html',
          filename: 'login.html',
          chunks: ['login']
      })
  ]
}
