import Message from "./components/messages/MessageViewModel.js"
import Table from "./components/tables/table-state.js";
import { DatastoreState } from "@meadowlark-labs/central";
const MessageCatalog = {
  Message,
  Table,
};
const localized = async function (components) {
  return new Promise(async (res, rej) => {
    const args = Array.prototype.slice.call(arguments);
    await args.reduce(async (acc, curr) => {
      let prev = await acc;
      if (Array.isArray(curr)) {
        const component = curr[0];
        const argument = curr[1];
        await MessageCatalog[component].init(argument);
      } else {
        console.log("dingo localized called", curr);
        await MessageCatalog[curr].init();
      }
      return prev;
    }, Promise.resolve());
    res();
  });
};

export { localized, MessageCatalog };
