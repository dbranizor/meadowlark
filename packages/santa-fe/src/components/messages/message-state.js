import { writable, bootstrap, sync } from "@meadowlark-labs/central";
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
    init: false,
  });

  const methods = {
    init: async function (schema) {
      const messageStateSchema = Object.assign(messageSchema, schema);
      console.log("dingo message state running update");
      await bootstrap(messageStateSchema);
      console.log("dingo message state ran update");
      update((sync) => {
        console.log("dingo messate state sync being set", sync);
        sync.init = true;
        return sync;
      });
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
