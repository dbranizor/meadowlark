import { writable, bootstrap, sync, insert } from "@meadowlark-labs/central";
const messageSchema = {
  events: {
    id: "TEXT",
    cat: "TEXT",
    msg: "TEXT",
    coi: "TEXT",
  },
};

const InitMessageState = function () {
  const { set, subscribe, update } = writable({
    events: [],
  });
  ("");

  const SyncReady = writable(false);

  const messages = writable([]);

  const methods = {
    init: async function (schema) {
      const messageStateSchema = messageSchema;
      console.log("dingo message state running update");
      await bootstrap(messageStateSchema);
      console.log("dingo message state ran update");
      return SyncReady.update((sync) => {
        console.log("dingo messate state sync being set", sync);
        return true;
      });
    },
    insert: async function (message) {
      const record = await insert("events", message);
      messages.update((msg) => {
        if (record.results && record.results.length) {
          record.results.forEach((rec) => {
            if (!msg.some((m) => m.id === rec.id)) {
              msg = [...msg, rec];
            }
          });
        }

        return msg;
      });
      console.log("dingo got inserted record", record);
    },
  };
  return {
    set,
    subscribe,
    update,
    messages,
    ready: SyncReady,
    ...methods,
  };
};

const MessageState = InitMessageState();
export default MessageState;
