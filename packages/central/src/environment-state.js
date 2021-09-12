import { writable } from "./store";
export const InitEnvironmentState = () => {
  const { set, subscribe, update } = writable({
    debug: true,
    syncUrl: "https://localhost/central-park",
    syncEnabled: true,
    group_id: "meadowlark",
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
