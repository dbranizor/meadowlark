import { writable } from "./store";
const InitDataStore = () => {
  const { set, update, subscribe } = writable({});

  const methods = {
    addDatastores(schema) {
      if (Array.isArray(schema)) {
        const storeNames = Object.keys(schema).reduce(
          (acc, key) => [...acc, key],
          []
        );
        console.log("Creating Stores", storeNames);
        storeNames.map((st) => update((sch) => (sch[st] = [])));
      } else {
        update((sch) => (sch[schema] = []));
      }
    },
    addRecord(store, record) {
      update((sch) => {
        sch[store] = [...sch[store], record];
      });
    },
  };

  return {
    ...methods,
    set,
    update,
    subscribe,
  };
};

const datastore = InitDataStore();

export default datastore;
