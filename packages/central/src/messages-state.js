import { writable } from "./store";

const initMessageState = () => {
  const { set, subscribe, update } = writable([]);
  const methods = {
    add(message) {
      update((messages) => [...messages, message]);
    },
    remove(message) {
      update((messages) =>
        messages.filter(
          (m) =>
            m.row !== message.row &&
            m.column !== message.column &&
            message.dataset !== m.dataset
        )
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

const MessageState = initMessageState();
export default MessageState;
