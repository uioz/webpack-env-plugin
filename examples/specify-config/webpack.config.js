const { WebpackEnvPlugin } = require('webpack-env-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  context: __dirname,
  mode: 'development',
  entry: './index.js',
  plugins: [
    new WebpackEnvPlugin({
      envFilePath: './test.toml',
    }),
    new HtmlWebpackPlugin(),
  ],
};
