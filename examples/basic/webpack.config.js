// const path = require('path');
const { WebpackEnvPlugin } = require('webpack-env-plugin');

module.exports = {
  context: __dirname,
  mode: 'development',
  entry: './index.js',
  plugins: [new WebpackEnvPlugin()],
};
