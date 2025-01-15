let CopyPlugin = require("copy-webpack-plugin");
const HtmlBundlerPlugin = require("html-bundler-webpack-plugin");
let path = require("path");
let plugins = [
  new HtmlBundlerPlugin({
    entry: path.resolve(__dirname),
  }),
];

console.log(path.resolve(__dirname));

module.exports = {
  plugins: plugins,
};
