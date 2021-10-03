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
    return (window.worker.onmessage = function (e) {
      if (e.data.type === "initialized_database") {
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

      return (window.worker.onmessage = function (e) {
        console.log(
          "dingo worker event",
          e,
          e.data.type === "initialized_database"
        );
        if (e.data.type === "initialized_database") {
          console.log("dingo initialized database");
          return res();
        }

        if (e.data.type === "applied-messages") {
          console.log("dingo not applying results", e.data);
        }
      });
    });
  });
};

export { bootstrap, getWorker };
