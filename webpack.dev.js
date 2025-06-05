const { merge } = require("webpack-merge")
const path = require("path")
const common = require("./webpack.common")

module.exports = merge(common, {
  mode: "development",
  entry: {
    main: path.join(__dirname, "user/src/app.js"),
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "bundle.js",
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    watchFiles: ["user/index.html", "user/src/**/*"],
    open: true,
    port: 8080,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
  },
})
