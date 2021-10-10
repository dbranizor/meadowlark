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
  const {} = writable({
    tables: [],
  });

  const SyncReady = writable(false);
  const methods = {
    init: async function (scema) {
      console.log("dingo table state running update", schema);
      await bootstrap(TableSchema);
      console.log("dingo message state ran update");
      return SyncReady.update((sync) => {
        console.log("dingo messate state sync being set", sync);
        return true;
      });
    },
    addTable: async function ({ name, coi, columns, id }) {
      let tableColumns = [];
     const cols = await insert("table", { name, coi });
      columns.forEach(async (col, ix) => {
        const column = await insert("column", {
          name: col.name,
          order: ix,
          table_id: id,
        });
        tableColumns = [...tableColumns, column]
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
