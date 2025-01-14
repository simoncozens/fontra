let CopyPlugin = require("copy-webpack-plugin");
let path = require("path");

module.exports = {
  entry: {
    applicationsettings: {
      filename: "./applicationsettings.js",
      import: "@fontra/views-applicationsettings/applicationsettings.js",
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
