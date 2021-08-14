import nodeResolve from "rollup-plugin-node-resolve";

export default [
  {
    input: "src/index.js",
    external: [],
    output: {
      file: "lib/common.js",
      format: "esm",
    },
    plugins: [nodeResolve()],
  },
];
