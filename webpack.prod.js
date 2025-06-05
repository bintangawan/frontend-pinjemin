const { merge } = require("webpack-merge")
const common = require("./webpack.common")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const { InjectManifest } = require("workbox-webpack-plugin")
const path = require("path")

module.exports = merge(common, {
  mode: "production",
  entry: {
    main: path.join(__dirname, "user/src/app.js"),
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
    ],
  },
  optimization: {
    minimizer: [new CssMinimizerPlugin()],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "bundle.css",
    }),
    new InjectManifest({
      swSrc: path.join(__dirname, "user/src/sw.js"),
      swDest: "sw.bundle.js",
      exclude: [/\.map$/, /manifest$/, /\.htaccess$/],
    }),
  ],
})
