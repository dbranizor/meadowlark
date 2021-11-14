import { writable } from "./store.js";

const initMessageBus = () => {
  const { set, update, subscribe } = writable({});
  const methods = {
    publish(message) {
      set(message);
    },
  };
  return {
    set,
    update,
    subscribe,
    ...methods,
  };
};

const messageBus = initMessageBus();

export default messageBus;
