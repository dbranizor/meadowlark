import murmur from "murmurhash";

const timestampNumbers = (millis, counter) => !isNaN(millis) && !isNaN(counter);

class Timestamp {
  constructor(millis, counter, node, config = { maxDrift: 60000 }) {
    this._state = {
      millis,
      counter,
      node,
    };
    Object.keys(config).map((key) => (this._state[key] = config[key]));
  }

  valueOf() {
    return this.toString();
  }

  toString() {
    return [
      new Date(this.millis()).toISOString(),
      ("0000" + this.counter().toString(16).toUpperCase()).slice(-4),
      ("0000000000000000" + this.node()).slice(-16),
    ].join("-");
  }
  maxDrift() {
    return this._state.maxDrift;
  }

  millis() {
    return this._state.millis;
  }

  counter() {
    return this._state.counter;
  }

  node() {
    return this._state.node;
  }

  hash() {
    return murmur.v3(this.toString());
  }

  send(clock) {
    console.log("dingo clock?", clock);
    // Retrieve the local wall time
    const phys = Date.now();

    // Unpack the clock.timestamp logical time and counter
    const tOld = clock.timestamp.millis();
    const cOld = clock.timestamp.counter();

    // Calculate the next logical time and the counter.
    /**
     * - Ensure that the logical time never goes backward.
     * - Increment the counter IF the physical time does not advance
     */
    const tNew = Math.max(tOld, phys);
    const cNew = tOld === tNew ? cOld + 1 : 0;

    /** Check the result for drift and counter overflow */
    if (tNew - phys > this.maxDrift()) {
      throw new Timestamp.ClockDriftError(tNew, phys, this.maxDrift());
    }

    if (cNew > 65535) {
      throw new Timestamp.OverflowError();
    }

    // Repack the logical time/counter.
    clock.timestamp.setMillis(tNew);
    clock.timestamp.setCounter(cNew);

    return new Timestamp(
      clock.timestamp.millis(),
      clock.timestamp.counter(),
      clock.timestamp.node()
    );
  }

  recieve(clock, msg) {
    const phys = Date.now();

    // Unpack the message wall time/counter
    const tMsg = msg.millis();
    const cMsg = msg.counter();

    // Assert the node id and remote clock drift
    if (msg.node() === clock.timestamp.node()) {
      throw new Timestamp.DuplicateNodeError(clock.timestamp.node());
    }
    if (tMsg - phys > this.maxDrift) {
      throw new Timestamp.ClockDriftError();
    }

    // Unpack the clock.timestamp logical time and counter
    const tOld = clock.timestamp.millis();
    const cOld = clock.timestamp.counter();

    // Calculate the next logical time and counter.
    // Ensure that the logical time never goes backward;
    // * if all logical clocks are equal, increment the max counter,
    // * if max = old > message, increment local counter,
    // * if max = message > old, increment message counter,
    // * otherwise, clocks are monotonic, reset counter
    const tNew = Math.max(Math.max(tOld, phys), tMsg);
    const cNew =
      tNew === tOld && tNew === tMsg
        ? Math.max(cOld, cMsg) + 1
        : tNew === tOld
        ? cOld + 1
        : tNew === tMsg
        ? cMsg + 1
        : 0;

    // Check the result for drift and counter overflow
    if (tNew - phys > this.maxDrift) {
      throw new Timestamp.ClockDriftError();
    }
    if (cNew > 65535) {
      throw new Timestamp.OverflowError();
    }

    // Repack the logical time/counter
    clock.timestamp.setMillis(tNew);
    clock.timestamp.setCounter(cNew);

    return new Timestamp(
      clock.timestamp.millis(),
      clock.timestamp.counter(),
      clock.timestamp.node()
    );
  }
  /**
   * Converts a fixed-length string timestamp to the structured value.
   * @param {*} timestamp
   */
  parse(timestamp) {
    if (typeof timestamp !== "string") {
      return null;
    }

    const parts = timestamp.split("-");
    if (parts && parts.length === 5) {
      const millis = Date.parse(parts.slice(0, 3).join("-")).valueOf();
      const counter = parseInt(parts[3], 16);
      const node = parts[4];
      if (timestampNumbers(millis, counter)) {
        return new Timestamp(millis, counter, node);
      }
    }
  }

  /**
   *
   * @param {*} isoString
   */
  since(isoString) {
    return isoString + "-0000-0000000000000000";
  }

  static DuplicateNodeError() {
    return class extends Error {
      constructor(node) {
        super();
        this.type = "DuplicateNodeError";
        this.message = "duplicate node identifier " + node;
      }
    };
  }
  static ClockDriftError() {
    return class extends Error {
      constructor(...args) {
        super();
        this.type = "ClockDriftError";
        this.message = ["maximum clock drift exceeded"].concat(args).join(" ");
      }
    };
  }

  static OverflowError() {
    return class extends Error {
      constructor() {
        super();
        this.type = "OverflowError";
        this.message = "timestamp counter overflow";
      }
    };
  }
}

class MutableTimestamp extends Timestamp {
  setMillis(n) {
    this._state.millis = n;
  }

  setCounter(n) {
    this._state.counter = n;
  }

  setNode(n) {
    this._state.node = n;
  }
  from(timestamp) {
    return new MutableTimestamp(
      timestamp.millis(),
      timestamp.counter(),
      timestamp.node()
    );
  }
}

class Central {
  get(string) {
    console.log("dingo dingo murmur", murmur);
    return murmur.v3(string);
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
  static serializeClock(clock) {
    return JSON.stringify({
      timestamp: clock.timestamp.toString(),
      merkle: clock.merkle,
    });
  }

  static deserializeClock(clock) {
    const data = JSON.parse(clock);
    return {
      timestamp: Timestamp.from(Timestamp.parse(data.timestamp)),
      merkle: data.merkle,
    };
  }
  makeClientId() {
    return v4().replace(/-/g, "").slice(-16);
  }
}

export { Central, Timestamp, MutableTimestamp, Clock, Utilities };
