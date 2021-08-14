import { RestClient, logger } from "@meadowlark/common";
import SelectionStore from "./SelectionStore";
import GroupStore from "./GroupStore";
import MessageStore from "./MessageStore";
import SchemaStore from "./SchemaSAtore";

let restClient = new RestClient({ logging: "debug" });
let _onSync = null;
let _syncEnabled;

let _selectedGroup = "";
let _groups = [];
let _messageCollection;
// data - _data
let _schema;
const unsubscribes = [];
unsubscribes.push(
  SchemaStore.subscribe((s) => (_schema = s)),
  SelectionStore.subscribe((s) => {
    _selectedGroup = r["group"];
    _syncEnabled = r["sync-enabled"];
    console.log("writeable store has new selection dingo", _syncEnabled);
  }),
  GroupStore.subscribe((groups) => {
    _groups = _groups;
    console.log("writeable store has new groups dingo", _syncEnabled);
  }),
  MessageStore.subscribe((store) => {
    _messageCollection = store;
  })
);

async function post(data) {
  const res = await restClient.post(
    "/sync",
    Object.assign(data, { group_id: _selectedGroup })
  );

  if (res.status !== "ok") {
    throw new Error("API error: " + res.reason);
  }
  return res.data;
}
