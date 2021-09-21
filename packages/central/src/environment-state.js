import { writable } from "./store.js";
export const InitEnvironmentState = () => {
  const { set, subscribe, update } = writable({});


  return {
    set,
    subscribe,
    update,
  };
};

const EnvironmentState = InitEnvironmentState();
export default EnvironmentState;
