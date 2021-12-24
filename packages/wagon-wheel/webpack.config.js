const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const mode = process.env.NODE_ENV || "development";
const prod = mode === "production";

function getConfig(name, entry, html) {
  return {
    name,
    entry,
    mode: "development",
    resolve: {
      alias: {
        svelte: path.dirname(require.resolve("svelte/package.json")),
      },
      extensions: [".dev.js", ".js", ".json", ".wasm", ".svelte"],
      mainFields: ["svelte", "browser", "module", "main"],
      fallback: {
        crypto: false,
        path: false,
        fs: false,
      },
    },
    output: {
      filename: "bundle.js",
      path: path.resolve(__dirname, "public/dist"),
      chunkFilename: "[name].[id].js",
      library: {
        name: "santa-fe",
        type: 'umd'
      }
    },
    module: {
      rules: [
        {
          test: /\.(js)$/,
          exclude: /node_modules/,
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            plugins: ["@babel/transform-runtime"],
          },
        },
        {
          test: /\/worker\.js$/,
          use: { loader: "worker-loader" },
        },
        {
          test: /\.svelte$/,
          use: {
            loader: "svelte-loader",
            options: {
              compilerOptions: {
                dev: !prod,
              },
              emitCss: prod,
              hotReload: !prod,
            },
          },
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
        {
          // required to prevent errors from Svelte on Webpack 5+
          test: /node_modules\/svelte\/.*\.mjs$/,
          resolve: {
            fullySpecified: false,
          },
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: "[name].css",
      }),
    ],
    devServer: {
      hot: true,
    },
  };
}

module.exports = [getConfig("bundle", "./src/main.js", "./public/index.html")];
