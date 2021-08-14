import { writable } from "svelte/store";

const SchemaStoreInit = () => {
  const { update, set, subscribe } = writable({});

  const methods = {
    add(name, value) {
      update((schema) => (schema[name] = value));
    },
    remove(id) {
      update((schema) => delete schema[id]);
    },
  };
  return {
    set,
    update,
    subscribe,
    ...methods,
  };
};

const SchemaStore = SchemaStoreInit();

export default SchemaStore;
