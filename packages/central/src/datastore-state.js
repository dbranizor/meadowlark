import { writable } from "./store";
const InitDataStore = (schema) => {
  const storeNames = Object.keys(schema).reduce(
    (acc, key) => [...acc, key],
    []
  );
  console.log("Creating Stores", storeNames);
  const stores = storeNames.reduce((acc, curr) => {
    const { set, subscribe, update } = writable([]);
    acc[curr].subscribe = subscribe;
    acc[curr].update = update;
    acc[curr].set = set;
    return acc;
  }, {});
  console.log("dingo stores", stores);
  return stores;
};

export default InitDataStore;