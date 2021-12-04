import initSqlJs from "@jlongster/sql.js";
import {
  buildSchema,
  Timestamp,
  merkle,
  deserializeValue,
  WebDao,
  Environment,
  MeadoCrypto,
} from "@meadowlark-labs/central";

// Various global state for the demo

let currentBackendType = "idb";
let cacheSize = 5000;
let pageSize = 8192;
let dbName = `meadowlark.sqlite`;

let fakeValue = 0;

let sqlFS;

// Helper methods

let SQL = null;
let ready = null;
let environment = {};
let meadoCrypto;

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

const encryptTables = `CREATE TABLE IF NOT EXISTS encryption (url TEXT PRIMARY KEY)`;
const encryptionUsers = `CREATE TABLE IF NOT EXISTS encryption_user (USER TEXT PRIMARY KEY, url) FOREIGN KEY(url) REFERENCES encryption(url) ON DELETE CASCADE`;

const webDao = new WebDao();

async function _init() {
  if(!webDao._db){
    await webDao.init(initSqlJs);
    await webDao.open();
    console.log('Dingo opened')
  }
  await webDao.exec(sqlMessages);
  await webDao.exec(sqlMessageMerkles);
  await webDao.exec(encryptTables);
  // await webDao.exec(encryptionUsers);
  self.postMessage({ type: "INITIALIZED_DB" });
  return true;
}

async function init(schema = false) {
  if (schema) {
    await handleSchema(schema);
    self.postMessage({ type: "INITIALIZED_APP" });
    return ready;
  }

  return self.postMessage({ type: "INITIALIZED_APP" });
}

function formatNumber(num) {
  return new Intl.NumberFormat("en-US").format(num);
}

async function fetchJSON(url) {
  let res = await fetch(url);
  return res.json();
}

async function load() {
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

  webDao.exec("BEGIN TRANSACTION");
  let stmt = webDao.prepare(
    "INSERT INTO comments (content, url, title) VALUES (?, ?, ?)"
  );
  for (let result of results) {
    let url = `https://news.ycombinator.com/item?id=${result.id}`;
    stmt.run([result.text, url, result.storyTitle]);
  }
  webDao.exec("COMMIT");
  console.log("done!");

  count();
}

async function search(term) {
  if (!term.includes("NEAR") && !term.match(/"\*/)) {
    term = `"*${term}*"`;
  }

  let results = [];

  let stmt = webDao.prepare(
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
  webDao.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS comments USING fts3(content, title, url);
  `);

  let stmt = webDao.prepare("SELECT COUNT(*) as count FROM comments");
  stmt.step();
  let row = stmt.getAsObject();
  self.postMessage({ type: "count", count: row.count });

  stmt.free();
}

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

export function getMerkle(group_id) {
  let obj = webDao.queryObj(
    "SELECT * FROM messages_merkles WHERE group_id = ?",
    {
      $group_id: group_id,
    }
  );

  if (obj.merkle) {
    return JSON.parse(obj.merkle);
  } else {
    return {};
  }
}

async function handleInsertMessages(group_id, messages) {
  // get trie

  let trie = await getMerkle(group_id);
  await webDao.exec("BEGIN");
  const messageStatement = webDao.prepare(
    `INSERT INTO messages(timestamp, group_id, dataset, row, column, value)` +
      `values(?, ?, ?, ?, ?, ?);`
  );
  try {
    for (let message of messages) {
      const result = await webDao.runPrepare(
        messageStatement,
        [
          message.timestamp,
          group_id,
          message.dataset,
          message.row,
          message.column,
          message.value,
        ],
        () =>
          webDao.queryObj(
            `select * from messages where group_id = '${group_id}' AND timestamp = '${message.timestamp}'`
          )
      );
      // TODO: Debug this so that I can check that result === 1
      if (result.column) {
        console.log("INSERTING MESSAGE INTO MERKLE");
        trie = merkle.insert(trie, Timestamp.parse(message.timestamp));
      }
    }

    const ms = webDao.prepare(
      `INSERT OR REPLACE INTO messages_merkles(group_id, merkle)values(?,?)`
    );
    await webDao.runPrepare(ms, [group_id, JSON.stringify(trie)]);

    await webDao.exec("COMMIT");
  } catch (error) {
    await webDao.exec("ROLLBACK");
    throw error;
  }

  self.postMessage({ type: "INSERT_MESSAGE", results: JSON.stringify(trie) });
}

async function handleGetMostRecent(message) {
  // let results;

  const result = webDao.queryObj(
    `SELECT * FROM messages WHERE dataset = ? AND row = ? AND column = ? ORDER BY timestamp DESC;`,
    { $message: message.dataset, $row: message.row, $column: message.column }
  );
  const record = !result.column ? false : result;
  self.postMessage({ type: "MOST_RECENT_LOCAL_MESSAGES", results: record });
}

async function handleSchema(schema = {}) {
  const statement = buildSchema(schema);
  return Promise.all(
    Object.keys(statement).map(async (key) => {
      console.log(`Initing Table: ${key}`);
      await webDao.run(statement[key]);
      return;
    })
  );
}

async function handleApply(messages) {
  await webDao.run("BEGIN TRANSACTION");
  try {
    messages.reduce(async (acc, curr) => {
      let prevAcc = await acc;
      const val = deserializeValue(curr.value);
      prevAcc = await webDao.exec(
        `INSERT INTO ${curr.dataset} (id, ${curr.column}) VALUES ('${
          curr.row
        }', ${
          typeof val === "string" ? "'" + val + "'" : val
        }) ON CONFLICT(id) DO UPDATE SET ${curr.column} = ${
          typeof val === "string" ? "'" + val + "'" : val
        } WHERE id = '${curr.row}'`
      );
      return prevAcc;
    }, Promise.resolve());
  } catch (error) {
    await webDao.run("ROLLBACK");
    //TODO: Post response to failure ? self.postMessage({ type: "FAILED" });
    throw new Error(`Error: ${error}`);
  }
  await webDao.run("COMMIT");
  self.postMessage({ type: "APPLIED" });
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
      case "INIT_DATABASE":
        await _init();
        break;
      case "search":
        search(msg.data.name);
        break;
      case "db-run":
        await webDao.run(msg.data.sql);
        break;
      case "RUN_APPLY":
        handleApply(msg.data.messages);
        break;
      case "GET_MOST_RECENT_LOCAL_MESSAGES":
        await handleGetMostRecent(msg.data.message);
        break;
      case "RUN_INSERT_MESSAGES":
        await handleInsertMessages(msg.data.group_id, msg.data.message);
        break;
      case "GET_MERKLE":
        let trie = await getMerkle(msg.data.group_id);
        self.postMessage({ type: "MERKLE", results: trie });
        break;
      case "ADD_ENCRYPTION_URL":
        await webDao.exec(`BEGIN`);
        try {
          await webDao.exec(
            `INSERT INTO encryption(url)values('${msg.data.url}');`
          );
          await webDao.exec(
            `INSERT INTO encryption_user(user, url)values('${msg.data.user}', '${msg.data.url}') ON CONFLICT (user) DO UPDATE encryption_user SET url='${msg.data.url}' WHERE user =' ${msg.data.user}'';`
          );
        } catch (error) {
          console.error(`Unable to Save Encryption URL: ${error}`);
          webDao.exec("ROLLBACK");
        }
        webDao.exec("COMMIT");
        self.postMessage({ type: "ENCRYPTION_URL" });
        break;

      case "db-get-messages":
        await get("SELECT * FROM MESSAGES ORDER BY TIMESTAMP DESC");
        break;
      case "SELECT_ALL":
        const selectResults = webDao.queryAll(msg.data.sql);
        self.postMessage({ type: "SELECT", results: selectResults });
        break;
      case "db-init":
        break;
      case "db-sorted-messages":
        const sortedMessages = webDao.queryAll(
          `SELECT * FROM messages ORDER BY timestamp DESC`
        );
        self.postMessage({ type: "sorted-messages", sortedMessages });
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
      default:
        console.error("BAD ARGUMENT TO SYNC!", JSON.stringify(msg));
    }
  };
} else {
  for (let method of Object.keys(methods)) {
    let btn = document.querySelecsr(`#${method}`);
    if (btn) {
      btn.addEventListener("click", methods[method]);
    }
  }
  init();
}
