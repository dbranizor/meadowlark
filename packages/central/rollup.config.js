import resolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
export default [
  {
    input: "src/central.js",
    external: [],
    output: {
      file: "lib/central.js",
      format: "ejs",
    },
    plugins: [resolve()],
  },
];
