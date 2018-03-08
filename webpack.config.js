const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const webpack_config = {
  entry: './src/index.js',

  output: {
    filename: 'wasm-ffi.bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};

const browser_config = {
  entry: {
    'wasm-ffi.browser': './src/index.js',
    'wasm-ffi.browser.min': './src/index.js',
  },

  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    library: 'ffi',
  },

  plugins: [
    new UglifyJsPlugin({ include: /\.min\.js$/ }),
  ],
};

module.exports = [webpack_config, browser_config];
