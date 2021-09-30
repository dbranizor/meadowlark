import { expect } from "chai";
import Database from "better-sqlite3";

describe("sync", function () {
  let db;
  beforeEach(function () {
    db = new Database("test-db", { ":memory:": true });
    const table =
      "CREATE TABLE IF NOT EXISTS fubar('fu' text, 'bar' text, 'id' text)";
    db.exec(table);
  });

  it("should create tables", async () => {
    const data = `insert into fubar("fu", "bar", "id")values('stuff', 'thatbar','1')`;
    db.exec(data);
    const results = db.prepare("SELECT * FROM fubar").get();
    console.log("dingo results", JSON.stringify(results));
    expect(results).to.not.be.undefined;
  });
});
