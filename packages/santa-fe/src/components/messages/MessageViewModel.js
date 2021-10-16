import { writable, bootstrap, insert, sync } from "@meadowlark-labs/central";
import MessageModel from "./MessageModel.js";

const InitMessageViewModel = () => {
  const { set, subscribe, update } = writable([]);
  const syncReady$ = writable(false);
  let syncReady = false;
  const unsubscribes = [];
  unsubscribes.push(MessageModel.subscribe(res => set(res)))
  const methods = {
    async init() {
      const messagesSchema = MessageModel.schema;
      await bootstrap(messagesSchema);
      syncReady$.update((sync) => {
        MessageModel.refresh();
        console.log("MessagesState Ready for Syncing");
        syncReady = true;
        return true;
      });
    },
    async addBatch(messages) {
      console.log('dingo is sync ready?', this.syncReady)
      if (syncReady) {
        console.log('dingo starting message message apply')
        await messages.reduce(async (acc, curr) => {
          const prevAcc = await acc;
          await this.add(curr);
          return prevAcc;
        }, Promise.resolve())
        console.log('dingo ending message apply')
      }
    },
    async add(message) {
      if (syncReady) {
        await MessageModel.insert(message);
      } else {
        console.error("Error Adding Message. Sync Not Ready", this.syncReady);
      }
    },
    unsubscribe() {
      unsubscribes.forEach((f) => f());
    }

  }

  return {
    ...methods,
    set,
    update,
    subscribe
  }

}

const messageViewModel = InitMessageViewModel();

export default messageViewModel;
