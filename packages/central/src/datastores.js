import { initBackend } from "absurd-sql/dist/indexeddb-main-thread.js";

const getWorker = () => {
  if(!window.worker){
    console.log("dingo how many times does this run getWorker?");
    const newWorker = new Worker(new URL("../lib/sync.js", import.meta.url));
    initBackend(newWorker);
    window.worker = newWorker;
  }

};

const bootstrap = (sch) => {
  let schema = sch;
  getWorker();
  return new Promise((res, err) => {
    window.worker.postMessage({ type: "ui-invoke", name: "init" });
    window.worker.onmessage = function (e) {
      console.log(
        "dingo worker event",
        e,
        e.data.type === "initialized_database"
      );
      if (e.data.type === "initialized_database") {

        console.log("dingo initializing database");
        window.worker.postMessage({
          type: "db-run",
          sql: "select * from messages",
        });
        window.worker.postMessage({
          type: "db-init",
          schema,
        });
        return res;
      }

      if (e.data.type === "applied-messages") {
        console.log("dingo results", e.data);
      }
    };
  });
};





export { bootstrap, getWorker };
