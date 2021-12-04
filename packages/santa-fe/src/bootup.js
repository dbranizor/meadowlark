import Message from "./components/messages/MessageViewModel.js";
import Table from "./components/tables/TableViewModel.js";
import {
  setEnvironment,
  startClock,
  registerApply,
  startDatabase,
} from "@meadowlark-labs/central";
import messageViewModel from "./components/messages/MessageViewModel.js";
import TableViewModel from "./components/tables/TableViewModel.js";
const MessageCatalog = {
  Message,
  Table,
};

const applyFunc = () => {
  TableViewModel.refresh();
  // messageViewModel.refresh();
};
const santaFe = async (
  { localized, group_id, user_id, syncDisabled, sync_url, debug, isOffline },
  init = true
) => {
  setEnvironment({
    group_id,
    user_id,
    syncDisabled,
    sync_url,
    debug,
    isOffline,
    encryption: true,
  });
  if (init) {
    registerApply(applyFunc);
    try {
      console.log("starting Database");
      await startDatabase();
      console.log("starting localized");
      await _localized(...localized);
      console.log("staring clock");
      await startClock();
      console.log("Finished Initializing");
    } catch (error) {
      console.error("Error Initializing");
      console.log("dingo starting clock");
      startClock();
    }

    /**Setup local database */
    // start().then(() => _localized(...localized));
  }
};

const _localized = async function (components) {
  return new Promise(async (res, rej) => {
    const args = Array.prototype.slice.call(arguments);
    await args.reduce(async (acc, curr) => {
      let prev = await acc;
      if (Array.isArray(curr)) {
        const component = curr[0];
        const argument = curr[1];
        await MessageCatalog[component].init(argument);
      } else {
        await MessageCatalog[curr].init();
      }
      return prev;
    }, Promise.resolve());
    res();
  });
};

export { santaFe, MessageCatalog };
