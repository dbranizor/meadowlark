import {
  insert,
  select,
  writable,
  _delete,
  update as _update,
  getWorker,
} from "@meadowlark-labs/central";

let getSchemaChanges = (schema1, schema2) => {
  let updates = Object.keys(schema1)
    .filter((s) => schema2[s] !== undefined)
    .reduce((acc, curr) => {
      console.log("dingo in reduce", curr);
      Object.keys(schema1[curr]).forEach((v) => {
        const update = { table: curr, column: v, type: schema1[curr][v] };
        if (!schema2[curr][v] && !acc.includes(update)) {
          acc = [...acc, update];
        }
      });
      return acc;
    }, []);

  let creates = Object.keys(schema1)
    .filter((s) => schema2[s] === undefined)
    .map((key) => ({ [key]: schema1[key] }));

  return { updates, creates };
};

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
    async updateSchema(schema) {
      console.log('dingo tm')
      let updates = getSchemaChanges(schema, _schema);
      getWorker();
      return new Promise((res, rej) => {
        if (updates.creates) {
          window.worker.postMessage({
            type: "ui-invoke",
            name: "init",
            arguments: updates.creates,
          });
          return window.worker.addEventListener("message", function (e) {
            if (e.data.type === "INITIALIZED_APP") {
              if (updates.updates && updates.updates.length) {
                window["worker"].postMessage({
                  type: "UPDATE_SCHEMA",
                  arguments: updates.updates,
                });
                return window.worker.addEventListener("message", function (e) {
                  if (e.data.type === "UPDATED_SCHEMA") {
                    console.log("Updated Schema");
                    res();
                  }
                });
              } else {
                res();
              }
            }
          });
        } else {
          if (updates.updates && updates.updates.length) {
            window["worker"].postMessage({
              type: "UPDATE_SCHEMA",
              arguments: updates.updates,
            });
            return window.worker.addEventListener("message", function (e) {
              if (e.data.type === "UPDATED_SCHEMA") {
                console.log("Updated Schema");
                res();
              }
            });
          } else {
            res();
          }
        }
      });
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
