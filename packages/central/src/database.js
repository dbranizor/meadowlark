import { makeClientId } from "./Utilities.mjs";
import { getClock, setClock } from "./clock.js";
import { Timestamp } from "./timestamp.js";
import * as merkle from "./merkle.js";
import Environment from "./environment-state.js";
import MessageState from "./messages-state.js";
import { getWorker } from "./datastores.js";
import { EVENTS } from "./enum.js";

let environment = {};
let messages = [];
let unsubscribes = [];
unsubscribes.push(
  Environment.subscribe((e) => (environment = e)),
  MessageState.subscribe((m) => (messages = m))
);

const handleApplyMessage = async (messages) => {
  return new Promise((res, rej) => {
    getWorker();
    window.worker.postMessage({ type: EVENTS.RUN_APPLY, messages: messages });
    window.worker.addEventListener("message", (e) => {
      if (e.data.type === EVENTS.APPLIED) {
        res(true);
      }
    });
  });
};

function serializeValue(value) {
  if (value === null) {
    return "0:";
  } else if (typeof value === "number") {
    return "N:" + value;
  } else if (typeof value === "string") {
    return "S:" + value;
  }

  throw new Error("Unserializable value type: " + JSON.stringify(value));
}

function deserializeValue(value) {
  const type = value[0];
  switch (type) {
    case "0":
      return null;
    case "N":
      return parseFloat(value.slice(2));
    case "S":
      return value.slice(2);
  }

  throw new Error("Invalid type key for value: " + value);
}

// 121
/**
 * Apply the data operation contained in a message to our local data store
 * (i.e., set a new property value for a secified dataset/table/row/column).
 */
const apply = async (messages) => {
  getWorker();
  if (!window.worker) {
    throw new Error(`Error: No Worker`);
  }

  await handleApplyMessage(messages);
  return true;
};

async function post(data) {
  let res = await fetch(`${environment.sync_url}/sync`, {
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

function getMatchingLocalMessage(message) {
  getWorker();
  return new Promise((res, rej) => {
    window.worker.postMessage({
      type: EVENTS.GET_MOST_RECENT_LOCAL_MESSAGES,
      message,
    });
    window.worker.addEventListener("message", (e) => {
      if (e.data.type === EVENTS.MOST_RECENT_LOCAL_MESSAGES) {
        return res(e.data.results);
      }
    });
  });
}

async function mapIncomingToLocalMessagesForField(incomingMessages) {
  const incomingFieldMsgToLocalFieldMsgMap = await incomingMessages.reduce(
    async (acc, curr) => {
      const map = await acc;

      // Attempt to find the most recent local message for the same field as the
      // current incoming message (note that find() can return `undefined` if no
      // match is found).
      const mostRecentLocalMsg = await getMatchingLocalMessage(curr);
      // Note that the incoming message OBJECT is being used as a key here
      // (something you couldn't do if an Object were used insteaad of a Map)
      map.set(curr, mostRecentLocalMsg);
      return map;
    },
    Promise.resolve(new Map())
  );

  return incomingFieldMsgToLocalFieldMsgMap;
}

async function handleInsertMessages(message) {
  return new Promise((res, rej) => {
    window.worker.postMessage({
      type: EVENTS.RUN_INSERT_MESSAGES,
      message,
      group_id: environment.group_id,
    });
    window.worker.addEventListener("message", (e) => {
      if (e.data.type === EVENTS.INSERT_MESSAGE) {
        return res(true);
      }
    });
  });
}

let _apply;
function registerApply(callback) {
  _apply = callback;
}
async function applyMessages(incomingMessages) {
  let incomingToLocalMsgsForField = await mapIncomingToLocalMessagesForField(
    incomingMessages
  );
  let clock = getClock();
  let messages = [];
  let appliedMessages = [];
  // Look at each incoming message. If it's new to us (i.e., we don't have it in
  // our local store), or is newer than the message we have for the same field
  // (i.e., dataset + row + column), then apply it to our local data store and
  // insert it into our local collection of messages and merkle tree (which is
  // basically a specialized index of those messages).
  await incomingMessages.reduce(async (acc, incomingMsgForField) => {
    const prevAcc = await acc;
    // `incomingToLocalMsgsForField` is a Map instance, which means objects
    // can be used as keys. If this is the first time we've encountered the
    // message, then we won't have a _local_ version in the Map and `.get()`
    // will return `undefined`.
    let mostRecentLocalMsgForField =
      incomingToLocalMsgsForField.get(incomingMsgForField);

    // If there is no corresponding local message (i.e., this is a "new" /
    // unknown incoming message), OR the incoming message is "newer" than the
    // one we have, apply the incoming message to our local data store.
    //
    // Note that althought `.timestamp` references an object (i.e., an instance
    // of Timestamp), the JS engine is going to implicitly call the instance's
    // `.valueOf()` method when doing these comparisons. The Timestamp class has
    // a custom implementation of valueOf() that retuns a string. So, in effect,
    // comparing timestamps below is comparing the toString() value of the
    // Timestamp objects.

    if (
      !mostRecentLocalMsgForField ||
      mostRecentLocalMsgForField.timestamp < incomingMsgForField.timestamp
    ) {
      // `apply()` means that we're going to actually update our local data
      // store with the operation contained in the message.
      appliedMessages = [...appliedMessages, incomingMsgForField];
    } 

    // If this is a new message that we don't have locally (i.e., we didn't find
    // a corresponding local message for the same dataset/row/column OR we did
    // but it has a different timestamp than ours), we need to add it to our
    // axfrray of local messages and update the merkle tree.
    if (
      !mostRecentLocalMsgForField ||
      mostRecentLocalMsgForField.timestamp !== incomingMsgForField.timestamp
    ) {
      clock.merkle = merkle.insert(
        clock.merkle,
        Timestamp.parse(incomingMsgForField.timestamp)
      );

      // Add the message to our collection...
      // _messages.push(incomingMsgForField);
      messages.push(incomingMsgForField);
    }
    return prevAcc;
  }, Promise.resolve());
  await apply(appliedMessages);
  await handleInsertMessages(messages);
  return _apply && _apply();
}
async function receiveMessages(messages = []) {
  messages.forEach((msg) => {
    Timestamp.receive(getClock(), Timestamp.parse(msg.timestamp));
  });
  await applyMessages(messages);
}

async function getSortedMessages() {
  return new Promise((res, rej) => {
    window.worker.postMessage({ type: "db-sorted-messages" });
    window.worker.addEventListener("message", (e) => {
      if (e.data.type === "sorted-messages") {
        const messages = e.data.sortedMessages;
        res(messages);
      }
    });
  });
}

async function sync(initialMessages = [], since = null) {
  console.log('Running Sync ', since)
  if (environment.syncDisabled) {
    return;
  }

  let messages = initialMessages;

  if (since) {
    let timestamp = new Timestamp(since, 0, "0").toString();
    let sortedMessages = await getSortedMessages();
    messages = sortedMessages.filter((msg) => msg.timestamp >= timestamp);
  }

  let result;
  try {
    result = await post({
      group_id: environment.group_id,
      client_id: getClock().timestamp.node(),
      messages: initialMessages.map((m) => ({
        ...m,
        value: deserializeValue(m.value),
      })),
      merkle: getClock().merkle,
    });
  } catch (e) {
    throw new Error("network-failure");
  }


  if (result.messages.length > 0) {
   await receiveMessages(
      result.messages.map((m) => ({ ...m, value: serializeValue(m.value) }))
    );
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
    return sync([], diffTime);
  }
}

const buildSchema = (data) => {
  return Object.keys(data).reduce((acc, curr) => {
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
  const id = makeClientId(true);
  const fields = Object.keys(row);

  const messages = [
    ...fields.map((k) => {
      return {
        id: makeClientId(),
        dataset: table,
        row: row.id || id,
        column: k,
        value: serializeValue(row[k]),
        timestamp: Timestamp.send(getClock()).toString(),
      };
    }),
    {
      id: makeClientId(),
      dataset: table,
      row: row.id || id,
      column: "tombstone",
      value: serializeValue(0),
      timestamp: Timestamp.send(getClock()).toString(),
    },
  ];


  sendMessages(messages);

  return id;

};

const _delete = (table, id) => {
  sendMessages([
    {
      dataset: table,
      row: id,
      value: serializeValue(1),
      column: "tombstone",
      timestamp: Timestamp.send(getClock()).toString(),
    },
  ]);
};

const sendMessages = (messages) => {
  applyMessages(messages);
  sync(messages);
};

export {
  sync,
  buildSchema,
  insert,
  _delete,
  apply,
  receiveMessages,
  registerApply,
  serializeValue,
  deserializeValue,
};
