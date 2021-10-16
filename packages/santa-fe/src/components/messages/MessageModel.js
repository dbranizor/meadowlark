import { writable, insert, select } from "@meadowlark-labs/central";

const InitMessagesModel = function () {
  const schema = {
    events: {
      id: "TEXT",
      cat: "TEXT",
      msg: "TEXT",
      coi: "TEXT",
    },
  };
  const { set, subscribe, update } = writable([]);

  const methods = {
    insert: async function (message) {
      console.log('dingo inserting via message model')
      const recordID = await insert("events", message);
      update((msg) => {
        if (recordID) {
          msg = [...msg, message];
        }
        return msg;
      });
    },
    refresh: async function () {
      const localizedMessages = await select('SELECT * FROM events WHERE tombstone <> 1');
      console.log("Dingo got localized Messages", localizedMessages);
      set(localizedMessages);
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
