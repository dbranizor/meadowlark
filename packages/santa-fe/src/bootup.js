import Message from "./components/messages/MessageViewModel.js";
import Table from "./components/tables/table-state.js";
import { setEnvironment, start,  registerApply} from "@meadowlark-labs/central";
import messageViewModel from "./components/messages/MessageViewModel.js";
const MessageCatalog = {
  Message,
  Table,
};

const applyFunc = () => {
  messageViewModel.refresh();
}
const santaFe = (
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
  });
  if (init) {
    registerApply(applyFunc)
    /**Setup local database */
    // start().then(() => _localized(...localized));
    _localized(...localized).then(() => start());
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
        console.log("dingo localized called", curr);
        await MessageCatalog[curr].init();
      }
      return prev;
    }, Promise.resolve());
    res();
  });
};

export { santaFe, MessageCatalog };
