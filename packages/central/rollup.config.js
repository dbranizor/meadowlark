import resolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
export default [
  // browser-friendly UMD build
  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: "src/sync/index.js",
    output: {
      globals: {
        'initSqlJs' : 'initSqlJs'
      },
      sourcemap: true,
      file: "lib/sync.js",
      format: "iife",
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
        name: "worker-to-string",
        renderChunk(code) {
          return `export default '${code}'`;
        },
      },
    ],

    external: ['initSqlJs']
  },
  {
    input: "src/central.js",
    external: [],
    output: {
      globals: { "@jlongster/sql.js": "@jlongster/sql.js" },
      file: "lib/central.js",
      format: "cjs",
    },
    plugins: [resolve()],
  },
];
