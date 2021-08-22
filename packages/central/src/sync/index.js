import { EVENTS } from "../enum";
import { Timestamp } from "../timestamp";
import { makeClientId } from "../Utilities.mjs";
import {backgroundSync, sendMessages} from "./syncer.mjs";

// data - _data
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
function syncerFactoryInit() {
  const methods = {
    addGroup(group) {
      console.log("dingo adding group", group);
      SyncerContext._groups = [...SyncerContext._groups, group];
    },
    updateGroup(group) {
      SyncerContext._groups = SyncerContext._groups.map((g) =>
        g.id === group.id ? group : g
      );
    },
    addMessageBatch(messages, group) {
      const oldMessages = SyncerContext._messageCollection[group] || [];
      const newMessages = messages.filter(
        (m) =>
          !oldMessages.some(
            (om) =>
              om.column === m.column && om.row === m.row && om.value === m.value
          )
      );
      if (SyncerContext._messageCollection[group]) {
        SyncerContext._messageCollection[group] = [
          ...SyncerContext._messageCollection[group],
          ...newMessages,
        ];
      } else {
        SyncerContext._messageCollection[group] = [...newMessages];
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
  };
  return {
    ...methods,
  };
}

var syncerFactory = syncerFactoryInit.bind(SyncerContext);
var startSync = backgroundSync.bind(SyncerContext);

self.addEventListener("message", (event) => {
  console.log('dingo checking is the wasm in the webworker?');
  console.log('dingo is the wasm in the webworker?', initSqlJs);
  const factory = syncerFactory();
  switch (event.data.msg) {
    case "INIT":

     
      SyncerContext._config = Object.assign(
        { mode: false },
        event.data.payload
      );
      break;
    case "APPLY":
      console.log("WebWorker: StartSync");
      break;
    // self.postMessage("Sync-Done");
    // break;
    case "START_SYNC":
      console.log("WebWorker: StartSync");
      startSync(self);
      self.postMessage("Sync-Started");
      break;
    case "STOP_SYNC":
      console.log("WebWorker: StopSync");
      self.postMessage("Sync-Stopped");
      break;
    case "ADD_SCHEMA":
      console.log("WebWorker: AddingSchema");
      Object.keys(event.data.payload).forEach((name) =>
        factory.addSchema(name, event.data.payload[name])
      );

      // SchemaStore.add(event.data.payload);
      console.log("WebWorker Added Schema", SyncerContext._schema);
      break;
    case EVENTS.SEND_MESSAGE:
      sendMessages(event.data.payload)
      break;
    case EVENTS.SELECT_GROUP:
      console.log("dingo selecting group", event.data.payload);
      factory.addSelection("group", event.data.payload);
      break;
    case "ADD_GROUP":
      factory.addGroup({
        id: event.data.payload,
        name: event.data.payload,
        clock: Timestamp.makeClock(new Timestamp(0, 0, makeClientId())),
      });
      // GroupStore.add({
      //   id: event.data.payload,
      //   name: event.data.payload,
      //   clock: Timestamp.makeClock(new Timestamp(0, 0, makeClientId())),
      // });
      // SelectionStore.add("group", event.data.payload);
      break;
    default:
      console.log("Error: Debug Problem", event.data);
  }
});
