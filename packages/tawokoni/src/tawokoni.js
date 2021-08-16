import { wrap } from "comlink";
import { EVENTS } from "../../central/src/enum";

async function init() {
  const worker = new Worker("./worker.js");

  worker.postMessage({ msg: "ADD_GROUP", payload: "beatles" });
}
init();
