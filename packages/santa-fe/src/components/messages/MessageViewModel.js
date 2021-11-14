import {
  writable,
  MessageBus,
  bootstrap,
  insert,
  sync,
} from "@meadowlark-labs/central";
import MessageModel from "./MessageModel.js";

const InitMessageViewModel = () => {
  const { set, subscribe, update } = writable([]);
  const syncReady$ = writable(false);
  let syncReady = false;
  const unsubscribes = [];
  unsubscribes.push(
    MessageModel.subscribe((res) => set(res)),
    MessageBus.subscribe(async (msg) => {
      if ((msg.message = "REFRESH" && msg.payload === "events")) {
        console.log("caught refresh. refresshing", msg);
        await MessageModel.refresh();
        console.log("Refreshed MessageModel");
      } else {
        console.log("not refreshing", msg);
      }
    })
  );
  const methods = {
    async init() {
      return new Promise((res, rej) => {
        const messagesSchema = MessageModel.schema;
        bootstrap(messagesSchema).then(() => {
          syncReady$.update((sync) => {
            MessageModel.refresh();
            console.log("MessagesState Ready for Syncing");
            this.syncReady = true;
            return true;
          });
          res(true);
        });
      });
    },
    async addBatch(messages) {
      if (this.syncReady) {
        await messages.reduce(async (acc, curr) => {
          const prevAcc = await acc;
          await this.add(curr);
          return prevAcc;
        }, Promise.resolve());
      }
    },
    refresh() {
      MessageModel.refresh();
    },
    async sync() {
      sync();
    },
    async add(message) {
      await MessageModel.insert(message);
    },
    delete(id) {
       MessageModel.delete(id)
    },
    unsubscribe() {
      unsubscribes.forEach((f) => f());
    },
  };

  return {
    ...methods,
    set,
    update,
    subscribe,
  };
};

const messageViewModel = InitMessageViewModel();

export default messageViewModel;
