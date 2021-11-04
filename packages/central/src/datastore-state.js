import { writable } from "./store.js";
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
        storeNames.map((st) =>
          update((sch) => {
            sch[st] = [];
            console.log("dingo updating schema single", sch);
            return sch;
          })
        );
      } else {
        update((sch) => {
          sch[schema] = [];
          console.log("dingo updating schema single", sch);
          return sch;
        });
      }
    },
    addRecord(store, record) {
      return update((sch) => {
        console.log(
          "dingo currRecords added to store same value",
          Object.assign(
            { ...sch },
            {
              [store]: [...sch[store], record],
            }
          )
        );
        return Object.assign(
          { ...sch },
          {
            [store]: [...sch[store], record],
          }
        );
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
