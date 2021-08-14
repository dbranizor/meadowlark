import { writable } from "svelte/store";

const SelectionStoreInit = () => {
  const { update, set, subscribe } = writable({});

  const methods = {
    add(name, value) {
      update((select) => (select[name] = value));
    },
    remove(id) {
      update((select) => delete select[id]);
    },
  };

  return {
    update,
    set,
    subscribe,
    ...methods,
  };
};

const SelectionStore = new SelectionStoreInit();
export default SelectionStore;
