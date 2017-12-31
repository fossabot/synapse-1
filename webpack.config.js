const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
    entry: {
        index: './src/index.js',
        login: './src/components/auth/login/login.js'
    },
    output: {
        path: path.resolve('dist'),
        filename: '[name]_bundle.js'
    },
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        compress: true,
        port: 9000
    },
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    {loader: 'style-loader'},
                    {loader: 'css-loader'},
                    {loader: 'sass-loader'}
                ]
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            }
        ]
    },
    resolve: {
        alias: {
            Components: path.resolve(__dirname, 'src/components/')
            }
    },
  plugins: [
      new HtmlWebpackPlugin({
          template: './src/index.html',
          filename: 'index.html',
          inject: 'body',
          chunks: ['index']
      }),
      new HtmlWebpackPlugin({
          template: './src/components/auth/login/login.html',
          filename: 'login.html',
          inject: 'body',
          chunks: ['login']
      })
  ]
}
