// import { buildSchema } from "../src/database.js";
import { expect } from "chai";
import Database from "better-sqlite3";

function openDb(filename) {
  const db = new Database("test-db", { ":memory:": true });
  // Some initialization
  return db;
}

function createTable(db) {
  const sqlMessages = `CREATE TABLE if not exists messages
  (
   id TEXT,
   timestamp TEXT,
   group_id TEXT,
   dataset TEXT,
   row TEXT,
   column TEXT,
   value TEXT,
   PRIMARY KEY(id))`;
  db.exec(sqlMessages);
}
import { MutableTimestamp, Timestamp } from "../src/timestamp.js";
import { getClock, makeClock, setClock } from "../src/clock.js";
import { makeClientId } from "../src/Utilities.mjs";
describe("Database functions", () => {
  let testDB;
  beforeEach(function () {
    testDB = openDb();
    createTable(testDB);
  });
  // it("should build schema", () => {
  //     const tables = {
  //         "Events" : {
  //             "id" : "BLOB",
  //             "msg" : "text",
  //             "cat" : "text",
  //             "coe" : "BLOB"
  //         }
  //     }

  //     const statement = buildSchema(tables);
  //     expect(statement).toBeDefined();
  //     expect(statement.Events).toBeDefined();
  //     expect(statement.Events).toEqual("CREATE TABLE IF NOT EXISTS ( id BLOB, msg text, cat text, coe BLOB)")
  // })

  it("Should work with a database", () => {
    expect(true).to.equal(true);
    const fooBar = {
      foo: "bar1",
      bar: "foo1",
      bas: "foobar1",
    };
    setClock(makeClock(new Timestamp(0, 0, makeClientId(true))));

    const clock = getClock();
    expect(clock).to.not.be.undefined;
    expect(clock.timestamp.millis()).to.not.be.undefined;
    const timestamp = Timestamp.send(clock).toString();
    expect(typeof timestamp).to.equal("string");
    const fields = Object.keys(fooBar);
    const messages = [
      ...fields.map((f, i) => ({
        id: `${f}-${i}`,
        dataset: "foobar",
        row: 1,
        column: f,
        value: fooBar[f],
        group_id: "foobazz",
        timestamp: Timestamp.send(getClock()).toString(),
      })),
    ];
    const db = openDb();
    expect(db).to.not.be.undefined;

    messages.forEach((m) => {
      const sql =
        `INSERT INTO MESSAGES(id, timestamp, group_id, dataset, row, column, value)` +
        `values('${m.id}', '${m.timestamp}', '${m.group_id}', '${m.dataset}', '${m.row}', '${m.column}', '${m.value}');`;
      db.exec(sql);
    });
    const results = db.exec(`SELECT * FROM MESSAGES ORDER BY timestamp DESC`);
    expect(results).to.not.be.undefined;
  });
});
