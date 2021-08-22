import { EVENTS } from "./enum";
import { makeClientId } from "./Utilities.mjs";
export class DB {
  static insert(table, row, event) {
    const id = makeClientId();
    const fields = Object.keys(row);
    event.postMessage(
      EVENTS.SEND_MESSAGE,
      fields.map((k) => {
        return {
          dataset: table,
          row: row.id || id,
          column: k,
          value: row[k],
          timestamp: Timestamp.send(getClock()).toString(),
        };
      })
    );
  }
  static update(table, params) {}

  static delete(table, id) {}
}

export default DB;