const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlBundlerPlugin = require("html-bundler-webpack-plugin");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const crypto_orig_createHash = crypto.createHash;
crypto.createHash = (algorithm) =>
  crypto_orig_createHash(algorithm == "md4" ? "sha256" : algorithm);

function findAllViews() {
  let deps = Object.keys(
    require(path.resolve(__dirname, "package-lock.json")).dependencies
  );
  var views = {};
  deps.forEach(function (dep) {
    try {
      var dir = path.resolve(__dirname, "node_modules", dep);
      let json = require(path.resolve(dir, "package.json"));
      if (json["fontra"] && json["fontra"].view) {
        views[json["fontra"].view] = require.resolve(
          dep + "/" + json["fontra"].view + ".html"
        );
      }
    } catch (err) {}
  });
  return views;
}

const entries = findAllViews();

module.exports = {
  entry: {},
  output: {
    path: path.resolve(__dirname, "src", "fontra", "frontend"),
    filename: "[name].[contenthash].js",
    clean: true,
  },
  mode: "development",
  experiments: {
    asyncWebAssembly: true,
  },
  module: {
    rules: [
      {
        test: /\.s?css$/,
        use: ["css-loader"],
      },
      {
        test: /\.(ico|png|jp?g|svg)/,
        type: "asset/resource",
      },
    ],
  },
  resolve: {
    modules: [path.resolve(__dirname, "node_modules")],
    fallback: {
      fs: false,
      zlib: false,
      assert: false,
      util: false,
      stream: false,
      path: false,
      url: false,
      buffer: require.resolve("buffer"),
    },
  },
  plugins: [
    new HtmlBundlerPlugin({
      entry: entries,
    }),
  ],
  extends: [require.resolve("@fontra/core")],
};
