import Environment from "./environment-state.js";
import { getWorker } from "./datastores.js";
import { EVENTS } from "./enum.js";
import { Timestamp, MutableTimestamp } from "./timestamp.js";
import { objIsEmpty } from "./Utilities.mjs";
let _clock = null;
let _group_id;
let environment;
const unsubscribes = [];

unsubscribes.push(
  Environment.subscribe((e) => {
    environment = e;
    if (!objIsEmpty && e.group_id) {
      _group_id = e.group_id;
    }
  })
);

function setClock(clock) {
  _clock = clock;
}

function getClock() {
  return _clock;
}

async function makeClock(timestamp) {
  getWorker();
  window.worker.postMessage({
    type: EVENTS.GET_MERKLE,
    group_id: environment.group_id,
  });
  return new Promise((res, rej) => {
    window.worker.addEventListener("message", (e) => {
      if (e.data.type === EVENTS.MERKLE) {
        console.log("MERKLE:", e.data.results);
        return res({
          timestamp: MutableTimestamp.from(timestamp),
          merkle: e.data.results,
        });
      }
    });
  });
}

function serializeClock(clock) {
  return JSON.stringify({
    timestamp: clock.timestamp.toString(),
    merkle: clock.merkle,
  });
}

export { setClock, getClock, makeClock, serializeClock };
