'use strict'

process.env.NODE_ENV = process.env.NODE_ENV || 'production'

if (process.env.NODE_ENV != 'production' && process.env.NODE_ENV != 'development') {
  throw (new Error('Error process.env.NODE_ENV'))
}

var DEBUG = process.env.NODE_ENV === 'development' ? true : false
var HOT_RELOAD = process.env.HOT_RELOAD === 'true' ? true : false

var webpack = require('webpack')
var path = require('path')

var loaders = ['babel']
var port = process.env.PORT || 3000

var devtool
var plugins = [
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  })
]

if (HOT_RELOAD) {
  var entry = {
    'draw/app.js': './draw/index.js',
  }
} else {
  var entry = {
    'draw/vendor.js': './draw/global',
    'draw/app.js': './draw/index.js',
  }
}

if (DEBUG) {
  devtool = 'eval-source-map'
  loaders = ['react-hot'].concat(loaders)
  plugins = plugins.concat([
    new webpack.HotModuleReplacementPlugin()
  ])
  entry = Object.keys(entry).reduce(function (result, key) {
    if (!HOT_RELOAD) {
      result[key] = entry[key]
      return result
    }
    result[key] = [
      'webpack-dev-server/client?http://0.0.0.0:' + port,
      'webpack/hot/only-dev-server',
      entry[key]
    ]
    return result
  }, {})
} else {
  devtool = 'source-map'
  plugins = plugins.concat([
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin(),
  ])
}
var config = {
  devtool: devtool,
  entry: entry,
  output: {
    filename: '[name]',
    publicPath: '/',
    path: __dirname + '/',
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /build|lib|bower_components|node_modules/,
      loaders: loaders
    }, {
      test: /\.less$/,
      loaders: ['style', 'css', 'less']
    }],
    noParse: [
      path.join(__dirname, 'node_modules', 'babel-core', 'browser.min.js')
    ],
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
    alias: {}
  },
  plugins: plugins,
}


module.exports = config