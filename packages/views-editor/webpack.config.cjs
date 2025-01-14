let CopyPlugin = require("copy-webpack-plugin");
let path = require("path");

module.exports = {
  entry: {
    editor: {
      filename: "./editor.js",
      import: "@fontra/views-editor/editor.js",
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          context: path.resolve(__dirname, "assets"),
          from: "**/*",
        },
      ],
    }),
  ],
};
