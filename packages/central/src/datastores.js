import { initBackend } from "absurd-sql/dist/indexeddb-main-thread.js";

class WorkerService {
  _worker = false;
  _schema = {};

  get worker() {
    // if (!_worker) {
    //   throw new Error(`Worker Not Instantiated`);
    // }
    return this._worker;
  }

  set worker(w) {
    this._worker = w;
  }

  get schema() {
    return this._schema;
  }

  set schema(s) {
    this._schema = JSON.parse(JSON.stringify(s));
  }
}

const workerService = new WorkerService();

const bootstrap = (sch) => {
  let schema = sch;
  const newWorker = new Worker(new URL("../lib/sync.js", import.meta.url));
  workerService.worker = newWorker;
  workerService.schema = sch;
  console.log(
    "dingo worker being set",
    workerService.schema,
    workerService.worker
  );

  initBackend(workerService.worker);
  workerService.worker.postMessage({ type: "ui-invoke", name: "init" });
  workerService.worker.onmessage = function (e) {
    console.log(
      "dingo worker event",
      e,
      e.data.type === "initialized_database"
    );
    if (e.data.type === "initialized_database") {
      console.log("dingo initializing database");
      workerService.worker.postMessage({
        type: "db-run",
        sql: "select * from messages",
      });
      workerService.worker.postMessage({
        type: "db-init",
        schema,
      });
    }

    if (e.data.type === "applied-messages") {
      console.log("dingo results", e.data);
    }
  };
};

export { bootstrap, workerService };
