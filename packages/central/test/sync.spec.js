import { expect } from "chai";
import Database from "better-sqlite3";

describe("sync", function () {
  let db;
  beforeEach(function () {
    db = new Database("test-db", { ":memory:": true });
    const table =
      "CREATE TABLE IF NOT EXISTS events('id' text, 'cat' text, 'msg' text, 'coi': text)";
    db.exec(table);
  });

  it("should recieve messages", async () => {
    let events = [
      {
        cat: "test",
        msg: "This is just a test",
        coi: 'people'
      },
      {
        cat: "email",
        msg: "Check your emails",
        coi: 'people'
      },
    ];
  });
});
