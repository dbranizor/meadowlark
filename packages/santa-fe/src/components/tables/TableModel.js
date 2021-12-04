import {
  insert,
  select,
  writable,
  _delete,
  update as _update,
} from "@meadowlark-labs/central";

const InitTableModel = () => {
  let _schema = {};
  let _rows = {};
  const schema$ = writable(_schema);
  const { set, subscribe, update } = writable({});
  const methods = {
    async insert(message, table) {
      const recordID = await insert(table, message);
      _rows[table] = [..._rows[table], message];
      set(JSON.parse(JSON.stringify(_rows)));
    },
    async refresh(table = false) {
      if (table) {
        const query = `SELECT * FROM ${table} WHERE tombstone <> 1;`;
        const res = await select(query);
        console.log(
          "TableModel Picked Up Records. Updating ViewModel",
          JSON.stringify(res)
        );
        _rows[table] = res;
        set(JSON.parse(JSON.stringify(_rows)));
        return true;
      }
      Object.keys(_schema).forEach(async (key) => {
        const query = `SELECT * FROM ${key} where tombstone <> 1`;
        const res = await select(query);
        console.log(
          "TableModel Picked Up Dynamic Records. Updating ViewModel",
          JSON.stringify(res),
          _rows,
          key
        );
        _rows[key] = res;
        set(JSON.parse(JSON.stringify(_rows)));
      });
      return true;
    },
    async delete(id, table) {
      await _delete(table, id);
      await methods.refresh(table);
    },
    async update(row, table) {
      _update(table, row);
    },
    setSchema(schema) {
      _schema = schema;
      Object.keys(_schema).forEach((key) => {
        _rows[key] = [];
      });
      set(JSON.parse(JSON.stringify(_rows)));
      schema$.set(JSON.parse(JSON.stringify(_schema)));
    },
  };

  return {
    set,
    subscribe,
    update,
    schema$,
    ...methods,
  };
};

const TableModel = InitTableModel();

export default TableModel;
