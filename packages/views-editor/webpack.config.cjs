let CopyPlugin = require("copy-webpack-plugin");
const HtmlBundlerPlugin = require("html-bundler-webpack-plugin");
let path = require("path");

module.exports = {
  plugins: [
    new HtmlBundlerPlugin({
      entry: path.resolve(__dirname),
    }),
  ],
};
