import { writable, bootstrap } from "@meadowlark-labs/central";
const messageSchema = {
  events: {
    id: "TEXT",
    cat: "TEXT",
    msg: "TEXT",
    coi: "TEXT",
  },
  coi: {
    id: "TEXT",
    name: "text",
    details: "text",
  },
  user_coi: {
    id: "TEXT",
    coi: "TEXT",
    user: "text",
  },
};

const InitMessageState = function ()  {
  const { set, subscribe, update } = writable({});
  const methods = {
    init: async function (schema) {
      const messageStateSchema = Object.assign(messageSchema, schema);
      await bootstrap(messageStateSchema);
    },
  };
  return {
    set,
    subscribe,
    update,
    ...methods,
  };
};

const MessageState = InitMessageState();
export default MessageState;
