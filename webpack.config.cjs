const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");
const crypto = require("crypto");
const crypto_orig_createHash = crypto.createHash;
crypto.createHash = (algorithm) =>
  crypto_orig_createHash(algorithm == "md4" ? "sha256" : algorithm);

module.exports = {
  entry: {
    "editor/start": "./src/fontra/views/editor/start.js",
    "fontinfo/fontinfo": "./src/fontra/views/fontinfo/fontinfo.js",
    "applicationsettings/start": "./src/fontra/views/applicationsettings/start.js",
  },
  output: {
    path: path.resolve(__dirname, "docs"),
  },
  mode: "development",
  experiments: {
    asyncWebAssembly: true,
  },
  resolve: {
    modules: [
      path.resolve(__dirname, "node_modules"),
      path.resolve(__dirname, "src/fontra/client"),
    ],
    fallback: {
      fs: false,
      zlib: false,
      assert: false,
      util: false,
      stream: false,
      path: false,
      url: false,
      buffer: require.resolve("buffer/"),
    },
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "fonts",
          to: "fonts/[name][ext]",
          context: "src/fontra/client",
        },
        {
          from: "lang",
          to: "lang/[name][ext]",
          context: "src/fontra/client",
        },
        {
          from: "src/fontra/client/images",
          to: "images/[name][ext]",
        },
        {
          from: "src/fontra/client/css",
          to: "css/[name][ext]",
        },
        {
          from: "src/fontra/client/tabler-icons",
          to: "tabler-icons/[name][ext]",
        },
        {
          from: "src/fontra/views/editor/editor.html",
          to: "[name][ext]",
        },
        {
          from: "src/fontra/views/editor/*.css",
          to: "editor/[name][ext]",
        },
        {
          from: "src/fontra/client/data/*.json",
          to: "data/[name][ext]",
        },
        {
          from: "src/fontra/client/core/*.json",
          to: "core/[name][ext]",
        },
        {
          from: "src/fontra/views/applicationsettings/applicationsettings.html",
          to: "[name][ext]",
        },
        {
          from: "src/fontra/views/fontinfo/fontinfo.html",
          to: "[name][ext]",
        },
      ],
    }),
  ],
};
