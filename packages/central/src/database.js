import { makeClientId } from "./Utilities.mjs";
import { getClock } from "./clock.js";
import { Timestamp } from "./timestamp.js";
import * as merkle from "./merkle.js";
import Environment from "./environment-state.js";
import MessageState from "./messages-state.js";
import { workerService, getWorker } from "./datastores.js";
import DatastoreState from "./datastore-state";

let environment = {};
let messages = [];
let unsubscribes = [];
unsubscribes.push(
  Environment.subscribe((e) => (environment = e)),
  MessageState.subscribe((m) => (messages = m))
);

const handleApplyMessages = (messages) => {
  let clock = getClock();
  getWorker();
  const applies = [];
  window.worker.postMessage({ type: "db-compare-messages", messages });
  return new Promise((res, rej) => {
    console.log("dingo inside of handlecomparemessages promise", clock);
    window.worker.onmessage = (e) => {
      if (e.data.type === "existing-messages") {
        const existingMessages = e.data.result || [];
        messages.forEach((msg) => {
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
        window.worker.postMessage({ type: "db-apply", messages: applies });
        console.log("dingo existing messages", e.data);
      }
      if (e.data.type === "applied-messages") {
        console.log("Messages Are Applied", e.data);
        return res(e.data);
      }
    };
  });
};

const apply = async (locMessages = []) => {
  getWorker();
  if (!window.worker) {
    console.error("dingo no worker", worker, newSecret(), newSecret());
    throw new Error(`Error: No Worker`);
  }
  console.log("dingo store database worker in apply", worker);

  console.log("dingo ");
  let records;
  try {
    records = await handleApplyMessages(locMessages);
  } catch (error) {
    throw new Error(`Error: `, error);
  }

  return records;
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
      "Access-Control-Allow-Origin": "*",
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
function receiveMessages(messages = []) {
  messages.forEach((msg) => {
    Timestamp.receive(getClock(), Timestamp.parse(msg.timestamp));
  });
  return apply(messages).then((records) => {
    return records;
  });
}
async function sync(initialMessages = [], since = null) {
  console.log("dingo running sync", environment);
  if (environment.syncDisabled) {
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

  console.log(
    `RESULTS Merkle: ${result.messages.length} ${result.merkle.hash || false}`
  );

  if (result.messages.length > 0) {
    let groups = result.messages.reduce((acc, curr) => {
      if (!acc[curr.dataset]) {
        acc[curr.dataset] = [curr];
      } else {
        acc[curr.dataset] = [...acc[curr.dataset], curr];
      }
      return acc;
    }, {});
    let records = [];
    /**Ugly Sync Code  */
    Object.keys(groups).reduce(async (acc, curr) => {
      let prevAcc = await acc;
      console.log('dingo currrecords', groups)
      let currRecords = await receiveMessages(groups[curr]);
      console.log('dingo currRecords Received', currRecords)
      if(currRecords.results && currRecords.results.length){
        /**Check to see if record exists */
        currRecords.results.forEach(r => DatastoreState.addRecord(curr, r));

      }

    }, Promise.resolve());
    /**End of ugly sync code */
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
  } else {
    console.log("dingo sync good not re-running");
    return;
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
  let id = makeClientId(true);
  let fields = Object.keys(row);
  const messages = [
    ...fields.map((k) => {
      return {
        dataset: table,
        row: row.id || id,
        column: k,
        value: row[k],
        timestamp: Timestamp.send(getClock()).toString(),
      };
    }),
    {
      dataset: table,
      row: row.id || id,
      value: 0,
      column: "tombstone",
      timestamp: Timestamp.send(getClock()).toString(),
    },
  ];

  console.log("dingo calling apply on new messages", messages);
  let records;
  try {
    records = await apply(messages);
  } catch (error) {
    throw new error(`Error: ${error}`);
  }

  try {
    sync(messages);
  } catch (error) {
    throw new Error(`Error: ${error}`);
  }

  return records;
  // console.log("dingo object", messages);
  // messages.forEach((m) => {
  // const sql = `INSERT INTO messages (dataset, row, column, value, timestamp) VALUES ('${m.dataset}', '${m.row}', '${m.column}', '${m.value}', '${m.timestamp}')`;
  // window.worker.postMessage({ type: "db-run", sql });
  // });
};

export { sync, buildSchema, insert, apply, receiveMessages };
