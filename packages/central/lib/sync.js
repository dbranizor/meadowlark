import initSqlJs from "@jlongster/sql.js";
// import { SQLiteFS } from '../..';
import { SQLiteFS } from "absurd-sql";
// import IndexedDBBackend from '../../indexeddb/backend';
import IndexedDBBackend from "absurd-sql/dist/indexeddb-backend.js";
import {
  buildSchema,
  Timestamp,
  merkle,
  deserializeValue,
} from "@meadowlark-labs/central";

// Various global state for the demo

let currentBackendType = "idb";
let cacheSize = 5000;
let pageSize = 8192;
let dbName = `meadowlark.sqlite`;

let fakeValue = 0;

let idbBackend = new IndexedDBBackend();
let sqlFS;

// Helper methods

let SQL = null;
let ready = null;

const sqlMessages = `CREATE TABLE if not exists messages
  (
   id TEXT,
   timestamp TEXT,
   group_id TEXT,
   dataset TEXT,
   row TEXT,
   column TEXT,
   value TEXT,
   PRIMARY KEY(timestamp, row, column))`;

const sqlMessageMerkles = `CREATE TABLE if not exists messages_merkles
   (group_id TEXT PRIMARY KEY,
    merkle TEXT);`;

async function _init() {
  console.log("dingo setting up db");
  SQL = await initSqlJs({ locateFile: (file) => file });
  sqlFS = new SQLiteFS(SQL.FS, idbBackend);
  SQL.register_for_idb(sqlFS);

  SQL.FS.mkdir("/blocked");
  SQL.FS.mount(sqlFS, {}, "/blocked");
  fakeValue = 100;
  return true;
}

async function init(schema = false) {
  console.log("dingo called init", schema, ready);
  if (ready && schema) {
    await handleSchema(schema);
    self.postMessage({ type: "initialized_database" });
    return ready;
  }

  if (ready) {
    self.postMessage({ type: "initialized_database" });
    return ready;
  }

  ready = await _init();
  console.log("dingo building tables", sqlMessages);
  run(sqlMessages);
  run(sqlMessageMerkles);
  return self.postMessage({ type: "initialized_database" });
}

function output(msg) {
  self.postMessage({ type: "output", msg });
}

function getDBName() {
  return dbName;
}

let _db = null;
function closeDatabase() {
  if (_db) {
    output(`Closed db`);
    _db.close();
    _db = null;
  }
}

async function getDatabase() {
  if (_db == null) {
    console.log("dingo creating db", fakeValue);
    _db = new SQL.Database(`/blocked/${getDBName()}`, { filename: true });

    // Should ALWAYS use the journal in memory mode. Doesn't make
    // any sense at all to write the journal
    //
    // It's also important to use the same page size that our storage
    // system uses. This will change in the future so that you don't
    // have to worry about sqlite's page size (requires some
    // optimizations)
    _db.exec(`
      PRAGMA cache_size=-${cacheSize};
      PRAGMA page_size=${pageSize};
      PRAGMA journal_mode=MEMORY;
    `);
    console.log("dingo created db");
    _db.exec("VACUUM");
    console.log("dingo sending initialized message");
    self.postMessage({ type: "initialized" });
    output(
      `Opened ${getDBName()} (${currentBackendType}) cache size: ${cacheSize}`
    );
    console.log("dingo ran all the db shit");
  } else {
    console.log("dingo sending initialized message");
    self.postMessage({ type: "initialized" });
  }
  return _db;
}

function formatNumber(num) {
  return new Intl.NumberFormat("en-US").format(num);
}

async function fetchJSON(url) {
  let res = await fetch(url);
  return res.json();
}

async function load() {
  let db = await getDatabase();

  let storyIds = await fetchJSON(
    "https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty"
  );

  let stories = await Promise.all(
    storyIds
      .slice(0, 10)
      .map((storyId) =>
        fetchJSON(
          `https://hacker-news.firebaseio.com/v0/item/${storyId}.json?print=pretty`
        )
      )
  );

  let results = [];
  for (let story of stories) {
    let comments = story.kids;

    if (comments && comments.length > 0) {
      for (let commentId of comments.slice(0, 10)) {
        let comment = await fetchJSON(
          `https://hacker-news.firebaseio.com/v0/item/${commentId}.json?print=pretty`
        );

        if (comment && comment.text) {
          results.push({
            id: commentId,
            text: comment.text,
            storyId: story.id,
            storyTitle: story.title,
          });
        }
      }
    }
  }

  db.exec("BEGIN TRANSACTION");
  let stmt = db.prepare(
    "INSERT INTO comments (content, url, title) VALUES (?, ?, ?)"
  );
  for (let result of results) {
    let url = `https://news.ycombinator.com/item?id=${result.id}`;
    stmt.run([result.text, url, result.storyTitle]);
  }
  db.exec("COMMIT");
  console.log("done!");

  count();
}

async function search(term) {
  let db = await getDatabase();

  if (!term.includes("NEAR") && !term.match(/"\*/)) {
    term = `"*${term}*"`;
  }

  let results = [];

  let stmt = db.prepare(
    `SELECT snippet(comments) as content, url, title FROM comments WHERE content MATCH ?`
  );
  stmt.bind([term]);
  while (stmt.step()) {
    let row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();

  self.postMessage({ type: "results", results });
}

async function count() {
  let db = await getDatabase();

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS comments USING fts3(content, title, url);
  `);

  let stmt = db.prepare("SELECT COUNT(*) as count FROM comments");
  stmt.step();
  let row = stmt.getAsObject();
  self.postMessage({ type: "count", count: row.count });

  stmt.free();
}

async function run(statement) {
  let db = await getDatabase();
  try {
    console.log("dingo running statement: ", statement);
    db.run(statement);
  } catch (error) {
    console.error(`error: ${error}`);
  }
}

const rowMapper = (result) => {
  return result && result.length
    ? result[0].values.map((c, i) => {
        const obj = Object.keys(c).reduce((acc, curr, i) => {
          acc[result[0].columns[i]] = c[curr];
          return acc;
        }, {});
        return obj;
      })
    : [];
};

function buildPreparedStatement(query, fields = []) {
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

export function queryAll(db, sql, params = {}) {
  let q = buildPreparedStatement(sql, Object.keys(params));
  let stmt = db.prepare(q);
  stmt.bind({ ...params });
  let rows = [];
  while (stmt.step()) {
    rows = [...rows, stmt.getAsObject()];
  }
  console.log("Here is a queryAll rows: " + JSON.stringify(rows));
  return rows;
}

export function queryObj(db, sql, params = {}) {
  const s = buildPreparedStatement(sql, Object.keys(params));
  let stmt = db.prepare(s);
  return stmt.getAsObject(params);
}

export function getMerkle(db, group_id) {
  let obj = queryObj(db, "SELECT * FROM messages_merkles WHERE group_id = ?", {
    $group_id: group_id,
  });

  if (obj.merkle) {
    return JSON.parse(obj.merkle);
  } else {
    return {};
  }
}

function queryRun(db, sql, params = {}) {
  let stmt = db.prepare(sql);
  return stmt.run(params);
}

async function handleInsertMessages(group_id, messages) {
  // get trie
  
  const db = await getDatabase();
  let trie =  getMerkle(db, group_id);
  queryRun(db, "BEGIN");

  try {
    for (let message of messages) {
      const s =
        `INSERT OR IGNORE INTO messages(timestamp, group_id, dataset, row, column, value)` +
        `values(?, ?, ?, ?, ?, ?);`;
      const params = {
        $timestamp: message.timestamp,
        $group_id: group_id,
        $dataset: message.dataset,
        $row: message.row,
        $column: message.column,
        $value: message.value,
      };
      const bs = buildPreparedStatement(s, Object.keys(params));
      const ps = db.prepare(bs);
      const result = ps.run(params);
      // TODO: Debug this so that I can check that result === 1
      if (result) {
        console.log("INSERTING MESSAGE INTO MERKLE");
        trie = merkle.insert(trie, Timestamp.parse(message.timestamp));
      }

    }

    const mp = {
      $group_id: group_id,
      $merkle: JSON.stringify(trie),
    };

    const ms = buildPreparedStatement(
      `INSERT OR REPLACE INTO messages_merkles(group_id, merkle)values(?,?)`,
      mp
    );

    // update merkle tree table row
    queryRun(db, ms, mp);
    queryRun(db, "COMMIT");
  } catch (error) {
    queryRun(db, "ROLLBACK");
    throw error;
  }


  self.postMessage({ type: "INSERT_MESSAGE", results: JSON.stringify(trie) });
}

async function handleGetMostRecent(message) {
  const db = await getDatabase();
  // let results;

  // const s = `SELECT * FROM messages WHERE dataset = '${message.dataset}' AND row = '${message.row}' AND column = '${message.column}' ORDER BY timestamp;`;
  // try {
  //   console.log("dingo this is the database in browser", db);
  //   results = db.exec(s);
  // } catch (error) {
  //   throw new Error(`ERROR: ${error}`);
  // }
  // results = rowMapper(results);

  const result = queryObj(
    db,
    `SELECT * FROM messages WHERE dataset = ? AND row = ? AND column = ? ORDER BY timestamp DESC;`,
    { $message: message.dataset, $row: message.row, $column: message.column }
  );
  const record = !result.column ? false : result;
  self.postMessage({ type: "MOST_RECENT_LOCAL_MESSAGES", results: record });
}

async function handleSchema(schema = {}) {
  console.log("dingo running handleSchema", schema);
  const statement = buildSchema(schema);
  console.log("dingo built schema", statement);
  return Promise.all(
    Object.keys(statement).map(async (key) => {
      console.log(`Initing Table: ${key}`);
      await run(statement[key]);
      return;
    })
  );
}

async function handleApply(message) {
  const sql = `SELECT * from ${message.dataset} where id = '${message.row}';`;
  const params = {
    $dataset: message.dataset,
    $row: message.row,
  };
  const db = await getDatabase();
  const record = queryObj(
    db,
    `SELECT * FROM ${message.dataset} WHERE id = '${message.row}'`
  );
  console.log("dingo handle apply?", message);

  console.log("upserting message to tables", message);
  if (!record.id) {
    // const s = `INSERT INTO ${message.dataset}(id, ${message.column}) VALUES ('${message.row}', '${message.value}');`;
    const insertParams = {
      $dataset: message.dataset,
      $column: message.column,
      $row: message.row,
      $value: deserializeValue(message.value),
    };
    queryRun(
      db,
      `INSERT INTO ${insertParams.$dataset}(id, ${insertParams.$column}) VALUES ('${insertParams.$row}', '${insertParams.$value}');`
    );
    console.log("dingo apply sql", sql);
  } else {
    try {
      // const sql = `UPDATE ${message.dataset} SET ${message.column} = '${message.value}' WHERE id = '${message.row}' `;
      const updateParams = {
        $dataset: message.dataset,
        $column: message.column,
        $value: deserializeValue(message.value),
        $row: message.row,
      };
      queryRun(
        db,
        `UPDATE ${updateParams.$dataset} SET ${updateParams.$column} = '${updateParams.$value}' WHERE id = '${updateParams.$row}'`
      );
      console.log("dingo update sql", sql);
    } catch (error) {
      throw new Error(`Error: `, error);
    }
  }

  self.postMessage({ type: "APPLIED" });
}

async function handleApplies(messages = []) {
  const db = await getDatabase();
  console.log("dingo running handleAPplies", messages);

  await messages.reduce(async (acc, curr) => {
    console.log("dingo awaiting acc");
    await acc;
    console.log("dingo acc");
    const sql = `SELECT * from ${curr.dataset} where id = '${curr.row}';`;
    let row;
    try {
      row = await get(sql);
    } catch (error) {
      throw new Error(`Error: `, error);
    }
    console.log("HandleRow Set Row Dingo", row, curr);
    if (!row || !row.length) {
      const sql = `INSERT INTO ${curr.dataset}(id, ${curr.column}) VALUES ('${curr.row}', '${curr.value}');`;
      console.log("dingo sql", sql);
      try {
        await run(sql, false);
      } catch (error) {
        throw new Error(`Error: `, error);
      }
    } else {
      try {
        const sql = `UPDATE ${curr.dataset} SET ${curr.column} = '${curr.value}' WHERE id = '${curr.row}' `;
        await run(sql, false);
      } catch (error) {
        throw new Error(`Error: `, error);
      }
    }
    return acc;
  }, Promise.resolve());
  console.log("Applied Message");
  return true;
}

let methods = {
  init,
  load,
  search,
  count,
};

if (typeof self !== "undefined") {
  self.onmessage = async (msg) => {
    let db;
    switch (msg.data.type) {
      case "search":
        search(msg.data.name);
        break;
      case "db-run":
        run(msg.data.sql);
        break;
      case "RUN_APPLY":
        handleApply(msg.data.message);
        break;
      case "db-apply":
        try {
          await handleApplies(msg.data.messages);
        } catch (error) {
          throw new Error(`Error :`, error);
        }
        const results = await get(
          `SELECT * FROM ${msg.data.messages[0].dataset};`
        );
        console.log("dingo gotz results", results);
        self.postMessage({ type: "applied-messages", results });
        break;
      case "GET_MOST_RECENT_LOCAL_MESSAGES":
        handleGetMostRecent(msg.data.message);
        break;
      case "RUN_INSERT_MESSAGES":

        handleInsertMessages(msg.data.group_id, msg.data.message);
        break;
      case "GET_MERKLE":
        console.log("Getting Merkle", msg.data.group_id);
        if(!db){
          db = await getDatabase()
        }
        let trie = await getMerkle(db, msg.data.group_id);
        self.postMessage({ type: "MERKLE", results: trie });
        break;
      case "db-get-messages":
        get("SELECT * FROM MESSAGES ORDER BY TIMESTAMP DESC");
        break;
      case "SELECT_ALL":
        db = await getDatabase();
        const selectResults = queryAll(db, msg.data.sql);
        self.postMessage({ type: "SELECT", results: selectResults });
        break;
      case "db-init":
        break;
      case "db-sorted-messages":
        db = await getDatabase();
        console.log("DINGO SORTING IN SORT DB THREAD");
        const sortedMessages = queryAll(
          db,
          `SELECT * FROM messages ORDER BY timestamp DESC`
        );
        console.log("dingo got results!!!", sortedMessages);
        self.postMessage({ type: "sorted-messages", sortedMessages });
        break;
      case "ui-invoke":
        if (methods[msg.data.name] == null) {
          throw new Error("Unknown method: " + msg.data.name);
        }
        console.log("dingo running ui-invoke", msg.data);
        if (msg.data.arguments) {
          methods[msg.data.name](msg.data.arguments);
        } else {
          methods[msg.data.name]();
        }

        break;
    }
  };
} else {
  for (let method of Object.keys(methods)) {
    let btn = document.querySelector(`#${method}`);
    if (btn) {
      btn.addEventListener("click", methods[method]);
    }
  }
  init();
}
