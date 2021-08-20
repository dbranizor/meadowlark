import { Timestamp } from "../timestamp";
import * as merkle from "../merkle";
import { Sync } from "../../lib/central";
function v4() {
  let s4 = () => {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  };
  //return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  )
    .replace(/-/g, "")
    .slice(-16);
}

const logger = (config = { logging: "debug" }) =>
  config.logging === "debug" ? console.log : () => {};

const makeClientId = (uuid) => {
  return uuid().replace(/-/g, "").slice(-16);
};

class RestClient {
  logger;
  constructor(config) {
    this.logger = logger(config);
    Object.keys(config).forEach((key) => (this[key] = config[key]));
  }
  json;

  async get(url) {
    this.logger("Running Get Fetch ", this, url);
    const status = await fetch(computeUrl.call(this, url));
    this.logger("Running Get Error Handling");
    errorHandling(status);
    this.logger("Get Error Handling Completed. Sending Response");
    this.json = await status.json();
    this.logger("Get Response", this.json);
    return this.json;
  }
  async delete(url) {
    const status = await fetch(computeUrl.call(this, url), {
      method: "DELETE",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
    });
    errorHandling(status);
    return true;
  }
  async post(url, params) {
    this.logger("Running Post Error Handling", this, url);
    console.log(`Syncing: ${computeUrl.call(this, url)}`);
    const status = await fetch(computeUrl.call(this, url), {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify({ ...params }),
    });
    this.logger("Running Post Error Handling");
    errorHandling(status);
    this.logger(
      "Post Error Handling Completed. Sending Response",
      status,
      this.json
    );
    this.json = await status.json();
    this.logger("Get Response", this.json);
    return this.json;
  }
  async put(url, params) {
    this.logger("Running Put Fetch ", url);
    const computedUrl = computeUrl.call(this, url);
    const status = await fetch(computedUrl, {
      method: "PUT",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify({ ...params }),
    });
    this.logger("Running Put Error Handling");
    errorHandling(status);
    this.logger(
      "Put Error Handling Completed. Sending Response",
      status,
      this.json
    );
    try {
      this.json = await status.json();
    } catch (error) {
      console.error("Failed Getting JSON From Response ", error);
    }

    return this.json;
  }
}
function computeUrl(url) {
  return this.mode
    ? `${this.syncHost}/${this.mode}${url}`
    : `${this.syncHost}/${url}`;
}

const errorHandling = (status) => {
  if (!status.ok) {
    throw Error(status.statusText);
  }
};

let _onSync = null;
let _syncEnabled;

let _selectedGroup = "";
let _groups = [];
let _messageCollection;
// data - _data
let _schema;
const unsubscribes = [];
const SyncerContext = {
  _config: {},
  _syncInterval: false,
  _syncEntity: false,
  _host: "",
  _selectedGroup: "",
  _groups: [],
  _messageCollection: {},
  _syncEnabled: true,
  // data - _data
  _schema: {},
};
const syncerFactory = () => {
  const methods = {
    addGroup(group) {
      SyncerContext._groups = [...SyncerContext._groups, group];
    },
    updateGroup(group) {
      SyncerContext._groups = SyncerContext._groups.map((g) =>
        g.id === group.id ? group : g
      );
    },
    addMessageBatch(messages, group) {
      const oldMessages = _messageCollection[group] || [];
      const newMessages = messages.filter(
        (m) =>
          !oldMessages.some(
            (om) =>
              om.column === m.column && om.row === m.row && om.value === m.value
          )
      );
      if (_messageCollection[group]) {
        _messageCollection[group] = [
          ..._messageCollection[group],
          ...newMessages,
        ];
      } else {
        _messageCollection[group] = [...newMessages];
      }
    },
    addSelection(name, value) {
      if (name === "group") {
        SyncerContext._selectedGroup = value;
      }
      if (name === "sync-enabled") {
        SyncerContext._syncEnabled = value;
      }
    },
    addSchema(name, value) {
      SyncerContext._schema[name] = value;
    },
    async post(data) {
      const res = await restClient.post(
        "sync",
        Object.assign(data, { group_id: _selectedGroup })
      );

      if (res.status !== "ok") {
        throw new Error("API error: " + res.reason);
      }
      return res.data;
    },
  };
  return {
    ...methods,
  };
};

self.addEventListener("message", (event) => {
  const syncer = syncerFactory();
  switch (event.data.msg) {
    case "INIT":
      SyncerContext._config = Object.assign(
        { mode: false },
        event.data.payload
      );
      break;
    case "APPLY":
      console.log("WebWorker: StartSync");
    // self.postMessage("Sync-Done");
    // break;
    case "START_SYNC":
      console.log("WebWorker: StartSync");
      backgroundSync.call(self);
      self.postMessage("Sync-Started");
      break;
    case "STOP_SYNC":
      console.log("WebWorker: StopSync");
      self.postMessage("Sync-Stopped");
      break;

    case "ADD_SCHEMA":
      console.log("WebWorker: AddingSchema");
      Object.keys(event.data.payload).forEach((name) =>
        syncer.addSchema(name, event.data.payload[name])
      );

      // SchemaStore.add(event.data.payload);
      console.log("WebWorker Added Schema", SyncerContext._schema);
    case "ADD_GROUP":
      console.log("WebWorker Added Group: ", {
        id: event.data.payload,
        name: event.data.payload,
        clock: Timestamp.makeClock(new Timestamp(0, 0, v4())),
      });
      syncer.addGroup({
        id: event.data.payload,
        name: event.data.payload,
        clock: Timestamp.makeClock(new Timestamp(0, 0, makeClientId(v4))),
      });
      syncer.addSelection("group", event.data.payload);
      // GroupStore.add({
      //   id: event.data.payload,
      //   name: event.data.payload,
      //   clock: Timestamp.makeClock(new Timestamp(0, 0, makeClientId(v4))),
      // });
      // SelectionStore.add("group", event.data.payload);
      break;
    default:
      console.log("Error: Debug Problem", event.data);
  }
});

function backgroundSync() {
  SyncerContext._syncInterval = setInterval(async () => {
    try {
      await sync();
      this.postMessage("IS_ONLINE");
    } catch (error) {
      console.error("Error: ", error);
      this.postMessage("IS_OFFLINE");
    }
  }, 3999);
}

async function sync(initialMessages = [], since = null) {
  const log = logger(SyncerContext._config);
  log("Starting Sync");
  const groupMessages = SyncerContext._messageCollection[
    SyncerContext._selectedGroup
  ]
    ? SyncerContext._messageCollection[SyncerContext._selectedGroup]
    : [];

  let messages = initialMessages;

  if (since) {
    const timestamp = new Timestamp(since, 0, "0").toString();
    messages = groupMessages.filter((msg) => msg.timestamp >= timestamp);
  }
  let result;
  try {
    console.log(
      "dingo this is the clock",
      SyncerContext._groups.find((g) => g.id === SyncerContext._selectedGroup),
      SyncerContext._groups
        .find((g) => g.id === SyncerContext._selectedGroup)
        .clock.timestamp.node()
    );
    result = await new RestClient(SyncerContext._config).post("sync", {
      group_id: SyncerContext._selectedGroup,
      client_id: SyncerContext._groups
        .find((g) => g.id === SyncerContext._selectedGroup)
        .clock.timestamp.node(),
      messages,
      merkle: SyncerContext._groups.find(
        (g) => SyncerContext._selectedGroup === g.id
      ),
    });
  } catch (err) {
    throw new Error(`network-failure: ${err}`);
  }
  const selectedGroup = SyncerContext._groups.find(
    (g) => g.id === SyncerContext._selectedGroup
  );
  log(`SelectedGroup ${JSON.stringify(selectedGroup)}`);
  log(
    `Merkle ${JSON.stringify(result)} ------ ${JSON.stringify(
      selectedGroup.clock.merkle
    )}`
  );

  if (result.messages.length > 0) {
    receiveMessages(result.messages);
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
  const selectedGroup = SyncerContext._groups.find(
    (g) => g.id === SyncerContext._selectedGroup
  );

  messages.forEach((msg) => {
    Timestamp.receive(selectedGroup.clock, Timestamp.parse(msg.timestamp));
  });

  applyMessages(messages)
}

function applyMessages(messages) {
  let groupMessages = groupMessages();

  let existingMessages = compareMessages(messages);
  let clock = getGroupClock();

  messages.forEach((msg) => {
    let existingMsg = existingMessages.get(msg)

    if(!existingMsg || existingMsg.timestamp < msg.timestamp){
      // apply
    }
  })

}

function compareMessages(messages) {
  const existingMessages = new Map();
  let groupMessages = getGroupMessages();
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

function getGroupMessages() {
  return SyncerContext._messageCollection[SyncerContext._selectedGroup]
    ? SyncerContext._messageCollection[SyncerContext._selectedGroup]
    : [];
}
function getGroupClock(){
  return SyncerContext._groups.find(g => g.id === SyncerContext._selectedGroup).clock
}

function apply(msg){
  let table = SyncerContext._schema[msg.dataset];
  if(!table){
    throw new Error("Unkown  Datasert: " + msg.dataset)
  }

  let row = table.find((row) => row.id === msg.row);

  if (!row) {
    table.push({ id: msg.row, [msg.column]: msg.value });
  } else {
    row[msg.column] = msg.value;
  }

}

