import { Timestamp, MutableTimestamp } from "./timestamp";
let _clock = null;

function setClock(clock) {
  _clock = clock;
}

function getClock() {
  return _clock;
}

function makeClock(timestamp, merkle = {}) {
  return { timestamp: MutableTimestamp.from(timestamp), merkle };
}

function serializeClock(clock) {
  return JSON.stringify({
    timestamp: clock.timestamp.toString(),
    merkle: clock.merkle,
  });
}

export { setClock, getClock, makeClock, serializeClock };
