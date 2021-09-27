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
    events: []
  });

  const SyncRoutable = writable(false);


  const methods = {
    init: async function (schema) {
      const messageStateSchema = Object.assign(messageSchema, schema);
      console.log("dingo message state running update");
      await bootstrap(messageStateSchema);
      console.log("dingo message state ran update");
      return SyncRoutable.update((sync) => {
        console.log("dingo messate state sync being set", sync.init === true);
        sync = true;
        console.log("dingo messate state sync being set", sync.init === true);
        return sync;
      });
    },
  };
  return {
    set,
    subscribe,
    update,
    ready: SyncRoutable,
    ...methods,
  };
};

const MessageState = InitMessageState();
export default MessageState;
