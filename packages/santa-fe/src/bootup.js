import Message from "./components/messages/message-state.js";
import { DatastoreState } from "@meadowlark-labs/central";
const MessageCatalog = {
  Message,
};
const localized = async function (components) {
  return new Promise(async (res, rej) => {
    const args = Array.prototype.slice.call(arguments);
    await args.reduce(async (acc, curr) => {
      const prev = await acc;
      console.log("dingo localized called", curr);
      await MessageCatalog[curr].init();
      return prev;
    }, Promise.resolve());
    res();
  });
};

export { localized, MessageCatalog };
