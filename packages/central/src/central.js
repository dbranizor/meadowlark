import { MutableTimestamp, Timestamp } from "./timestamp";
import { v4 } from "uuid";
import webWorkerString from "../lib/sync.js";
import { EVENTS } from "./enum";

class Sync {
  static worker;
  static init() {
    console.log("Creating blob");
    const blob = new Blob([webWorkerString]);
    const workerUrl = URL.createObjectURL(blob);
    this.worker = new Worker(workerUrl);
    console.log("Started Worker With Blob");
    this.worker.postMessage(EVENTS.START_SYNC);
    this.worker.onmessage = (e) => console.log("Received Message From Worker");
  }
  static start(){
    console.log("Started Worker From Client");
    this.worker.postMessage(EVENTS.START_SYNC);
  }

  static stop(){
    console.log("Stopped Worker From Client");
    this.worker.postMessage(EVENTS.STOP_SYNC);
  }
}
class Clock {
  _clock = {};
  constructor(timestamp, merkle = {}) {
    this._clock = { timestamp: MutableTimestamp.from(timestamp), merkle };
  }
  get clock() {
    return this._clock;
  }
  set clock(clock) {
    this._clock = clock;
  }
}

class Utilities {
  makeClientId() {
    return v4().replace(/-/g, "").slice(-16);
  }
}

export { Sync, Clock, Utilities };
