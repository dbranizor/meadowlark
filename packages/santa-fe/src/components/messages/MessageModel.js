import { writable, insert, select, _delete } from "@meadowlark-labs/central";

const InitMessagesModel = function () {
  const schema = {
    events: {
      id: "TEXT PRIMARY KEY",
      cat: "TEXT",
      msg: "TEXT",
      coi: "TEXT"
    },
  };
  const { set, subscribe, update } = writable([]);

  const methods = {
    insert: async function (message) {
      const recordID = await insert("events", message);
      update((msg) => {
        if (recordID) {
          msg = [...msg, message];
        }
        return msg;
      });
    },
    refresh: async function () {
      const localizedMessages = await select('SELECT * FROM events where tombstone <> 1');
      set(localizedMessages);
    },
    delete: async function(id){
      await _delete("events", id);
    }
  };

  return {
    set,
    subscribe,
    update,
    ...methods,
    schema,
  };
};

const MessageModel = InitMessagesModel();

export default MessageModel;
