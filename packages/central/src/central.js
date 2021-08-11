import { MutableTimestamp, Timestamp } from "./timestamp";
import { v4 } from "uuid";
import webWorkerString from "../lib/sync.js"
import { EVENTS } from "./enum";





class Central {
  static init() {
    const blob = new Blob([webWorkerString]);
    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);

    worker.postMessage(EVENTS.START_SYNC);
    worker.onmessage = (e => console.log('Received Message From Worker', e))
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

export { Central, Clock, Utilities };
