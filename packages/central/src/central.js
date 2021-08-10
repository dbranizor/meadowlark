import { MutableTimestamp, Timestamp } from "./timestamp";
import { v4 } from "uuid";
class Central {
  get(string) {
    return "";
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
