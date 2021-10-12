import { writable, bootstrap, insert, sync } from "@meadowlark-labs/central";
import MessageModel from "./MessageModel.js";
export class MessageViewModel {
  constructor() {
    this.unsubscribes.push(
      this.syncReady$.subscribe((s) => (this.syncReady = s)),
      MessageModel.subscribe((m) => this.messages.set(m))
    );
  }
  unsubscribes = [];
  messages = writable([]);
  syncReady;
  syncReady$ = writable(false);

  async init() {
    const messagesSchema = MessageModel.schema;
    await bootstrap(messagesSchema);
    this.syncReady$.update((sync) => {
      MessageModel.refresh();
      console.log("MessagesState Ready for Syncing");
      return true;
    });
  }
  async addBatch(messages) {
    if (this.syncReady) {
      messages.map((m) => {
        this.add(m);
      });
    }
  }

  add(message) {
    if (this.syncReady) {
      MessageModel.insert(message);
    } else {
      console.error("Error Adding Message. Sync Not Ready", this.syncReady);
    }
  }

  unsubscribe() {
    this.unsubscribes.forEach((f) => f());
  }
}

export default MessageViewModel;
