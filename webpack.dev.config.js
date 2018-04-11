const path = require('path');

// es5-ified version for running tests w/ blanket & mocha:
module.exports = {
  entry: './src/index.js',

  output: {
    filename: 'wasm-ffi.browser.js',
    path: path.resolve(__dirname, 'tests'),
    library: 'ffi',
  },

  devtool: 'source-map',

  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          presets: ['babel-preset-env'],
        },
      },
    ],
  },
};
