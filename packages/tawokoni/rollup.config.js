import nodeResolve from "rollup-plugin-node-resolve";
import OMT from "rollup-plugin-off-main-thread";

export default {
  input: "src/tawokoni.js",
  output: {
    dir: "lib",
    format: "amd",
  },
  plugins: [nodeResolve(), OMT()],
};
