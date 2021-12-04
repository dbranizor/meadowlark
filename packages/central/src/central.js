import { Timestamp, MutableTimestamp } from "./timestamp.js";
import * as merkle from "./merkle.js";
import { writable } from "./store.js";
import { makeClientId,debounce } from "./Utilities.mjs";
import {
  buildSchema,
  insert,
  _delete,
  apply,
  sync,
  registerApply,
  serializeValue,
  deserializeValue,
  update,
} from "./database.js";
import { setClock, makeClock, getClock } from "./clock.js";
import MessageBus from "./message-bus.js";
import { bootstrap, getWorker } from "./datastores.js";
import DatastoreState from "./datastore-state.js";
import Environment from "./environment-state.js";
import MeadoCrypto from "./MeadoCrypto.js";
import WebDao from "./webSql.js";



const startDatabase = async () => {
  getWorker();
  return new Promise((res, rej) => {
    window.worker.postMessage({ type: "INIT_DATABASE" });
    window.worker.addEventListener("message", (e) => {
      if (e.data.type === "INITIALIZED_DB") {
        return res(true);
      }
    });
  });
};
const startClock = async () => {
  const c = await makeClock(new Timestamp(0, 0, makeClientId(true)));
  return setClock(c);
};

let environment = {};
let meadoCrypto;

const setEnvironment = (e) => {
  Environment.set(e);
};
Environment.subscribe((env) => (environment = env));

let syncInterval;
function startSync() {
  syncInterval = setInterval(async () => {
    try {
      await sync();
      Environment.update((env) => Object.assign(env, { isOffline: false }));
    } catch (e) {
      if (e.message === "network-failure") {
        Environment.update((env) => Object.assign(env, { isOffline: true }));
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
    window.worker.postMessage({ type: "SELECT_ALL", sql });
    window.worker.addEventListener("message", function (e) {
      if (e.data.type === "SELECT") {
        return res(e.data.results);
      }
    });
  });
}

export {
  startDatabase,
  startSync,
  stopSync,
  Environment,
  MutableTimestamp,
  MeadoCrypto,
  Timestamp,
  merkle,
  makeClientId,
  WebDao,
  buildSchema,
  DatastoreState,
  registerApply,
  debounce,
  MessageBus,
  serializeValue,
  update,
  deserializeValue,
  _delete,
  getClock,
  insert,
  startClock,
  writable,
  sync,
  select,
  setEnvironment,
  bootstrap,
  apply,
  getWorker,
};
