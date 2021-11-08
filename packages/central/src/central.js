import { Timestamp, MutableTimestamp } from "./timestamp";
import * as merkle from "./merkle";
import { writable } from "./store";
import { makeClientId } from "./Utilities.mjs";
import { buildSchema, insert, apply, sync, registerApply, serializeValue, deserializeValue } from "./database.js";
import { setClock, makeClock, getClock } from "./clock.js";
import MessageBus from "./message-bus.js";
import { bootstrap, getWorker } from "./datastores.js";
import DatastoreState from "./datastore-state";
import Environment from "./environment-state.js";

const startDatabase = async () => {
  getWorker()
  return new Promise((res, rej) => {
    window.worker.postMessage({type: "INIT_DATABASE"})
    window.worker.addEventListener("message", (e) => {
      if(e.data.type === "INITIALIZED_DB"){
        return res(true)
      }
    })
  })
}
const startClock = async () => {
  const c = await makeClock(new Timestamp(0, 0, makeClientId(true)));
  return setClock(c);
}
  
let environment = {};

const setEnvironment = (e) => {
  console.log("dingo env", e, environment);
  Environment.set(e)
  // Environment.update((env) => {
  //   const oldEnv = JSON.parse(JSON.stringify(env));
  //   const newEnv = Object.assign(oldEnv, { ...e });
  //   console.log("dingo new Env dingo currRecords added to store same", oldEnv, newEnv);
  //   return newEnv;
  // });
};
Environment.subscribe((env) => (environment = env));

let syncInterval;
function startSync() {
  syncInterval = setInterval(async () => {
    try {
      console.log("dingo Running Sync");
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

export {
  startDatabase,
  startSync,
  stopSync,
  Environment,
  MutableTimestamp,
  Timestamp,
  merkle,
  makeClientId,
  buildSchema,
  DatastoreState,
  registerApply,
  MessageBus,
  serializeValue,
  deserializeValue,
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
