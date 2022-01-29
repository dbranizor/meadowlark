import IndexedDBBackend from "absurd-sql/dist/indexeddb-backend.js";
import { SQLiteFS } from "absurd-sql";

export class WebDao {
  _db;
  _path = "/sql/db.sqlite";
  _cacheSize = 5000;
  _pageSize = 8192;
  _SQL = null;
  _sqlFS = null;

  constructor() {}

  async init(initSqlJs) {
    this._SQL = await initSqlJs({ locateFile: (file) => file });
    this._sqlFS = new SQLiteFS(this._SQL.FS, new IndexedDBBackend());
    this._SQL.register_for_idb(this._sqlFS);

    this._SQL.FS.mkdir("/sql");
    this._SQL.FS.mount(this._sqlFS, {}, "/sql");
  }
  async open() {
    if (typeof SharedArrayBuffer === "undefined") {
      let stream = this._SQL.FS.open(this._path, "a+");
      await stream.node.contents.readIfFallback();
      this._SQL.FS.close(stream);
    }

    this._db = new this._SQL.Database(this._path, { filename: true });
    this._db.exec(`
        PRAGMA cache_size=-${this._cacheSize};
        PRAGMA page_size=${this._pageSize};
        PRAGMA journal_mode=MEMORY;
      `);
    console.log("Created db");
    this._db.exec("VACUUM");
  }

  close() {
    if (this._db) {
      console.log("MUST HAVE BEEN ERROR! CLOSING DATABASE TO REPOEN!");
      this._db.close();
      this._db = null;
    }
  }

  prepare(sql) {
    return this._db.prepare(sql);
  }
  async runPrepare(prep, args = [], fn) {
    try {
      prep.run([...args]);
    } catch (error) {
      this.close();
      await this.open();
      prep.run([...args]);
      return fn && fn();
    }
    return fn && fn();
  }

  async handleLock() {
    this.close();
    await this.open();
  }
  async exec(sql) {
    try {
      this._db.exec(sql);
    } catch (error) {
      if (sql !== "COMMIT") {
        await this.handleLock();
        this._db.exec(sql);
      }
    }
  }
  async run(sql) {
    console.log('dingo running sql', sql)
    try {
      this._db.run(sql);
    } catch (error) {
      if (sql !== "COMMIT") {
        await this.handleLock();
        this._db.run(sql);
      }
    }
  }

  queryAll(sql, params = {}) {
    let q = this.buildPreparedStatement(sql, Object.keys(params));
    let stmt = this.prepare(q);
    stmt.bind({ ...params });
    let rows = [];
    while (stmt.step()) {
      rows = [...rows, stmt.getAsObject()];
    }
    console.log("Here is a queryAll rows: " + JSON.stringify(rows));
    return rows;
  }
  queryObj(sql, params = {}) {
    let returnObject;
    const s = this.buildPreparedStatement(sql, Object.keys(params));
    let stmt = this._db.prepare(s);
    returnObject = stmt.getAsObject(params);

    return returnObject;
  }

  buildPreparedStatement(query, fields = []) {
    if (!fields || !fields.length) {
      return query;
    }
    /** Query starts as select * from something WHERE ? */
    const nq = fields.reduce((acc, curr) => {
      let accQuery = acc.replace("?", curr);
      return accQuery;
    }, query);
    return nq;
  }
}

export default WebDao;
