const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");
const crypto = require("crypto");
const crypto_orig_createHash = crypto.createHash;
crypto.createHash = (algorithm) =>
  crypto_orig_createHash(algorithm == "md4" ? "sha256" : algorithm);

const fontracore = require.resolve("@fontra/core");
const applicationsettings = require.resolve("@fontra/views-applicationsettings");

module.exports = {
  entry: {},
  output: {
    path: path.resolve(__dirname, "src", "fontra", "frontend"),
  },
  mode: "development",
  experiments: {
    asyncWebAssembly: true,
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
  extends: [fontracore, applicationsettings],
};
