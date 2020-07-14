const path = require('path');

module.exports = {
  mode: 'production',
  entry: path.resolve(__dirname, './test.js'),
  output: {
    path: path.resolve(__dirname),
    filename: 'index.js',
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /(node_modules)/,
        use: 'babel-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.js'],
  },
};