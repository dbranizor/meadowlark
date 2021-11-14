// import { buildSchema } from "../src/database.js";
import { expect } from "chai";
import {describe, beforeEach, afterEach, it} from "mocha"
import Database from "better-sqlite3";

// import { MutableTimestamp, Timestamp } from "../src/timestamp.js";
// import { getClock, makeClock, setClock } from "../src/clock.js";
// import { makeClientId } from "../src/Utilities.mjs";

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

describe("Database functions", () => {
  let testDB;

  it("should be true", () => expect(true).to.be.true)
  // beforeEach(function () {
  //   testDB = openDb();
  //   createTable(testDB);
  // });
  // afterEach(function(){
  //   testDB.exec(`DROP TABLE messages;`);
  // })

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

  // it("Should work with a database", () => {
  //   expect(true).to.equal(true);
  //   const fooBar = {
  //     foo: "bar",
  //     bar: "foo",
  //     bas: "foobar",
  //   };
  //   setClock(makeClock(new Timestamp(0, 0, makeClientId(true))));

  //   const clock = getClock();
  //   expect(clock).to.not.be.undefined;
  //   expect(clock.timestamp.millis()).to.not.be.undefined;
  //   const timestamp = Timestamp.send(clock).toString();
  //   expect(typeof timestamp).to.equal("string");
  //   const messages = [...createMessages({row: fooBar, group_id: "foobazz", dataset: "foobar"})]
  //   const db = openDb();
  //   expect(db).to.not.be.undefined;

  //   messages.forEach((m) => {
  //     const sql =
  //       `INSERT INTO MESSAGES(id, timestamp, group_id, dataset, row, column, value)` +
  //       `values('${m.id}', '${m.timestamp}', '${m.group_id}', '${m.dataset}', '${m.row}', '${m.column}', '${m.value}');`;
  //     db.exec(sql)
  //   });

  //   const results = db.prepare(`SELECT * FROM MESSAGES ORDER BY timestamp DESC`).all();
  //   expect(results.length).to.equal(3)
    
  //   const fooBar2 = {
  //     foo: "bar-2",
  //     bar: "foo-2",
  //     bas: "foobar-2",
  //   };

  //   const messages2 = [...createMessages({row: fooBar2, group_id: "foobazz", dataset: "foobar"})]
  //   messages2.forEach((m) => {
  //     const sql =
  //       `INSERT INTO MESSAGES(id, timestamp, group_id, dataset, row, column, value)` +
  //       `values('${m.id}', '${m.timestamp}', '${m.group_id}', '${m.dataset}', '${m.row}', '${m.column}', '${m.value}');`;
  //     db.exec(sql)
  //   });
  //   const results2 = db.prepare(`SELECT * FROM MESSAGES ORDER BY timestamp DESC`).all();
  //   expect(results2.length).to.equal(6)

  //   function createMessages({row, group_id, dataset}){
      
  //     return [
  //       ...Object.keys(row).map((f, i) => ({
  //         id: `${row[f]}-${i}`,
  //         dataset,
  //         row,
  //         column: f,
  //         value: row[f],
  //         group_id,
  //         timestamp: Timestamp.send(getClock()).toString(),
  //       })),
  //     ];
  //   }

    

  // });
});


