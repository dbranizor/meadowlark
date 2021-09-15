import { writable } from "./store.js";
export const InitEnvironmentState = () => {
  const { set, subscribe, update } = writable({
    debug: true,
    syncUrl: "https://localhost/central-park",
    syncEnabled: true,
    user_id: false,
    group_id: "meadowlark",
    isOffline: false
  });
  const methods = {
    update(prop) {
      Object.keys(prop).forEach((key) =>
        update((value) => {
          return Object.assign(value, { [key]: prop[key] });
        })
      );
    },
  };

  return {
    ...methods,
    set,
    subscribe,
    update,
  };
};

const EnvironmentState = InitEnvironmentState();
export default EnvironmentState;
