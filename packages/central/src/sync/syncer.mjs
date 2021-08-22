import { logger } from "../Utilities.mjs";
import { Timestamp } from "../timestamp";
import * as merkle from "../merkle";
import RestClient from "../RestClient";
// import initSqlJs from "initSqlJs";
import { SQLiteFS } from "absurd-sql";
import IndexedDBBackend from "absurd-sql/dist/indexeddb-backend";


let SQL;
let sqlFS;
let db;
let dbName = `fts.sqlite`;
let currentBackendType = "idb";
let cacheSize = 5000;
let pageSize = 8192;
let self;
async function init(s) {
  self = s;
  SQL = await initSqlJs({ locateFile: (file) => file });
  // sqlFS = new SQLiteFS(SQL.FS, new IndexedDBBackend());
  // SQL.register_for_idb(sqlFS);

  // SQL.FS.mkdir("/sql");
  // SQL.FS.mount(sqlFS, {}, "/sql");
}

function getDBName() {
  return dbName;
}

function output(msg) {
  self.postMessage({ type: "output", msg });
}
async function getDatabase() {
  await init();
  // if (db === undefined) {
  //   db = new SQL.Database(`/blocked/${getDBName}`, { filename: true });
  //   // Should ALWAYS use the journal in memory mode. Doesn't make
  //   // any sense at all to write the journal
  //   //
  //   // It's also important to use the same page size that our storage
  //   // system uses. This will change in the future so that you don't
  //   // have to worry about sqlite's page size (requires some
  //   // optimizations)

  //   db.exec(`
  //   PRAGMA cache_size=-${cacheSize};
  //   PRAGMA page_size=${pageSize};
  //   PRAGMA journal_mode=MEMORY;
  // `);
  //   db.exec("VACUUM");
  //   output(
  //     `Opened ${getDBName()} (${currentBackendType}) cache size: ${cacheSize}`
  //   );
  // }
}

function sendMessages(messages) {
  applyMessages(messages);
  sync(messages);
}

function backgroundSync() {
  return getDatabase(self).then((res) => {
    const db = res;
    console.log("dingo in background sync", this);
    const log = logger(this._config);
    var bgSync = sync.bind(this);
    this._syncInterval = setInterval(async () => {
      try {
        await bgSync();
        // this.postMessage("IS_ONLINE");
      } catch (error) {
        console.error("Error: ", error);
        // this.postMessage("IS_OFFLINE");
      }
    }, 3999);
  });
}

async function sync(initialMessages = [], since = null) {
  console.log("dingo in  sync", this);
  const log = logger(this._config);
  if (!this._selectedGroup) {
    log("No SelectedGroup", this._selectedGroup);
    return;
  } else {
    log("SelectedGroup", this._selectedGroup);
  }

  log("Starting Sync");

  const groupMessages = getGroupMessages.call(this);
  const selectedGroup = getSelectedGroup.call(this);
  let messages = initialMessages;

  log("Sync Context", selectedGroup, groupMessages);
  if (since) {
    const timestamp = new Timestamp(since, 0, "0").toString();
    messages = groupMessages.filter((msg) => msg.timestamp >= timestamp);
  }

  let result;
  try {
    result = await new RestClient(this._config).post("sync", {
      group_id: this._selectedGroup,
      client_id: selectedGroup.clock.timestamp.node(),
      messages,
      merkle: selectedGroup.clock.merkle,
    });
  } catch (err) {
    throw new Error(`network-failure: ${err}`);
  }

  log(`SelectedGroup ${JSON.stringify(selectedGroup)}`);
  log(
    `Merkle ${JSON.stringify(result)} ------ ${JSON.stringify(
      selectedGroup.clock.merkle
    )}`
  );

  if (result.messages.length > 0) {
    recieveMessages.call(this, result.messages);
  }

  let diffTime = merkle.diff(result.merkle, selectedGroup.clock.merkle);
  if (diffTime) {
    if (since && since === diffTime) {
      throw new Error(
        `An Error Occured. Sync Has Failed. This Error Should Not Have Happened!`
      );
    }
    return sync([], diffTime);
  }
}

function recieveMessages(messages) {
  const selectedGroup = getSelectedGroup.call(this);

  messages.forEach((msg) => {
    Timestamp.receive(selectedGroup.clock, Timestamp.parse(msg.timestamp));
  });

  applyMessages.call(this, messages);
}

function applyMessages(messages) {
  let groupMessages = groupMessages.call(this);

  let existingMessages = compareMessages.call(this, messages);
  let clock = getGroupClock.call(this);

  messages.forEach((msg) => {
    let existingMsg = existingMessages.get(msg);

    if (!existingMsg || existingMsg.timestamp < msg.timestamp) {
      apply(msg);
    }
    if (!existingMsg || existingMsg.timestamp !== msg.timestamp) {
      clock.merkle = merkle.insert(
        clock.merkle,
        Timestamp.parse(msg.timestamp)
      );
    }

    this._messageCollection.push(msg);
  });
  _onSync && _onSync();
}

function compareMessages(messages) {
  const existingMessages = new Map();
  let groupMessages = getGroupMessages.call(this);
  let sortedMessages = [...groupMessages].sort((m1, m2) => {
    if (m1.timestamp < m2.timestamp) {
      return 1;
    } else if (m1.timestamp > m2.timestamp) {
      return -1;
    }
    return 0;
  });
  messages.forEach((msg1) => {
    let existingMsg = sortedMessages.find(
      (msg2) =>
        msg1.dataset === msg2.dataset &&
        msg1.row === msg2.row &&
        msg1.column === msg2.column
    );
    existingMessages.set(msg1, existingMsg);
  });
  return existingMessages;
}

function apply(msg) {
  let table = this._schema[msg.dataset];
  if (!table) {
    throw new Error("Unkown  Datasert: " + msg.dataset);
  }

  let row = table.find((row) => row.id === msg.row);

  if (!row) {
    table.push({ id: msg.row, [msg.column]: msg.value });
  } else {
    row[msg.column] = msg.value;
  }
}

function getSelectedGroup() {
  console.log(
    "dingo what is the selected group",
    this._selectedGroup,
    this._groups,
    this
  );
  return this._groups.find((g) => g.id === this._selectedGroup);
}

function getGroupMessages() {
  console.log("dingo in getGroupMessages", this);
  return this._messageCollection[this._selectedGroup]
    ? this._messageCollection[this._selectedGroup]
    : [];
}
function getGroupClock() {
  console.log("dingo what is the clock", this);
  return this._groups.find((g) => g.id === this._selectedGroup).clock;
}

export { backgroundSync, sendMessages };
