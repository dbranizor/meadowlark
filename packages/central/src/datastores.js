import { initBackend } from "absurd-sql/dist/indexeddb-main-thread.js";
import DatastoreState from "./datastore-state.js";
const getWorker = () => {
  if (!window.worker) {
    console.log("dingo how many times does this run getWorker?");
    const newWorker = new Worker(new URL("../lib/sync.js", import.meta.url));
    initBackend(newWorker);
    window.worker = newWorker;
  }
};

const bootstrapAppTables = () => {
  window.worker.postMessage({ type: "ui-invoke", name: "init" });
  getWorker();
  return new Promise((res, rej) => {
    return window.worker.addEventListener("message", function (e) {
      console.log("dingo GM", e);

      if (e.data.type === "initialized") {
        console.log("dingo initialized initial tables");
        return res();
      }
    });
  });
};

const bootstrap = (sch) => {
  let schema = sch;
  Object.keys(sch).forEach((s) => {
    console.log("dingo adding reactive store for schema records", s);
    DatastoreState.addDatastores(s);
  });
  getWorker();
  return new Promise((res, err) => {
    bootstrapAppTables().then(() => {
      console.log("dingo calling ui invoke with schema", schema);
      window.worker.postMessage({
        type: "ui-invoke",
        name: "init",
        arguments: schema,
      });

      return window.worker.addEventListener("message", function (e) {
        console.log("dingo GM", e);
        if (e.data.type === "initialized_database") {
          console.log("dingo initialized database");
          return res();
        }
      });
    });
  });
};

export { bootstrap, getWorker };
