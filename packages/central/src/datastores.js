import { initBackend } from "absurd-sql/dist/indexeddb-main-thread.js";

const getWorker = () => {
  console.log("dingo how many times does this run getWorker?");
  const newWorker = new Worker(new URL("../lib/sync.js", import.meta.url));
  initBackend(newWorker);
  return newWorker;
};

const bootstrap = (sch) => {
  let schema = sch;
  const worker = getWorker();
  return new Promise((res, err) => {
    worker.postMessage({ type: "ui-invoke", name: "init" });
    worker.onmessage = function (e) {
      console.log(
        "dingo worker event",
        e,
        e.data.type === "initialized_database"
      );
      if (e.data.type === "initialized_database") {

        console.log("dingo initializing database");
        worker.postMessage({
          type: "db-run",
          sql: "select * from messages",
        });
        worker.postMessage({
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


const handleWorkerMessages = () => {
  const worker = getWorker();
  
}

export { bootstrap, getWorker };
