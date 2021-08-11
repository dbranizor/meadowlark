import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { terser } from 'rollup-plugin-terser';
import pkg from "./package.json";
import babel from "rollup-plugin-babel";

export default [
  // browser-friendly UMD build
  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: "src/sync.js",
    external: [],
    output: {
      file: "lib/sync.js",
      format: "esm",
    },
    plugins: [
      resolve(),
      terser({
        warnings: true,
        mangle: {
          module: true,
        },
      }),
      {
        name: 'worker-to-string',
        renderChunk(code) {
          return `export default '${code}';`;
        }
      }
    ]
  },
  {
    input: "src/central.js",
    external: [],
    output: {
      file: "lib/central.js",
      format: "iife",
    }
  },
];
 