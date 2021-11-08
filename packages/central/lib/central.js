/**
 *
 * Ecmascript 6 module of gary court's amazing work.
 * I just added the export statement and provided the npm configuration.
 *
 * JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)
 *
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/murmurhash-js
 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 * @see http://sites.google.com/site/murmurhash/
 *
 * @param {string} key ASCII only
 * @param {number} seed Positive integer only
 * @return {number} 32-bit positive integer hash
 */

 function murmurhash3_32_gc(key, seed) {
  var remainder, bytes, h1, h1b, c1, c2, k1, i;

  remainder = key.length & 3; // key.length % 4
  bytes = key.length - remainder;
  h1 = seed;
  c1 = 0xcc9e2d51;
  c2 = 0x1b873593;
  i = 0;

  while (i < bytes) {
    k1 = key.charCodeAt(i) & 0xff | (key.charCodeAt(++i) & 0xff) << 8 | (key.charCodeAt(++i) & 0xff) << 16 | (key.charCodeAt(++i) & 0xff) << 24;
    ++i;

    k1 = (k1 & 0xffff) * c1 + (((k1 >>> 16) * c1 & 0xffff) << 16) & 0xffffffff;
    k1 = k1 << 15 | k1 >>> 17;
    k1 = (k1 & 0xffff) * c2 + (((k1 >>> 16) * c2 & 0xffff) << 16) & 0xffffffff;

    h1 ^= k1;
    h1 = h1 << 13 | h1 >>> 19;
    h1b = (h1 & 0xffff) * 5 + (((h1 >>> 16) * 5 & 0xffff) << 16) & 0xffffffff;
    h1 = (h1b & 0xffff) + 0x6b64 + (((h1b >>> 16) + 0xe654 & 0xffff) << 16);
  }

  k1 = 0;

  switch (remainder) {
    case 3:
      k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
    case 2:
      k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
    case 1:
      k1 ^= key.charCodeAt(i) & 0xff;

      k1 = (k1 & 0xffff) * c1 + (((k1 >>> 16) * c1 & 0xffff) << 16) & 0xffffffff;
      k1 = k1 << 15 | k1 >>> 17;
      k1 = (k1 & 0xffff) * c2 + (((k1 >>> 16) * c2 & 0xffff) << 16) & 0xffffffff;
      h1 ^= k1;
  }

  h1 ^= key.length;

  h1 ^= h1 >>> 16;
  h1 = (h1 & 0xffff) * 0x85ebca6b + (((h1 >>> 16) * 0x85ebca6b & 0xffff) << 16) & 0xffffffff;
  h1 ^= h1 >>> 13;
  h1 = (h1 & 0xffff) * 0xc2b2ae35 + (((h1 >>> 16) * 0xc2b2ae35 & 0xffff) << 16) & 0xffffffff;
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}

const timestampNumbers = (millis, counter) => !isNaN(millis) && !isNaN(counter);
const invalidTimestampString = (timestamp) => typeof timestamp !== "string";
let config = { maxDrift: 60000 };
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
  static maxDrift() {
    return config.maxDrift;
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
    return murmurhash3_32_gc(this.toString());
  }

  static send(clock) {
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

  static receive(clock, msg) {
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

    console.log("dingo setting clock", tNew, cNew);
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

  /**
   *
   * @param {*} isoString
   */
  since(isoString) {
    return isoString + "-0000-0000000000000000";
  }

  static makeClock(timestamp, merkle = {}) {
    return { timestamp: MutableTimestamp.from(timestamp), merkle };
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

  static parse(timestamp) {
    if (invalidTimestampString(timestamp)) {
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

  static from(timestamp) {
    return new MutableTimestamp(
      timestamp.millis(),
      timestamp.counter(),
      timestamp.node()
    );
  }

  static serializeClock(clock) {
    return JSON.stringify({
      timestamp: clock.timestamp.toString(),
      merkle: clock.merkle,
    });
  }

  static from(timestamp) {
    return new MutableTimestamp(
      timestamp.millis(),
      timestamp.counter(),
      timestamp.node()
    );
  }
  static deserializeClock(clock) {
    const data = JSON.parse(clock);
    return {
      timestamp: Timestamp.from(Timestamp.parse(data.timestamp)),
      merkle: data.merkle,
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
}

const getKeys = (trie) => {
  return Object.keys(trie).filter((x) => x !== "hash");
};

const keyToTimestamp = (key) => {
  // 16 is the length of the base 3 value of the current time in
  // minutes. Ensure it's padded to create the full value
  let fullKey = key + "0".repeat(16 - key.length);

  // Parse the base 3 representation
  return parseInt(fullKey, 3) * 1000 * 60;
};

const insertKey = (trie, key, hash) => {
  if (key.length === 0) {
    return trie;
  }
  const c = key[0];
  const n = trie[c] || {};

  return Object.assign({}, trie, {
    [c]: Object.assign({}, n, insertKey(n, key.slice(1), hash), {
      hash: n.hash ^ hash,
    }),
  });
};

/**
 * Inserts base3 key into merkle table
 * @param trie
 * @param timestamp
 */
const insert$1 = (trie, timestamp) => {
  let hash = timestamp.hash();
  let key = Number((timestamp.millis() / 1000 / 60) | 0).toString(3);

  trie = Object.assign({}, trie, { hash: trie.hash ^ hash });
  return insertKey(trie, key, hash);
};

const build = (timestamps) => {
  let trie = {};
  let tTrie = {};
  for (let timestamp of timestamps) {
    tTrie = insert$1(trie, timestamp);
  }

  return tTrie;
};

const diff = (trie1, trie2) => {
  if (trie1.hash === trie2.hash) {
    return null;
  }

  let node1 = trie1;
  let node2 = trie2;
  let k = "";

  while (1) {
    let keySet = new Set([...getKeys(node1), ...getKeys(node2)]);
    let keys = [...keySet.values()];
    keys.sort();
    let diffKey = keys.find((key) => {
      let next1 = node1[key] || {};
      let next2 = node2[key] || {};
      return next1.hash !== next2.hash;
    });

    if (!diffKey) {
      return keyToTimestamp(k);
    }

    k += diffKey;
    node1 = node1[diffKey] || {};
    node2 = node2[diffKey] || {};
  }
};

const prune = (trie, n = 2) => {
  // Do nothing if empty
  if (!trie.hash) {
    return trie;
  }

  let keys = getKeys(trie);
  keys.sort();

  let next = { hash: trie.hash };
  keys = keys.slice(-n).map((k) => (next[k] = prune(trie[k], n)));

  return next;
};

const debug = (trie, k = "", indent = 0) => {
  const str =
    " ".repeat(indent) +
    (k !== "" ? `k: ${k} ` : "") +
    `hash: ${trie.hash || "(empty)"}\n`;

  return (
    str +
    getKeys(trie)
      .map((key) => {
        return debug(trie[key], key, indent + 2);
      })
      .join("")
  );
};

var merkle = /*#__PURE__*/Object.freeze({
  __proto__: null,
  getKeys: getKeys,
  keyToTimestamp: keyToTimestamp,
  insert: insert$1,
  build: build,
  diff: diff,
  prune: prune,
  debug: debug
});

const writable = (initial_value = 0) => {
  let value = initial_value; // content of the store
  let subs = []; // subscriber's handlers

  const subscribe = (handler) => {
    subs = [...subs, handler]; // add handler to the array of subscribers
    handler(value); // call handler with current value
    return () => (subs = subs.filter((sub) => sub !== handler)); // return unsubscribe function
  };

  const set = (new_value) => {
    console.log("dingo store Checking Value", new_value, value);
    if (JSON.stringify(value) === JSON.stringify(new_value)) {
      console.log(
        "dingo currRecords added to store same value NOT",
        new_value,
        value
      );
      return;
    } // same value, exit
    value = new_value; // update value
    console.log("dingo store telling subs value is updated", value);
    subs.forEach((sub) => sub(value)); // update subscribers
  };

  const update = (update_fn) => {
    console.log("dingo updating");
    set(update_fn(value));
  }; // update function

  return { subscribe, set, update }; // store contract
};

const objIsEmpty = (obj) => {
  if (!obj) {
    return null;
  }
  if (Object.keys(obj).length > 0) {
    return false;
  }
  return true;
};
const v4 = () => {
  let s4 = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  };
  //return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  )
    .replace(/-/g, "")
    .slice(-16);
};

const makeClientId = (wDashes = false) => {
  return v4().replace(/-/g, "").slice(-16);
};

const InitEnvironmentState = () => {
  const { set, subscribe, update } = writable({});


  return {
    set,
    subscribe,
    update,
  };
};

const EnvironmentState = InitEnvironmentState();

// The reason for this strange abstraction is because we can't rely on
// nested worker support (Safari doesn't support it). We need to proxy
// creating a child worker through the main thread, and this requires
// a bit of glue code. We don't want to duplicate this code in each
// backend that needs it, so this module abstracts it out. It has to
// have a strange shape because we don't want to eagerly bundle the
// backend code, so users of this code need to pass an `() =>
// import('worker.js')` expression to get the worker module to run.

function isWorker() {
  return (
    typeof WorkerGlobalScope !== 'undefined' &&
    self instanceof WorkerGlobalScope
  );
}

function makeStartWorkerFromMain(getModule) {
  return (argBuffer, resultBuffer, parentWorker) => {
    if (isWorker()) {
      throw new Error(
        '`startWorkerFromMain` should only be called from the main thread'
      );
    }

    if (typeof Worker === 'undefined') {
      // We're on the main thread? Weird: it doesn't have workers
      throw new Error(
        'Web workers not available. sqlite3 requires web workers to work.'
      );
    }

    getModule().then(({ default: BackendWorker }) => {
      let worker = new BackendWorker();

      worker.postMessage({ type: 'init', buffers: [argBuffer, resultBuffer] });

      worker.addEventListener('message', msg => {
        // Forward any messages to the worker that's supposed
        // to be the parent
        parentWorker.postMessage(msg.data);
      });
    });
  };
}

function makeInitBackend(spawnEventName, getModule) {
  const startWorkerFromMain = makeStartWorkerFromMain(getModule);

  return worker => {
    worker.addEventListener('message', e => {
      switch (e.data.type) {
        case spawnEventName:
          startWorkerFromMain(e.data.argBuffer, e.data.resultBuffer, worker);
          break;
      }
    });
  };
}

// Use the generic main thread module to create our indexeddb worker
// proxy
const initBackend = makeInitBackend('__absurd:spawn-idb-worker', () =>
  Promise.resolve().then(function () { return indexeddbMainThreadWorkerE59fee74; })
);

const InitDataStore = () => {
  const { set, update, subscribe } = writable({});

  const methods = {
    addDatastores(schema) {
      if (Array.isArray(schema)) {
        const storeNames = Object.keys(schema).reduce(
          (acc, key) => [...acc, key],
          []
        );
        console.log("Creating Stores", storeNames);
        storeNames.map((st) =>
          update((sch) => {
            sch[st] = [];
            console.log("dingo updating schema single", sch);
            return sch;
          })
        );
      } else {
        update((sch) => {
          sch[schema] = [];
          console.log("dingo updating schema single", sch);
          return sch;
        });
      }
    },
    addRecord(store, record) {
      return update((sch) => {
        console.log(
          "dingo currRecords added to store same value",
          Object.assign(
            { ...sch },
            {
              [store]: [...sch[store], record],
            }
          )
        );
        return Object.assign(
          { ...sch },
          {
            [store]: [...sch[store], record],
          }
        );
      });
    },
  };

  return {
    ...methods,
    set,
    update,
    subscribe,
  };
};

const datastore = InitDataStore();

const getWorker = () => {
  if (!window.worker) {
    console.log("dingo how many times does this run getWorker?");
    const newWorker = new Worker(new URL("../lib/sync.js", import.meta.url));
    initBackend(newWorker);
    window.worker = newWorker;
  }
};

const bootstrap = (sch) => {
  let schema = sch;
  Object.keys(sch).forEach((s) => {
    console.log("dingo adding reactive store for schema records", s);
    datastore.addDatastores(s);
  });
  getWorker();
  return new Promise((res, err) => {
    console.log("dingo calling ui invoke with schema", schema);
    window.worker.postMessage({
      type: "ui-invoke",
      name: "init",
      arguments: schema,
    });

    return window.worker.addEventListener("message", function (e) {
      console.log("dingo GM", e);
      if (e.data.type === "INITIALIZED_APP") {
        console.log("dingo initialized database");
        return res();
      }
    });
  });
};

class EVENTS {
  static APPLY = "APPLY";


  static RUN_INSERT_MESSAGES = "RUN_INSERT_MESSAGES"
  static INSERT_MESSAGE = "INSERT_MESSAGE"

  static RUN_APPLY = "RUN_APPLY";
  static APPLIED = "APPLIED"
  
  static START_SYNC = "START_SYNC";
  static STOP_SYNC = "STOP_SYNC";
  static SELECT_GROUP = "SELECT_GROUP";
  static ADD_GROUP = "ADD_GROUP";
  static ADD_SCHEMA = "ADD_SCHEMA";
  static INIT = "INIT";
  static SEND_MESSAGE = "SEND_MESSAGE";

  static GET_MERKLE = "GET_MERKLE";
  static MERKLE = "MERKLE";


  static GET_MOST_RECENT_LOCAL_MESSAGES = "GET_MOST_RECENT_LOCAL_MESSAGES";
  static MOST_RECENT_LOCAL_MESSAGES = "MOST_RECENT_LOCAL_MESSAGES";
}

let _clock = null;
let environment$2;
const unsubscribes$1 = [];

unsubscribes$1.push(
  EnvironmentState.subscribe((e) => {
    environment$2 = e;
    console.log("dingo got environment --> !!", e, e.group_id);
    if (!objIsEmpty && e.group_id) {
      console.log("dingo setting groupID", e.group_id);
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
    group_id: environment$2.group_id,
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

const initMessageState = () => {
  const { set, subscribe, update } = writable([]);
  const methods = {
    add(message) {
      update((messages) => [...messages, message]);
    },
    remove(message) {
      update((messages) =>
        messages.filter(
          (m) =>
            m.row !== message.row &&
            m.column !== message.column &&
            message.dataset !== m.dataset
        )
      );
    },
  };

  return {
    ...methods,
    set,
    subscribe,
    update,
  };
};

const MessageState = initMessageState();

let environment$1 = {};
let unsubscribes = [];
unsubscribes.push(
  EnvironmentState.subscribe((e) => (environment$1 = e)),
  MessageState.subscribe((m) => (m))
);

const handleApplyMessage = async (messages) => {
  return new Promise((res, rej) => {
    getWorker();
    console.log("dingo running apply ", messages);
    window.worker.postMessage({ type: EVENTS.RUN_APPLY, messages: messages });
    window.worker.addEventListener("message", (e) => {
      console.log("dingo GM", e);
      if (e.data.type === EVENTS.APPLIED) {
        console.log("dingo GMA", e);
        res(true);
      }
    });
  });
};

function serializeValue(value) {
  if (value === null) {
    return "0:";
  } else if (typeof value === "number") {
    return "N:" + value;
  } else if (typeof value === "string") {
    return "S:" + value;
  }

  throw new Error("Unserializable value type: " + JSON.stringify(value));
}

function deserializeValue(value) {
  const type = value[0];
  switch (type) {
    case "0":
      return null;
    case "N":
      return parseFloat(value.slice(2));
    case "S":
      return value.slice(2);
  }

  throw new Error("Invalid type key for value: " + value);
}

// 121
/**
 * Apply the data operation contained in a message to our local data store
 * (i.e., set a new property value for a secified dataset/table/row/column).
 */
const apply = async (messages) => {
  getWorker();
  if (!window.worker) {
    console.error("dingo no worker", worker, newSecret(), newSecret());
    throw new Error(`Error: No Worker`);
  }

  await handleApplyMessage(messages);
  return true;
};

async function post(data) {
  console.log("diongo running fetch", environment$1, environment$1.user_id);
  let res = await fetch(`${environment$1.sync_url}/sync`, {
    method: "POST",
    mode: "cors",
    credentials: "same-origin",
    redirect: "follow",
    referrerPolicy: "no-referrer",
    body: JSON.stringify(data),
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      authorization: environment$1.user_id,
    },
  });
  res = await res.json();

  if (res.status !== "ok") {
    throw new Error("API error: " + res.reason);
  }
  return res.data;
}

function getMatchingLocalMessage(message) {
  getWorker();
  return new Promise((res, rej) => {
    window.worker.postMessage({
      type: EVENTS.GET_MOST_RECENT_LOCAL_MESSAGES,
      message,
    });
    window.worker.addEventListener("message", (e) => {
      if (e.data.type === EVENTS.MOST_RECENT_LOCAL_MESSAGES) {
        console.log("DINGO!!!!!!!MATCHINGLOCALMESSAGE!!!", e, e.data);
        return res(e.data.results);
      }
    });
  });
}

async function mapIncomingToLocalMessagesForField(incomingMessages) {
  const incomingFieldMsgToLocalFieldMsgMap = await incomingMessages.reduce(
    async (acc, curr) => {
      const map = await acc;

      // Attempt to find the most recent local message for the same field as the
      // current incoming message (note that find() can return `undefined` if no
      // match is found).
      const mostRecentLocalMsg = await getMatchingLocalMessage(curr);
      // Note that the incoming message OBJECT is being used as a key here
      // (something you couldn't do if an Object were used insteaad of a Map)
      map.set(curr, mostRecentLocalMsg);
      return map;
    },
    Promise.resolve(new Map())
  );

  return incomingFieldMsgToLocalFieldMsgMap;
}

async function handleInsertMessages(message) {
  return new Promise((res, rej) => {
    window.worker.postMessage({
      type: EVENTS.RUN_INSERT_MESSAGES,
      message,
      group_id: environment$1.group_id,
    });
    window.worker.addEventListener("message", (e) => {
      console.log("dingo GM", e);
      if (e.data.type === EVENTS.INSERT_MESSAGE) {
        return res(true);
      }
    });
  });
}

let _apply;
function registerApply(callback) {
  _apply = callback;
}
async function applyMessages(incomingMessages) {
  let incomingToLocalMsgsForField = await mapIncomingToLocalMessagesForField(
    incomingMessages
  );
  let clock = getClock();
  let messages = [];
  let appliedMessages = [];
  // Look at each incoming message. If it's new to us (i.e., we don't have it in
  // our local store), or is newer than the message we have for the same field
  // (i.e., dataset + row + column), then apply it to our local data store and
  // insert it into our local collection of messages and merkle tree (which is
  // basically a specialized index of those messages).
  await incomingMessages.reduce(async (acc, incomingMsgForField) => {
    const prevAcc = await acc;
    // `incomingToLocalMsgsForField` is a Map instance, which means objects
    // can be used as keys. If this is the first time we've encountered the
    // message, then we won't have a _local_ version in the Map and `.get()`
    // will return `undefined`.
    let mostRecentLocalMsgForField =
      incomingToLocalMsgsForField.get(incomingMsgForField);

    // If there is no corresponding local message (i.e., this is a "new" /
    // unknown incoming message), OR the incoming message is "newer" than the
    // one we have, apply the incoming message to our local data store.
    //
    // Note that althought `.timestamp` references an object (i.e., an instance
    // of Timestamp), the JS engine is going to implicitly call the instance's
    // `.valueOf()` method when doing these comparisons. The Timestamp class has
    // a custom implementation of valueOf() that retuns a string. So, in effect,
    // comparing timestamps below is comparing the toString() value of the
    // Timestamp objects.

    console.log("dingo applying?");
    if (
      !mostRecentLocalMsgForField ||
      mostRecentLocalMsgForField.timestamp < incomingMsgForField.timestamp
    ) {
      // `apply()` means that we're going to actually update our local data
      // store with the operation contained in the message.
      appliedMessages = [...appliedMessages, incomingMsgForField];
    } else {
      console.log(
        "dingo not applying?",
        mostRecentLocalMsgForField,
        mostRecentLocalMsgForField,
        incomingMsgForField
      );
    }

    // If this is a new message that we don't have locally (i.e., we didn't find
    // a corresponding local message for the same dataset/row/column OR we did
    // but it has a different timestamp than ours), we need to add it to our
    // axfrray of local messages and update the merkle tree.
    if (
      !mostRecentLocalMsgForField ||
      mostRecentLocalMsgForField.timestamp !== incomingMsgForField.timestamp
    ) {
      clock.merkle = insert$1(
        clock.merkle,
        Timestamp.parse(incomingMsgForField.timestamp)
      );

      // Add the message to our collection...
      // _messages.push(incomingMsgForField);
      messages.push(incomingMsgForField);
    }
    return prevAcc;
  }, Promise.resolve());
  await apply(appliedMessages);
  await handleInsertMessages(messages);
  return _apply && _apply();
}
async function receiveMessages(messages = []) {
  messages.forEach((msg) => {
    Timestamp.receive(getClock(), Timestamp.parse(msg.timestamp));
  });
  await applyMessages(messages);
}

async function getSortedMessages() {
  return new Promise((res, rej) => {
    window.worker.postMessage({ type: "db-sorted-messages" });
    window.worker.addEventListener("message", (e) => {
      if (e.data.type === "sorted-messages") {
        const messages = e.data.sortedMessages;
        console.log('"DINGO SORTED MESSAGES!!!', messages);
        res(messages);
      }
    });
  });
}

async function sync(initialMessages = [], since = null) {
  console.log("dingo running sync", environment$1);
  if (environment$1.syncDisabled) {
    return;
  }

  if (since) {
    let timestamp = new Timestamp(since, 0, "0").toString();
    let sortedMessages = await getSortedMessages();
    sortedMessages.filter((msg) => msg.timestamp >= timestamp);
  }

  let result;
  try {
    result = await post({
      group_id: environment$1.group_id,
      client_id: getClock().timestamp.node(),
      messages: initialMessages.map((m) => ({
        ...m,
        value: deserializeValue(m.value),
      })),
      merkle: getClock().merkle,
    });
  } catch (e) {
    throw new Error("network-failure");
  }

  console.log(
    `RESULTS Merkle: ${result.messages.length} ${result.merkle.hash || false}`
  );

  if (result.messages.length > 0) {
    receiveMessages(
      result.messages.map((m) => ({ ...m, value: serializeValue(m.value) }))
    );
  }

  let diffTime = diff(result.merkle, getClock().merkle);

  if (diffTime) {
    if (since && since === diffTime) {
      throw new Error(
        "A bug happened while syncing and the client " +
          "was unable to get in sync with the server. " +
          "This is an internal error that shouldn't happen"
      );
    }
    return sync([], diffTime);
  }
}

const buildSchema = (data) => {
  return Object.keys(data).reduce((acc, curr) => {
    console.log("dingo building data $$$$$ &&&*& ", data, curr);
    const tableNames = Object.keys(data[curr]);
    const tableValues = Object.values(data[curr]);
    const statement = tableNames.reduce((acc, scurr, ix) => {
      if (ix === 0) {
        acc = `CREATE TABLE IF NOT EXISTS ${curr} (tombstone integer,`;
      }

      if (ix === tableNames.length - 1) {
        acc = `${acc} ${scurr} ${tableValues[ix]})`;
      } else {
        acc = `${acc} ${scurr} ${tableValues[ix]},`;
      }

      return acc;
    }, "");
    acc[curr] = statement;
    return acc;
  }, {});
};

const insert = async (table, row) => {
  const id = makeClientId(true);
  const fields = Object.keys(row);

  const messages = [
    ...fields.map((k) => {
      return {
        id: makeClientId(),
        dataset: table,
        row: row.id || id,
        column: k,
        value: serializeValue(row[k]),
        timestamp: Timestamp.send(getClock()).toString(),
      };
    }),
  ];

  console.log("dingo calling apply on new messages", messages);

  sendMessages(messages);

  return id;
  // console.log("dingo object", messages);
  // messages.forEach((m) => {
  // const sql = `INSERT INTO messages (dataset, row, column, value, timestamp) VALUES ('${m.dataset}', '${m.row}', '${m.column}', '${m.value}', '${m.timestamp}')`;
  // window.worker.postMessage({ type: "db-run", sql });
  // });
};

const sendMessages = (messages) => {
  applyMessages(messages).then(() => sync(messages));
};

const initMessageBus = () => {
  const { set, update, subscribe } = writable({});
  const methods = {
    publish(message) {
      set(message);
    },
  };
  return {
    set,
    update,
    subscribe,
    ...methods,
  };
};

const messageBus = initMessageBus();

const startDatabase = async () => {
  getWorker();
  return new Promise((res, rej) => {
    window.worker.postMessage({type: "INIT_DATABASE"});
    window.worker.addEventListener("message", (e) => {
      if(e.data.type === "INITIALIZED_DB"){
        return res(true)
      }
    });
  })
};
const startClock = async () => {
  const c = await makeClock(new Timestamp(0, 0, makeClientId(true)));
  return setClock(c);
};
  
let environment = {};

const setEnvironment = (e) => {
  console.log("dingo env", e, environment);
  EnvironmentState.set(e);
  // Environment.update((env) => {
  //   const oldEnv = JSON.parse(JSON.stringify(env));
  //   const newEnv = Object.assign(oldEnv, { ...e });
  //   console.log("dingo new Env dingo currRecords added to store same", oldEnv, newEnv);
  //   return newEnv;
  // });
};
EnvironmentState.subscribe((env) => (environment = env));

let syncInterval;
function startSync() {
  syncInterval = setInterval(async () => {
    try {
      console.log("dingo Running Sync");
      await sync();
      EnvironmentState.update((env) => Object.assign(env, { isOffline: false }));
    } catch (e) {
      if (e.message === "network-failure") {
        EnvironmentState.update((env) => Object.assign(env, { isOffline: true }));
      } else {
        throw e;
      }
    }
    // TODO: Make this configurable
  }, 4000);
}

function stopSync() {
  clearInterval(syncInterval);
}

function select(sql) {
  return new Promise((res, rej) => {
    console.log("dingo selecting", sql, window.worker);
    window.worker.postMessage({ type: "SELECT_ALL", sql });
    window.worker.addEventListener("message", function (e) {
      if (e.data.type === "SELECT") {
        console.log("dingo GM", e);
        console.log("dingo selecting results", e.data, e.data.results);
        return res(e.data.results);
      }
    });
  });
}

function decodeBase64(base64, enableUnicode) {
    var binaryString = atob(base64);
    if (enableUnicode) {
        var binaryView = new Uint8Array(binaryString.length);
        for (var i = 0, n = binaryString.length; i < n; ++i) {
            binaryView[i] = binaryString.charCodeAt(i);
        }
        return String.fromCharCode.apply(null, new Uint16Array(binaryView.buffer));
    }
    return binaryString;
}

function createURL(base64, sourcemapArg, enableUnicodeArg) {
    var sourcemap = sourcemapArg === undefined ? null : sourcemapArg;
    var enableUnicode = enableUnicodeArg === undefined ? false : enableUnicodeArg;
    var source = decodeBase64(base64, enableUnicode);
    var start = source.indexOf('\n', 10) + 1;
    var body = source.substring(start) + (sourcemap ? '\/\/# sourceMappingURL=' + sourcemap : '');
    var blob = new Blob([body], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
}

function createBase64WorkerFactory(base64, sourcemapArg, enableUnicodeArg) {
    var url;
    return function WorkerFactory(options) {
        url = url || createURL(base64, sourcemapArg, enableUnicodeArg);
        return new Worker(url, options);
    };
}

var WorkerFactory = createBase64WorkerFactory('Lyogcm9sbHVwLXBsdWdpbi13ZWItd29ya2VyLWxvYWRlciAqLwohZnVuY3Rpb24oKXsidXNlIHN0cmljdCI7bGV0IHQ9MzczNTkyODU1OTtjbGFzcyBle2NvbnN0cnVjdG9yKHQse2luaXRpYWxPZmZzZXQ6ZT00LHVzZUF0b21pY3M6aT0hMCxzdHJlYW06cz0hMCxkZWJ1ZzpyLG5hbWU6bn09e30pe3RoaXMuYnVmZmVyPXQsdGhpcy5hdG9taWNWaWV3PW5ldyBJbnQzMkFycmF5KHQpLHRoaXMub2Zmc2V0PWUsdGhpcy51c2VBdG9taWNzPWksdGhpcy5zdHJlYW09cyx0aGlzLmRlYnVnPXIsdGhpcy5uYW1lPW59bG9nKC4uLnQpe3RoaXMuZGVidWcmJmNvbnNvbGUubG9nKGBbcmVhZGVyOiAke3RoaXMubmFtZX1dYCwuLi50KX13YWl0V3JpdGUodCxlPW51bGwpe2lmKHRoaXMudXNlQXRvbWljcyl7Zm9yKHRoaXMubG9nKGB3YWl0aW5nIGZvciAke3R9YCk7MD09PUF0b21pY3MubG9hZCh0aGlzLmF0b21pY1ZpZXcsMCk7KXtpZihudWxsIT1lJiYidGltZWQtb3V0Ij09PUF0b21pY3Mud2FpdCh0aGlzLmF0b21pY1ZpZXcsMCwwLGUpKXRocm93IG5ldyBFcnJvcigidGltZW91dCIpO0F0b21pY3Mud2FpdCh0aGlzLmF0b21pY1ZpZXcsMCwwLDUwMCl9dGhpcy5sb2coYHJlc3VtZWQgZm9yICR7dH1gKX1lbHNlIGlmKDEhPT10aGlzLmF0b21pY1ZpZXdbMF0pdGhyb3cgbmV3IEVycm9yKCJgd2FpdFdyaXRlYCBleHBlY3RlZCBhcnJheSB0byBiZSByZWFkYWJsZSIpfWZsaXAoKXtpZih0aGlzLmxvZygiZmxpcCIpLHRoaXMudXNlQXRvbWljcyl7aWYoMSE9PUF0b21pY3MuY29tcGFyZUV4Y2hhbmdlKHRoaXMuYXRvbWljVmlldywwLDEsMCkpdGhyb3cgbmV3IEVycm9yKCJSZWFkIGRhdGEgb3V0IG9mIHN5bmMhIFRoaXMgaXMgZGlzYXN0cm91cyIpO0F0b21pY3Mubm90aWZ5KHRoaXMuYXRvbWljVmlldywwKX1lbHNlIHRoaXMuYXRvbWljVmlld1swXT0wO3RoaXMub2Zmc2V0PTR9ZG9uZSgpe3RoaXMud2FpdFdyaXRlKCJkb25lIik7bGV0IGU9bmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLHRoaXMub2Zmc2V0KS5nZXRVaW50MzIoMCk9PT10O3JldHVybiBlJiYodGhpcy5sb2coImRvbmUiKSx0aGlzLmZsaXAoKSksZX1wZWVrKHQpe3RoaXMucGVla09mZnNldD10aGlzLm9mZnNldDtsZXQgZT10KCk7cmV0dXJuIHRoaXMub2Zmc2V0PXRoaXMucGVla09mZnNldCx0aGlzLnBlZWtPZmZzZXQ9bnVsbCxlfXN0cmluZyh0KXt0aGlzLndhaXRXcml0ZSgic3RyaW5nIix0KTtsZXQgZT10aGlzLl9pbnQzMigpLGk9ZS8yLHM9bmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLHRoaXMub2Zmc2V0LGUpLHI9W107Zm9yKGxldCB0PTA7dDxpO3QrKylyLnB1c2gocy5nZXRVaW50MTYoMip0KSk7bGV0IG49U3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLHIpO3JldHVybiB0aGlzLmxvZygic3RyaW5nIixuKSx0aGlzLm9mZnNldCs9ZSxudWxsPT10aGlzLnBlZWtPZmZzZXQmJnRoaXMuZmxpcCgpLG59X2ludDMyKCl7bGV0IHQ9bmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLHRoaXMub2Zmc2V0KS5nZXRJbnQzMigpO3JldHVybiB0aGlzLmxvZygiX2ludDMyIix0KSx0aGlzLm9mZnNldCs9NCx0fWludDMyKCl7dGhpcy53YWl0V3JpdGUoImludDMyIik7bGV0IHQ9dGhpcy5faW50MzIoKTtyZXR1cm4gdGhpcy5sb2coImludDMyIix0KSxudWxsPT10aGlzLnBlZWtPZmZzZXQmJnRoaXMuZmxpcCgpLHR9Ynl0ZXMoKXt0aGlzLndhaXRXcml0ZSgiYnl0ZXMiKTtsZXQgdD10aGlzLl9pbnQzMigpLGU9bmV3IEFycmF5QnVmZmVyKHQpO3JldHVybiBuZXcgVWludDhBcnJheShlKS5zZXQobmV3IFVpbnQ4QXJyYXkodGhpcy5idWZmZXIsdGhpcy5vZmZzZXQsdCkpLHRoaXMubG9nKCJieXRlcyIsZSksdGhpcy5vZmZzZXQrPXQsbnVsbD09dGhpcy5wZWVrT2Zmc2V0JiZ0aGlzLmZsaXAoKSxlfX1jbGFzcyBpe2NvbnN0cnVjdG9yKHQse2luaXRpYWxPZmZzZXQ6ZT00LHVzZUF0b21pY3M6aT0hMCxzdHJlYW06cz0hMCxkZWJ1ZzpyLG5hbWU6bn09e30pe3RoaXMuYnVmZmVyPXQsdGhpcy5hdG9taWNWaWV3PW5ldyBJbnQzMkFycmF5KHQpLHRoaXMub2Zmc2V0PWUsdGhpcy51c2VBdG9taWNzPWksdGhpcy5zdHJlYW09cyx0aGlzLmRlYnVnPXIsdGhpcy5uYW1lPW4sdGhpcy51c2VBdG9taWNzP0F0b21pY3Muc3RvcmUodGhpcy5hdG9taWNWaWV3LDAsMCk6dGhpcy5hdG9taWNWaWV3WzBdPTB9bG9nKC4uLnQpe3RoaXMuZGVidWcmJmNvbnNvbGUubG9nKGBbd3JpdGVyOiAke3RoaXMubmFtZX1dYCwuLi50KX13YWl0UmVhZCh0KXtpZih0aGlzLnVzZUF0b21pY3Mpe2lmKHRoaXMubG9nKGB3YWl0aW5nIGZvciAke3R9YCksMCE9PUF0b21pY3MuY29tcGFyZUV4Y2hhbmdlKHRoaXMuYXRvbWljVmlldywwLDAsMSkpdGhyb3cgbmV3IEVycm9yKCJXcm90ZSBzb21ldGhpbmcgaW50byB1bndyaXRhYmxlIGJ1ZmZlciEgVGhpcyBpcyBkaXNhc3Ryb3VzIik7Zm9yKEF0b21pY3Mubm90aWZ5KHRoaXMuYXRvbWljVmlldywwKTsxPT09QXRvbWljcy5sb2FkKHRoaXMuYXRvbWljVmlldywwKTspQXRvbWljcy53YWl0KHRoaXMuYXRvbWljVmlldywwLDEsNTAwKTt0aGlzLmxvZyhgcmVzdW1lZCBmb3IgJHt0fWApfWVsc2UgdGhpcy5hdG9taWNWaWV3WzBdPTE7dGhpcy5vZmZzZXQ9NH1maW5hbGl6ZSgpe3RoaXMubG9nKCJmaW5hbGl6aW5nIiksbmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLHRoaXMub2Zmc2V0KS5zZXRVaW50MzIoMCx0KSx0aGlzLndhaXRSZWFkKCJmaW5hbGl6ZSIpfXN0cmluZyh0KXt0aGlzLmxvZygic3RyaW5nIix0KTtsZXQgZT0yKnQubGVuZ3RoO3RoaXMuX2ludDMyKGUpO2xldCBpPW5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlcix0aGlzLm9mZnNldCxlKTtmb3IobGV0IGU9MDtlPHQubGVuZ3RoO2UrKylpLnNldFVpbnQxNigyKmUsdC5jaGFyQ29kZUF0KGUpKTt0aGlzLm9mZnNldCs9ZSx0aGlzLndhaXRSZWFkKCJzdHJpbmciKX1faW50MzIodCl7bmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLHRoaXMub2Zmc2V0KS5zZXRJbnQzMigwLHQpLHRoaXMub2Zmc2V0Kz00fWludDMyKHQpe3RoaXMubG9nKCJpbnQzMiIsdCksdGhpcy5faW50MzIodCksdGhpcy53YWl0UmVhZCgiaW50MzIiKX1ieXRlcyh0KXt0aGlzLmxvZygiYnl0ZXMiLHQpO2xldCBlPXQuYnl0ZUxlbmd0aDt0aGlzLl9pbnQzMihlKSxuZXcgVWludDhBcnJheSh0aGlzLmJ1ZmZlcix0aGlzLm9mZnNldCkuc2V0KG5ldyBVaW50OEFycmF5KHQpKSx0aGlzLm9mZnNldCs9ZSx0aGlzLndhaXRSZWFkKCJieXRlcyIpfX1sZXQgcz0wLHI9MSxuPTIsbz00O2xldCBhPS9eKCg/IWNocm9tZXxhbmRyb2lkKS4pKnNhZmFyaS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCksbD1uZXcgTWFwLGM9bmV3IE1hcDtmdW5jdGlvbiBoKHQsZSl7aWYoIXQpdGhyb3cgbmV3IEVycm9yKGUpfWNsYXNzIGZ7Y29uc3RydWN0b3IodCxlPSJyZWFkb25seSIpe3RoaXMuZGI9dCx0aGlzLnRyYW5zPXRoaXMuZGIudHJhbnNhY3Rpb24oWyJkYXRhIl0sZSksdGhpcy5zdG9yZT10aGlzLnRyYW5zLm9iamVjdFN0b3JlKCJkYXRhIiksdGhpcy5sb2NrVHlwZT0icmVhZG9ubHkiPT09ZT9yOm8sdGhpcy5jYWNoZWRGaXJzdEJsb2NrPW51bGwsdGhpcy5jdXJzb3I9bnVsbCx0aGlzLnByZXZSZWFkcz1udWxsfWFzeW5jIHByZWZldGNoRmlyc3RCbG9jayh0KXtsZXQgZT1hd2FpdCB0aGlzLmdldCgwKTtyZXR1cm4gdGhpcy5jYWNoZWRGaXJzdEJsb2NrPWUsZX1hc3luYyB3YWl0Q29tcGxldGUoKXtyZXR1cm4gbmV3IFByb21pc2UoKCh0LGUpPT57dGhpcy5jb21taXQoKSx0aGlzLmxvY2tUeXBlPT09bz8odGhpcy50cmFucy5vbmNvbXBsZXRlPWU9PnQoKSx0aGlzLnRyYW5zLm9uZXJyb3I9dD0+ZSh0KSk6YT90aGlzLnRyYW5zLm9uY29tcGxldGU9ZT0+dCgpOnQoKX0pKX1jb21taXQoKXt0aGlzLnRyYW5zLmNvbW1pdCYmdGhpcy50cmFucy5jb21taXQoKX1hc3luYyB1cGdyYWRlRXhjbHVzaXZlKCl7dGhpcy5jb21taXQoKSx0aGlzLnRyYW5zPXRoaXMuZGIudHJhbnNhY3Rpb24oWyJkYXRhIl0sInJlYWR3cml0ZSIpLHRoaXMuc3RvcmU9dGhpcy50cmFucy5vYmplY3RTdG9yZSgiZGF0YSIpLHRoaXMubG9ja1R5cGU9bztsZXQgdD10aGlzLmNhY2hlZEZpcnN0QmxvY2s7cmV0dXJuIGZ1bmN0aW9uKHQsZSl7aWYobnVsbCE9dCYmbnVsbCE9ZSl7bGV0IGk9bmV3IFVpbnQ4QXJyYXkodCkscz1uZXcgVWludDhBcnJheShlKTtmb3IobGV0IHQ9MjQ7dDw0MDt0KyspaWYoaVt0XSE9PXNbdF0pcmV0dXJuITE7cmV0dXJuITB9cmV0dXJuIG51bGw9PXQmJm51bGw9PWV9KGF3YWl0IHRoaXMucHJlZmV0Y2hGaXJzdEJsb2NrKDUwMCksdCl9ZG93bmdyYWRlU2hhcmVkKCl7dGhpcy5jb21taXQoKSx0aGlzLnRyYW5zPXRoaXMuZGIudHJhbnNhY3Rpb24oWyJkYXRhIl0sInJlYWRvbmx5IiksdGhpcy5zdG9yZT10aGlzLnRyYW5zLm9iamVjdFN0b3JlKCJkYXRhIiksdGhpcy5sb2NrVHlwZT1yfWFzeW5jIGdldCh0KXtyZXR1cm4gbmV3IFByb21pc2UoKChlLGkpPT57bGV0IHM9dGhpcy5zdG9yZS5nZXQodCk7cy5vbnN1Y2Nlc3M9dD0+e2Uocy5yZXN1bHQpfSxzLm9uZXJyb3I9dD0+aSh0KX0pKX1nZXRSZWFkRGlyZWN0aW9uKCl7bGV0IHQ9dGhpcy5wcmV2UmVhZHM7aWYodCl7aWYodFswXTx0WzFdJiZ0WzFdPHRbMl0mJnRbMl0tdFswXTwxMClyZXR1cm4ibmV4dCI7aWYodFswXT50WzFdJiZ0WzFdPnRbMl0mJnRbMF0tdFsyXTwxMClyZXR1cm4icHJldiJ9cmV0dXJuIG51bGx9cmVhZCh0KXtsZXQgZT0oKT0+bmV3IFByb21pc2UoKCh0LGUpPT57aWYobnVsbCE9dGhpcy5jdXJzb3JQcm9taXNlKXRocm93IG5ldyBFcnJvcigid2FpdEN1cnNvcigpIGNhbGxlZCBidXQgc29tZXRoaW5nIGVsc2UgaXMgYWxyZWFkeSB3YWl0aW5nIik7dGhpcy5jdXJzb3JQcm9taXNlPXtyZXNvbHZlOnQscmVqZWN0OmV9fSkpO2lmKHRoaXMuY3Vyc29yKXtsZXQgaT10aGlzLmN1cnNvcjtyZXR1cm4ibmV4dCI9PT1pLmRpcmVjdGlvbiYmdD5pLmtleSYmdDxpLmtleSsxMDA/KGkuYWR2YW5jZSh0LWkua2V5KSxlKCkpOiJwcmV2Ij09PWkuZGlyZWN0aW9uJiZ0PGkua2V5JiZ0Pmkua2V5LTEwMD8oaS5hZHZhbmNlKGkua2V5LXQpLGUoKSk6KHRoaXMuY3Vyc29yPW51bGwsdGhpcy5yZWFkKHQpKX17bGV0IGk9dGhpcy5nZXRSZWFkRGlyZWN0aW9uKCk7aWYoaSl7bGV0IHM7dGhpcy5wcmV2UmVhZHM9bnVsbCxzPSJwcmV2Ij09PWk/SURCS2V5UmFuZ2UudXBwZXJCb3VuZCh0KTpJREJLZXlSYW5nZS5sb3dlckJvdW5kKHQpO2xldCByPXRoaXMuc3RvcmUub3BlbkN1cnNvcihzLGkpO3JldHVybiByLm9uc3VjY2Vzcz10PT57bGV0IGU9dC50YXJnZXQucmVzdWx0O2lmKHRoaXMuY3Vyc29yPWUsbnVsbD09dGhpcy5jdXJzb3JQcm9taXNlKXRocm93IG5ldyBFcnJvcigiR290IGRhdGEgZnJvbSBjdXJzb3IgYnV0IG5vdGhpbmcgaXMgd2FpdGluZyBpdCIpO3RoaXMuY3Vyc29yUHJvbWlzZS5yZXNvbHZlKGU/ZS52YWx1ZTpudWxsKSx0aGlzLmN1cnNvclByb21pc2U9bnVsbH0sci5vbmVycm9yPXQ9PntpZihjb25zb2xlLmxvZygiQ3Vyc29yIGZhaWx1cmU6Iix0KSxudWxsPT10aGlzLmN1cnNvclByb21pc2UpdGhyb3cgbmV3IEVycm9yKCJHb3QgZGF0YSBmcm9tIGN1cnNvciBidXQgbm90aGluZyBpcyB3YWl0aW5nIGl0Iik7dGhpcy5jdXJzb3JQcm9taXNlLnJlamVjdCh0KSx0aGlzLmN1cnNvclByb21pc2U9bnVsbH0sZSgpfXJldHVybiBudWxsPT10aGlzLnByZXZSZWFkcyYmKHRoaXMucHJldlJlYWRzPVswLDAsMF0pLHRoaXMucHJldlJlYWRzLnB1c2godCksdGhpcy5wcmV2UmVhZHMuc2hpZnQoKSx0aGlzLmdldCh0KX19YXN5bmMgc2V0KHQpe3JldHVybiB0aGlzLnByZXZSZWFkcz1udWxsLG5ldyBQcm9taXNlKCgoZSxpKT0+e2xldCBzPXRoaXMuc3RvcmUucHV0KHQudmFsdWUsdC5rZXkpO3Mub25zdWNjZXNzPXQ9PmUocy5yZXN1bHQpLHMub25lcnJvcj10PT5pKHQpfSkpfWFzeW5jIGJ1bGtTZXQodCl7dGhpcy5wcmV2UmVhZHM9bnVsbDtmb3IobGV0IGUgb2YgdCl0aGlzLnN0b3JlLnB1dChlLnZhbHVlLGUua2V5KX19YXN5bmMgZnVuY3Rpb24gdSh0KXtyZXR1cm4gbmV3IFByb21pc2UoKChlLGkpPT57aWYobC5nZXQodCkpcmV0dXJuIHZvaWQgZShsLmdldCh0KSk7bGV0IHM9Z2xvYmFsVGhpcy5pbmRleGVkREIub3Blbih0LDIpO3Mub25zdWNjZXNzPWk9PntsZXQgcz1pLnRhcmdldC5yZXN1bHQ7cy5vbnZlcnNpb25jaGFuZ2U9KCk9Pntjb25zb2xlLmxvZygiY2xvc2luZyBiZWNhdXNlIHZlcnNpb24gY2hhbmdlZCIpLHMuY2xvc2UoKSxsLmRlbGV0ZSh0KX0scy5vbmNsb3NlPSgpPT57bC5kZWxldGUodCl9LGwuc2V0KHQscyksZShzKX0scy5vbnVwZ3JhZGVuZWVkZWQ9dD0+e2xldCBlPXQudGFyZ2V0LnJlc3VsdDtlLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoImRhdGEiKXx8ZS5jcmVhdGVPYmplY3RTdG9yZSgiZGF0YSIpfSxzLm9uYmxvY2tlZD10PT5jb25zb2xlLmxvZygiYmxvY2tlZCIsdCkscy5vbmVycm9yPXMub25hYm9ydD10PT5pKHQudGFyZ2V0LmVycm9yKX0pKX1hc3luYyBmdW5jdGlvbiB3KHQsZSxpKXtsZXQgcz1jLmdldCh0KTtpZihzKXtpZigicmVhZHdyaXRlIj09PWUmJnMubG9ja1R5cGU9PT1yKXRocm93IG5ldyBFcnJvcigiQXR0ZW1wdGVkIHdyaXRlIGJ1dCBvbmx5IGhhcyBTSEFSRUQgbG9jayIpO3JldHVybiBpKHMpfXM9bmV3IGYoYXdhaXQgdSh0KSxlKSxhd2FpdCBpKHMpLGF3YWl0IHMud2FpdENvbXBsZXRlKCl9YXN5bmMgZnVuY3Rpb24gZCh0LGUsaSl7bGV0IG49ZnVuY3Rpb24odCl7cmV0dXJuIGMuZ2V0KHQpfShlKTtpZihpPT09cil7aWYobnVsbD09bil0aHJvdyBuZXcgRXJyb3IoIlVubG9jayBlcnJvciAoU0hBUkVEKTogbm8gdHJhbnNhY3Rpb24gcnVubmluZyIpO24ubG9ja1R5cGU9PT1vJiZuLmRvd25ncmFkZVNoYXJlZCgpfWVsc2UgaT09PXMmJm4mJihhd2FpdCBuLndhaXRDb21wbGV0ZSgpLGMuZGVsZXRlKGUpKTt0LmludDMyKDApLHQuZmluYWxpemUoKX1hc3luYyBmdW5jdGlvbiBnKHQsZSl7bGV0IGk9dC5zdHJpbmcoKTtzd2l0Y2goaSl7Y2FzZSJwcm9maWxlLXN0YXJ0Ijp0LmRvbmUoKSxlLmludDMyKDApLGUuZmluYWxpemUoKSxnKHQsZSk7YnJlYWs7Y2FzZSJwcm9maWxlLXN0b3AiOnQuZG9uZSgpLGF3YWl0IG5ldyBQcm9taXNlKCh0PT5zZXRUaW1lb3V0KHQsMWUzKSkpLGUuaW50MzIoMCksZS5maW5hbGl6ZSgpLGcodCxlKTticmVhaztjYXNlIndyaXRlQmxvY2tzIjp7bGV0IGk9dC5zdHJpbmcoKSxzPVtdO2Zvcig7IXQuZG9uZSgpOyl7bGV0IGU9dC5pbnQzMigpLGk9dC5ieXRlcygpO3MucHVzaCh7cG9zOmUsZGF0YTppfSl9YXdhaXQgYXN5bmMgZnVuY3Rpb24odCxlLGkpe3JldHVybiB3KGUsInJlYWR3cml0ZSIsKGFzeW5jIGU9Pnthd2FpdCBlLmJ1bGtTZXQoaS5tYXAoKHQ9Pih7a2V5OnQucG9zLHZhbHVlOnQuZGF0YX0pKSkpLHQuaW50MzIoMCksdC5maW5hbGl6ZSgpfSkpfShlLGkscyksZyh0LGUpO2JyZWFrfWNhc2UicmVhZEJsb2NrIjp7bGV0IGk9dC5zdHJpbmcoKSxzPXQuaW50MzIoKTt0LmRvbmUoKSxhd2FpdCBhc3luYyBmdW5jdGlvbih0LGUsaSl7cmV0dXJuIHcoZSwicmVhZG9ubHkiLChhc3luYyBlPT57bGV0IHM9YXdhaXQgZS5yZWFkKGkpO251bGw9PXM/dC5ieXRlcyhuZXcgQXJyYXlCdWZmZXIoMCkpOnQuYnl0ZXMocyksdC5maW5hbGl6ZSgpfSkpfShlLGkscyksZyh0LGUpO2JyZWFrfWNhc2UicmVhZE1ldGEiOntsZXQgaT10LnN0cmluZygpO3QuZG9uZSgpLGF3YWl0IGFzeW5jIGZ1bmN0aW9uKHQsZSl7cmV0dXJuIHcoZSwicmVhZG9ubHkiLChhc3luYyBpPT57dHJ5e2NvbnNvbGUubG9nKCJSZWFkaW5nIG1ldGEuLi4iKTtsZXQgcz1hd2FpdCBpLmdldCgtMSk7aWYoY29uc29sZS5sb2coYEdvdCBtZXRhIGZvciAke2V9OmAscyksbnVsbD09cyl0LmludDMyKC0xKSx0LmludDMyKDQwOTYpLHQuZmluYWxpemUoKTtlbHNle2xldCBlPWF3YWl0IGkuZ2V0KDApLHI9NDA5NjtlJiYocj0yNTYqbmV3IFVpbnQxNkFycmF5KGUpWzhdKSx0LmludDMyKHMuc2l6ZSksdC5pbnQzMihyKSx0LmZpbmFsaXplKCl9fWNhdGNoKGUpe2NvbnNvbGUubG9nKGUpLHQuaW50MzIoLTEpLHQuaW50MzIoLTEpLHQuZmluYWxpemUoKX19KSl9KGUsaSksZyh0LGUpO2JyZWFrfWNhc2Uid3JpdGVNZXRhIjp7bGV0IGk9dC5zdHJpbmcoKSxzPXQuaW50MzIoKTt0LmRvbmUoKSxhd2FpdCBhc3luYyBmdW5jdGlvbih0LGUsaSl7cmV0dXJuIHcoZSwicmVhZHdyaXRlIiwoYXN5bmMgZT0+e3RyeXthd2FpdCBlLnNldCh7a2V5Oi0xLHZhbHVlOml9KSx0LmludDMyKDApLHQuZmluYWxpemUoKX1jYXRjaChlKXtjb25zb2xlLmxvZyhlKSx0LmludDMyKC0xKSx0LmZpbmFsaXplKCl9fSkpfShlLGkse3NpemU6c30pLGcodCxlKTticmVha31jYXNlImNsb3NlRmlsZSI6e2xldCBpPXQuc3RyaW5nKCk7dC5kb25lKCksZS5pbnQzMigwKSxlLmZpbmFsaXplKCksZnVuY3Rpb24odCl7bGV0IGU9bC5nZXQodCk7ZSYmKGUuY2xvc2UoKSxsLmRlbGV0ZSh0KSl9KGkpLHNlbGYuY2xvc2UoKTticmVha31jYXNlImxvY2tGaWxlIjp7bGV0IGk9dC5zdHJpbmcoKSxzPXQuaW50MzIoKTt0LmRvbmUoKSxhd2FpdCBhc3luYyBmdW5jdGlvbih0LGUsaSl7bGV0IHM9Yy5nZXQoZSk7aWYocylpZihpPnMubG9ja1R5cGUpe2gocy5sb2NrVHlwZT09PXIsYFVwcmFkaW5nIGxvY2sgdHlwZSBmcm9tICR7cy5sb2NrVHlwZX0gaXMgaW52YWxpZGApLGgoaT09PW58fGk9PT1vLGBVcGdyYWRpbmcgbG9jayB0eXBlIHRvICR7aX0gaXMgaW52YWxpZGApO2xldCBlPWF3YWl0IHMudXBncmFkZUV4Y2x1c2l2ZSgpO3QuaW50MzIoZT8wOi0xKSx0LmZpbmFsaXplKCl9ZWxzZSBoKHMubG9ja1R5cGU9PT1pLGBEb3duZ3JhZGluZyBsb2NrIHRvICR7aX0gaXMgaW52YWxpZGApLHQuaW50MzIoMCksdC5maW5hbGl6ZSgpO2Vsc2V7aChpPT09cixgTmV3IGxvY2tzIG11c3Qgc3RhcnQgYXMgU0hBUkVEIGluc3RlYWQgb2YgJHtpfWApO2xldCBzPW5ldyBmKGF3YWl0IHUoZSkpO2F3YWl0IHMucHJlZmV0Y2hGaXJzdEJsb2NrKDUwMCksYy5zZXQoZSxzKSx0LmludDMyKDApLHQuZmluYWxpemUoKX19KGUsaSxzKSxnKHQsZSk7YnJlYWt9Y2FzZSJ1bmxvY2tGaWxlIjp7bGV0IGk9dC5zdHJpbmcoKSxzPXQuaW50MzIoKTt0LmRvbmUoKSxhd2FpdCBkKGUsaSxzKSxnKHQsZSk7YnJlYWt9ZGVmYXVsdDp0aHJvdyBuZXcgRXJyb3IoIlVua25vd24gbWV0aG9kOiAiK2kpfX1zZWxmLm9ubWVzc2FnZT10PT57c3dpdGNoKHQuZGF0YS50eXBlKXtjYXNlImluaXQiOntsZXRbcyxyXT10LmRhdGEuYnVmZmVycztnKG5ldyBlKHMse25hbWU6ImFyZ3MiLGRlYnVnOiExfSksbmV3IGkocix7bmFtZToicmVzdWx0cyIsZGVidWc6ITF9KSk7YnJlYWt9fX19KCk7Cgo=', null, false);

var indexeddbMainThreadWorkerE59fee74 = /*#__PURE__*/Object.freeze({
  __proto__: null,
  'default': WorkerFactory
});

export { datastore as DatastoreState, EnvironmentState as Environment, messageBus as MessageBus, MutableTimestamp, Timestamp, apply, bootstrap, buildSchema, deserializeValue, getClock, getWorker, insert, makeClientId, merkle, registerApply, select, serializeValue, setEnvironment, startClock, startDatabase, startSync, stopSync, sync, writable };
