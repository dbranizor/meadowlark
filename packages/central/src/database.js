import { makeClientId } from "./Utilities.mjs";
import { getClock } from "./clock";
import { Timestamp } from "./timestamp";
let _worker;
const setWorker = (worker) => {
  _worker = worker;
};
const getWorker = () => _worker;

/**
 *
 * ApplyMessages = CompareMessages -> getGexsting -> Update Existing
 */

const compareMessages = (messages) => {
  let existingMessages = new Map();
};

const apply = (messages) => {
  _worker.postMessage({ type: "db-compare-messages", messages });
  _worker.onmessage = function (e) {
    if (e.data.type === "existing-messages") {
      console.log("dingo existing messages", e.data);
    }
  };
};

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

  apply(messages);
  // console.log("dingo object", messages);
  // messages.forEach((m) => {
  // const sql = `INSERT INTO messages (dataset, row, column, value, timestamp) VALUES ('${m.dataset}', '${m.row}', '${m.column}', '${m.value}', '${m.timestamp}')`;
  // worker.postMessage({ type: "db-run", sql });
  // });
};

export { buildSchema, insert, setWorker, apply };
