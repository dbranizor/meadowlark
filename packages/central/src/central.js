import { Timestamp } from "./timestamp";
import * as merkle from "./merkle";
import { makeClientId } from "./Utilities.mjs";
import { buildSchema, insert, apply, sync } from "./database.js";
import { setClock, makeClock } from "./clock.js";
import {bootstrap,getWorker} from "./datastores.js"
import Environment from "./environment-state.js";
const start = () =>
  setClock(makeClock(new Timestamp(0, 0, makeClientId(true))));
const environment = {};
const setEnvironment = (env) => Environment.set(env);
Environment.subscribe((env) => (environment = env));

let syncInterval;
function startSync() {
  syncInterval = setInterval(async () => {
    try {
      console.log('dingo Running Sync')
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

export {
  startSync,
  stopSync,
  Environment,
  Timestamp,
  merkle,
  makeClientId,
  buildSchema,
  insert,
  start,
  sync,
  setEnvironment,
  bootstrap,
  apply,
  getWorker
};
