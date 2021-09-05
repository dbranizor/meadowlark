import { makeClientId } from "./Utilities.mjs";
import { getClock } from "./clock";
import { Timestamp } from "./timestamp";
let _worker;
const setWorker = (worker) => {
  _worker = worker;
}
const getWorker = () => _worker;

const buildSchema = (data) => {
  return Object.keys(data).reduce((acc, curr) => {
    console.log("dingo building data $$$$$ &&&*& ", data, curr);
    const tableNames = Object.keys(data[curr]);
    const tableValues = Object.values(data[curr]);
    const statement = tableNames.reduce((acc, scurr, ix) => {
      if (ix === 0) {
        acc = `CREATE TABLE IF NOT EXISTS ${curr} (`;
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

const idFromBinaryUUID = (buf) => {
  return [
    buf.toString("hex", 4, 8),
    buf.toString("hex", 2, 4),
    buf.toString("hex", 0, 2),
    buf.toString("hex", 8, 10),
    buf.toString("hex", 10, 16),
  ];
};

const idToBinaryUuid = (id) => {
  const buf = Buffer.from(id, "hex");
  return Buffer.concat([
    buf.slice(6, 8),
    buf.slice(4, 6),
    buf.slice(0, 4),
    buf.slice(8, 16),
  ]);
};

const insert = (table, row) => {
  let id = makeClientId(true);
  let fields = Object.keys(row);
  const messages = fields.map((k) => {
    return {
      dataset: table,
      row: row.id || id,
      column: k,
      value: row[k],
      timestamp: Timestamp.send(getClock()).toString(),
    };
  });
  const worker = getWorker();

  console.log("dingo object", messages);
  messages.forEach((m) => {
    const id = idToBinaryUuid(makeClientId());
    const row = DatabaseUtilities.idToBinaryUUID(m.row);
    const sql = `INSERT INTO messages (id, dataaset, row, column, value, timestamp) VALUES (X'${id.toString(
      "hex"
    )}', ${m.dataset}, X'${row.toString("hex")}', ${m.column}, ${m.value}, ${m.timestamp})`;
    worker.postMessage({type: 'db-run', sql})
  });
};



export { buildSchema, insert, setWorker };
