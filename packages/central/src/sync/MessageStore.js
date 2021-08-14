import { writable } from "svelte/store";

export const MessageStoreInit = () => {
  const { set, subscribe, update } = writable({});
  const methods = {
    /**
     *
     * @param message {crdt}
     */
    addBatch(messages, group) {
      update((m) => {
        const oldMessages = m[group] || [];
        const newMessages = messages.filter(
          (m) =>
            !oldMessages.some(
              (om) =>
                om.column === m.column &&
                om.row === m.row &&
                om.value === m.value
            )
        );
        if (m[group]) {
          m[group] = [...m[group], ...newMessages];
        } else {
          m[group] = [...newMessages];
        }
        return m;
      });
    },
    /**
     * @param message {crdt}
     */
    delete(message, group) {
      update((msg) => msg[group].filter((m) => m.id !== message.id));
    },
    /**
     * @param message{crdt}
     */
    update(message, group) {
      update((msg) =>
        msg[group].map((m) => (m.id === message.id ? message : m))
      );
    },
  };

  return {
    set,
    subscribe,
    update,
    ...methods,
  };
};
const MessageStore = MessageStoreInit();
export default MessageStore;
