const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: {
        index: './src/index.js',
        login: './src/components/auth/login/login.js',
        register: './src/components/auth/register/register.js'
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
                test: /\.(png|jpg|gif|svg)$/,
                use: [
                  {
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: 'images/', 
                    }
                  }
                ]
            },
            {
                test: /\.(mp4)$/,
                use: [
                  {
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: 'videos/', 
                    }
                  }
                ]
            },
            {
                test: /.(ttf|otf|eot|woff(2)?)(\?[a-z0-9]+)?$/,
                use: [
                  {
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]',
                        outputPath: 'fonts/',    // where the fonts will go
                        publicPath: '../'       // override the default path
                    }
                  }
                ]
            },
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
      }),
      new HtmlWebpackPlugin({
          template: './src/components/auth/register/register.html',
          filename: 'register.html',
          chunks: ['register']
      })
  ]
}
