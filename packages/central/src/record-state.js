import { writable } from "./store.js";

const InitRecordStore = () => {
  const { set, update, subscribe } = writable({});
  const methods = {
    remove(dataset, id) {
      update((ds) => {
        if (!ds[dataset]) {
          throw new Error(`Error: Dataset not there ${dataset}`);
        }
        ds[dataset] = ds[dataset].filter((r) => r.id !== id);
        return ds;
      });
    },
    add(dataset, record) {
      update((ds) => {
        if (!ds[record]) {
          ds[dataset] = [record];
        } else {
          ds[dataset] = [...ds[dataset], record];
        }
        return ds;
      });
    },
  };
  return {
    set,
    update,
    subscribe,
    methods,
  };
};

const RecordStore = InitRecordStore();

export default RecordStore;
