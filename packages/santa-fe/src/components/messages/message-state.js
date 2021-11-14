import { writable, bootstrap, insert } from "@meadowlark-labs/central";

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
      await bootstrap(messageStateSchema);
      return SyncReady.update((sync) => {
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
