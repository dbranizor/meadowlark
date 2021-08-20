import { MutableTimestamp, Timestamp } from "./timestamp";
import * as merkle from "./merkle";
import webWorkerString from "../lib/sync.js";
import { EVENTS } from "./enum";

class Sync {
  static worker;

  static init(config = { group: 385, syncHost: "localhost:8080", mode: false }) {
    console.log("Creating blob");
    const blob = new Blob([webWorkerString]);
    const workerUrl = URL.createObjectURL(blob);
    console.log("Starting Worker With Blob Again", config);
    this.worker = new Worker(workerUrl);
    this.worker.postMessage({ msg: EVENTS.INIT, payload: config });
    this.worker.postMessage({ msg: EVENTS.ADD_GROUP, payload: config.group });
    this.worker.postMessage({ msg: EVENTS.START_SYNC });
    this.worker.onmessage = (e) => console.log("Received Message From Worker");
  }
  static start() {
    console.log("Started Worker From Client");
    this.worker.postMessage({ msg: EVENTS.START_SYNC });
  }

  static stop() {
    console.log("Stopped Worker From Client");
    this.worker.postMessage({ msg: EVENTS.STOP_SYNC });
  }

  static addGroup(group) {
    this.worker.postMessage({ msg: EVENTS.ADD_GROUP, payload: group });
  }

  static addSchema(schema) {
    console.log("Adding Schema From Client");
    this.worker.postMessage({
      msg: EVENTS.ADD_SCHEMA,
      payload: schema,
    });
  }
}

export { Sync, Timestamp, merkle };