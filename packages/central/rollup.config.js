import resolve from "rollup-plugin-node-resolve";
export default [
  {
    input: "src/central.js",
    external: [],
    output: {
      inlineDynamicImports: true,
      file: "lib/central.js",
      format: "es",
    },
    plugins: [resolve()],
  },
];
