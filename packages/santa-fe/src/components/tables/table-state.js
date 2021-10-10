import { writable, bootstrap, insert } from "@meadowlark-labs/central";

const TableSchema = {
  table: {
    id: "TEXT",
    name: "TEXT",
    COI: "TEXT",
  },
  column: {
    id: "TEXT",
    name: "TEXT",
    order: "NUMBER",
    table_id: "TEXT",
  },
};

const InitTableState = function () {
  const { set, update, subscribe } = writable({});

  const SyncReady = writable(false);
  const methods = {
    init: async function (schema) {
      console.log("dingo table state running update", schema);
      await bootstrap(schema);
      console.log("dingo TABLE state ran update", schema);
      return SyncReady.update((sync) => {
        console.log("dingo TABLE state sync being set", sync);
        return true;
      });
    },
  };

  return {
    set,
    subscribe,
    update,
    ready: SyncReady,
    ...methods,
  };
};

const TableState = InitTableState();

export default TableState;
