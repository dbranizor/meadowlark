import { makeClientId } from "./Utilities.mjs";
import { getClock } from "./clock";
import { Timestamp } from "./timestamp";
import * as merkle from "./merkle";
import Environment from "./environment-state";
import MessageState from "./messages-state";

let _worker;
let environment = {};
let messages = [];
let unsubscribes = [];

unsubscribes.push(
  Environment.subscribe((e) => (environment = e)),
  MessageState.subscribe((m) => (messages = m))
);
const setWorker = (worker) => {
  _worker = worker;
};
const getWorker = () => _worker;

const apply = (locMessages = []) => {
  let clock = getClock();
  _worker.postMessage({ type: "db-compare-messages", messages: locMessages });
  _worker.onmessage = function (e) {
    const applies = [];
    if (e.data.type === "existing-messages") {
      const existingMessages = e.data.result || [];
      locMessages.forEach((msg) => {
        const existingMessage = existingMessages.find(
          (e) =>
            e.dataset === msg.dataset &&
            e.row === msg.row &&
            e.column === msg.column
        );
        if (!existingMessage || existingMessage.timestamp < msg.timestamp) {
          applies.push(msg);
        }

        if (!existingMessage || existingMessage.timestamp !== msg.timestamp) {
          clock.merkle = merkle.insert(
            clock.merkle,
            Timestamp.parse(msg.timestamp)
          );
          MessageState.add(msg);
        }
      });
      _worker.postMessage({ type: "db-apply", messages: applies });
      console.log("dingo existing messages", e.data);
    }
    if (e.data.type === "applied-messages") {
      // sync messages
      console.log("dingo should apply sync here", e.data, environment);
      sync(locMessages);
    }
  };
};

async function post(data) {
  console.log("diongo running fetch", environment, environment.user_id);
  let res = await fetch(`${environment.syncUrl}/sync`, {
    method: "POST",
    mode: "cors",
    credentials: "same-origin",
    redirect: "follow",
    referrerPolicy: "no-referrer",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      authorization: environment.user_id,
    },
  });
  res = await res.json();

  if (res.status !== "ok") {
    throw new Error("API error: " + res.reason);
  }
  return res.data;
}

async function sync(initialMessages = [], since = null) {
  console.log("dingo running sync", environment);
  if (!environment.syncEnabled) {
    return;
  }

  let syncMessages = initialMessages;

  if (since) {
    let timestamp = new Timestamp(since, 0, "0").toString();
    syncMessages = messages.filter((msg) => msg.timestamp >= timestamp);
  }

  let result;
  try {
    result = await post({
      group_id: environment.group_id,
      client_id: getClock().timestamp.node(),
      messages: syncMessages,
      merkle: getClock().merkle,
    });
  } catch (e) {
    throw new Error("network-failure");
  }

  if (result.messages.length > 0) {
    receiveMessages(result.messages);
  }

  let diffTime = merkle.diff(result.merkle, getClock().merkle);

  if (diffTime) {
    if (since && since === diffTime) {
      throw new Error(
        "A bug happened while syncing and the client " +
          "was unable to get in sync with the server. " +
          "This is an internal error that shouldn't happen"
      );
    }

    console.log("dingo returning");
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

export { sync, buildSchema, insert, setWorker, apply };
