import { writable } from "./store";
export const InitEnvironmentState = () => {
  const { set, subscribe, update } = writable({ debug: true });
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
