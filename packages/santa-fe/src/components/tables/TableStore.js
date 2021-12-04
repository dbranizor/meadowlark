import { writable } from "@meadowlark-labs/central";

const InitTableStore = () => {
  const selected$ = writable({});

  const methods = {
    setSelected(id, val) {
      const d = {
        [id]: val,
      };
      selected$.set(d);
    },
  };

  return {
    selected$,
    ...methods,
  };
};

const TableStore = InitTableStore();

export default InitTableStore();
