import { Timestamp } from "./timestamp";
import * as merkle from "./merkle";
import { makeClientId } from "./Utilities.mjs";
import { buildSchema, insert, setWorker, apply, sync } from "./database.js";
import { setClock, makeClock } from "./clock";
import Environment from "./environment-state";
const start = () =>
  setClock(makeClock(new Timestamp(0, 0, makeClientId(true))));
const environment = {};
const setEnvironment = (env) => Environment.set(env);
Environment.subscribe((env) => (environment = env));

function runInterval() {
  const syncInterval = setInterval(async () => {
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
  return syncInterval;
}

export {
  runInterval,
  Environment,
  Timestamp,
  merkle,
  makeClientId,
  buildSchema,
  insert,
  start,
  setWorker,
  setEnvironment,
  apply,
};
