import { Timestamp } from "./timestamp";
import * as merkle from "./merkle";
import { makeClientId } from "./Utilities.mjs";
import { buildSchema, insert,setWorker, apply } from "./database.js";
import {setClock, makeClock} from "./clock"
import Environment from "./environment-state";
const start = () => setClock(makeClock(new Timestamp(0, 0, makeClientId(true))));

export { Environment, Timestamp, merkle, makeClientId, buildSchema, insert, start, setWorker, apply };
