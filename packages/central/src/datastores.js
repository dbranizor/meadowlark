import { initBackend } from "absurd-sql/dist/indexeddb-main-thread.js";
import DatastoreState from "./datastore-state.js";
const getWorker = () => {
  if (!window.worker) {
    const newWorker = new Worker(new URL("../lib/sync.js", import.meta.url));
    initBackend(newWorker);
    window.worker = newWorker;
  }
};

const bootstrap = (sch) => {
  let schema = sch;
  Object.keys(sch).forEach((s) => {
    DatastoreState.addDatastores(s);
  });
  getWorker();
  return new Promise((res, err) => {
    window.worker.postMessage({
      type: "ui-invoke",
      name: "init",
      arguments: schema,
    });

    return window.worker.addEventListener("message", function (e) {
      if (e.data.type === "INITIALIZED_APP") {
        return res();
      }
    });
  });
};

export { bootstrap, getWorker };
