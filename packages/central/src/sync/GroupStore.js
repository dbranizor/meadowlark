import { writable } from "svelte/store";
const GroupStoreInit = () => {
  const { set, subscribe, update } = writable([]);
  const methods = {
    add(group) {
      update((groups) => [...groups, group]);
    },
    remove(id) {
      update((groups) => groups.filter((g) => g.id !== id));
    },
  };
  return {
    set,
    subscribe,
    update,
    ...methods,
  };
};

const GroupStore = GroupStoreInit();

export default GroupStore;
