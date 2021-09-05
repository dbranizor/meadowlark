import { Timestamp } from "./timestamp";
import * as merkle from "./merkle";
import { makeClientId } from "./Utilities.mjs";
import { buildSchema, insert,setWorker } from "./database.js";
import {setClock, makeClock} from "./clock"
const start = () => setClock(makeClock(new Timestamp(0, 0, makeClientId(true))))
;

export { Timestamp, merkle, makeClientId, buildSchema, insert, start, setWorker };
