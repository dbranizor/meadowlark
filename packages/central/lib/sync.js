import initSqlJs from "@jlongster/sql.js";
// import { SQLiteFS } from '../..';
import { SQLiteFS } from "absurd-sql";
// import IndexedDBBackend from '../../indexeddb/backend';
import IndexedDBBackend from "absurd-sql/dist/indexeddb-backend.js";
import { buildSchema } from "@meadowlark-labs/central";

// Various global state for the demo

let currentBackendType = "idb";
let cacheSize = 5000;
let pageSize = 8192;
let dbName = `fts.sqlite`;

let fakeValue = 0;

let idbBackend = new IndexedDBBackend();
let sqlFS;

// Helper methods

let SQL = null;
let ready = null;

const sqlMessages = `CREATE TABLE if not exists messages
  (timestamp TEXT,
   group_id TEXT,
   dataset TEXT,
   row TEXT,
   column TEXT,
   value TEXT,
   PRIMARY KEY(timestamp, group_id))`;

async function _init() {
  console.log("dingo setting up db");
  SQL = await initSqlJs({ locateFile: (file) => file });
  sqlFS = new SQLiteFS(SQL.FS, idbBackend);
  SQL.register_for_idb(sqlFS);

  SQL.FS.mkdir("/blocked");
  SQL.FS.mount(sqlFS, {}, "/blocked");
  fakeValue = 100;
}

async function init(schema = false) {
  if (ready && schuema) {
    await handleSchema(schema);
    self.postMessage({ type: "initialized_database" });
    return ready;
  }

  if (ready) {
    self.postMessage({ type: "initialized_database" });
    return ready;
  }

  ready = await _init();
  console.log("dingo building tables");
  run(sqlMessages);
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

async function get(statement, post = true) {
  let db = await getDatabase();
  let result;
  console.log("dingo running SQL GET DAO: ", statement);
  try {
    result = db.exec(statement);
  } catch (error) {
    console.error(`error: ${error}`);
  }
  console.log("dingo SQL GET DAO get results: ", result);

  const resturnData = rowMapper(result);

  post ? self.postMessage({ type: "results", results: resturnData }) : post;
  return resturnData;
}

async function handleCompare(messages) {
  const db = await getDatabase();

  let results;

  const datasets = buildINClause(messages.map((m) => m.dataset));
  const rows = buildINClause(messages.map((m) => m.row));
  const columns = buildINClause(messages.map((m) => m.column));

  const SQL = `SELECT * FROM messages where dataset IN(${datasets}) AND ROW IN(${rows}) AND COLUMN IN(${columns})`;

  try {
    results = db.exec(SQL);
  } catch (error) {
    throw new Error(`ERROR: ${error}`);
  }
  results = rowMapper(results);
  self.postMessage({ type: "existing-messages", results });
  function buildINClause(data = []) {
    return data
      .map((d) => `'${d}'`)
      .reduce((acc, curr) => {
        if (acc.some((a) => a === curr)) {
          return acc;
        }
        return [...acc, curr];
      }, [])
      .join(",");
  }
}

async function handleSchema(schema = {}) {
  console.log("dingo running handleSchema", schema);
  const statement = buildSchema(msg.data.schema);
  console.log("dingo built schema", statement);
  Promise.all(
    Object.keys(statement).map(async (key) => {
      console.log(`Initing Table: ${key}`);
      await run(statement[key]);
      return;
    })
  );
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
    switch (msg.data.type) {
      case "search":
        search(msg.data.name);
        break;
      case "db-run":
        run(msg.data.sql);
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
      case "db-compare-messages":
        handleCompare(msg.data.messages);
        break;
      case "db-get-messages":
        get("SELECT * FROM MESSAGES ORDER BY TIMESTAMP DESC");
        break;
      case "db-get":
        get(msg.data.sql);
        break;
      case "db-init":
        break;
      case "ui-invoke":
        if (methods[msg.data.name] == null) {
          throw new Error("Unknown method: " + msg.data.name);
        }
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
