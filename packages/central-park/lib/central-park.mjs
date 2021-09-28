// let express = require("express");
import express from "express"
import sqlite3 from "better-sqlite3"
// let sqlite3 = require("better-sqlite3");
import dotenv from "dotenv";
// const dotenv = require("dotenv");
import bodyParser from "body-parser";
// let bodyParser = require("body-parser");
// let cors = require("cors");
import cors from "cors";

import https from "https"
import  {Timestamp, merkle} from "@meadowlark-labs/central";
// const https = require("https");
// let { Timestamp } = require("../deps/timestamp");
// let merkle = require("../deps/merkle");


// const {Timestamp, merkle} = Central;
// const fs = require("fs");
import fs from "fs";
import path from "path";
const __dirname = path.resolve()
// const path = require("path");

// const serveIndex = require("serve-index");
import serveIndex from "serve-index"
let db = sqlite3(__dirname + "/db.sqlite");
let app = express();
dotenv.config();
app.use(cors());
app.use(bodyParser.json({ limit: "20mb" }));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
const auth = true;
const BeatlesGroup = {
  name: "Beatles",
  id: "beatles",
  members: [
    {
      name: "John",
      user_id: null,
      online: null,
    },
    {
      name: "Paul",
      user_id: null,
      online: null,
    },
    {
      name: "George",
      user_id: null,
      online: null,
    },
    {
      name: "Ringo",
      user_id: null,
      online: null,
    },
  ],
};

const AppleGroup = {
  name: "Apple",
  user_id: "apple",
  members: [...BeatlesGroup.members, { name: "Steelcase USER", online: null }],
};

// const setPrecense = (req) => {
//   BeatlesGroup.members.forEach((g) => {
//     if (g.name === req.headers.ssl_client_s_dn_cn) {
//       g.online = new Date().toISOString();
//       g.user_id = req.headers.ssl_client_s_dn_cn;
//     }
//   });

//   AppleGroup.members.forEach((g) => {
//     if (g.name === req.user_cn) {
//       g.online = new Date().toISOString();
//     }
//   });

//   req.groups = [BeatlesGroup, AppleGroup];
// };
const checkUser = (req, res, next) => {
  if (
    auth &&
    (!req.headers.authorization ||
      req.headers.authorization === "(null)")
  ) {
    res.status("401").json({ error: "No Credentials Passed" });
  } else {
    if (auth) {
      // if (
      //   req.headers.ssl_client_s_dn_cn === "John" ||
      //   req.headers.ssl_client_s_dn_cn === "Paul" ||
      //   req.headers.ssl_client_s_dn_cn === "George" ||
      //   req.headers.ssl_client_s_dn_cn === "Ringo"
      // ) {
      //   setPrecense(req);
      // }
      console.log('dingo authorization',req.headers.authorization)
      req.user_cn = req.headers.authorization;
    } else {
      // setPrecense(req);
      req.user_cn = "Steelcase USER";
      // req.groups = [AppleGroup];
    }

    return next();
  }
};

const sqlMessages = `CREATE TABLE if not exists messages
  (timestamp TEXT,
   group_id TEXT,
   dataset TEXT,
   row TEXT,
   column TEXT,
   value TEXT,
   PRIMARY KEY(timestamp, group_id))`;

const sqlMessageMerkles = `CREATE TABLE if not exists messages_merkles
(group_id TEXT PRIMARY KEY,
 merkle TEXT);`;

function queryAll(sql, params = []) {
  let stmt = db.prepare(sql);
  return stmt.all(...params);
}

function queryRun(sql, params = []) {
  let stmt = db.prepare(sql);
  return stmt.run(...params);
}

queryRun(sqlMessages);
queryRun(sqlMessageMerkles);

var contentFolder = path.join(__dirname, "../public");

app.use(express.static(contentFolder));

app.use("/", (req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return next();
  }

  serveIndex(contentFolder, { icons: true })(req, res, next);
});

function init() {
  sqlite3;
}

function serializeValue(value) {
  if (value === null) {
    return "0:";
  } else if (typeof value === "number") {
    return "N:" + value;
  } else if (typeof value === "string") {
    return "S:" + value;
  }

  throw new Error("Unserializable value type: " + JSON.stringify(value));
}

function deserializeValue(value) {
  const type = value[0];
  switch (type) {
    case "0":
      return null;
    case "N":
      return parseFloat(value.slice(2));
    case "S":
      return value.slice(2);
  }

  throw new Error("Invalid type key for value: " + value);
}

function getMerkle(group_id) {
  let rows = queryAll("SELECT * FROM messages_merkles WHERE group_id = ?", [
    group_id,
  ]);

  if (rows.length > 0) {
    return JSON.parse(rows[0].merkle);
  } else {
    // No merkle trie exists yet (first sync of the app), so create a
    // default one.
    return {};
  }
}

function addMessages(groupId, messages) {
  let trie = getMerkle(groupId);

  queryRun("BEGIN");

  try {
    for (let message of messages) {
      const { dataset, row, column, value, timestamp } = message;

      let res = queryRun(
        `INSERT OR IGNORE INTO messages (timestamp, group_id, dataset, row, column, value) VALUES
           (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`,
        [timestamp, groupId, dataset, row, column, serializeValue(value)]
      );

      if (res.changes === 1) {
        // Update the merkle trie
        trie = merkle.insert(trie, Timestamp.parse(message.timestamp));
      }
    }

    queryRun(
      "INSERT OR REPLACE INTO messages_merkles (group_id, merkle) VALUES (?, ?)",
      [groupId, JSON.stringify(trie)]
    );
    queryRun("COMMIT");
  } catch (e) {
    queryRun("ROLLBACK");
    throw e;
  }

  return trie;
}

app.all("*", checkUser);
app.get("/user", (req, res) => {
  res.status(200).json({ user_id: req.user_cn });
});
app.all("/ping", (req, res) => {
  res.status(200).json({ pong: true });
});

app.post("/sync", (req, res) => {
  let { group_id, client_id, messages, merkle: clientMerkle } = req.body;

  let trie = addMessages(group_id, messages);
  console.log('dingo sync called')
  let newMessages = [];
  if (clientMerkle) {
    console.log('dingo clientMerkle')
    let diffTime = merkle.diff(trie, clientMerkle);
    if (diffTime) {
      let timestamp = new Timestamp(diffTime, 0, "0").toString();
      newMessages = queryAll(
        `SELECT * FROM messages WHERE group_id = ? AND timestamp > ? AND timestamp NOT LIKE '%' || ? ORDER BY timestamp`,
        [group_id, timestamp, client_id]
      );

      newMessages = newMessages.map((msg) => ({
        ...msg,
        value: deserializeValue(msg.value),
      }));
    }
  }
  console.log('dingo sending')
  // setPrecense(req);
  res.send(
    JSON.stringify({
      status: "ok",
      data: { messages: newMessages, merkle: trie, groups: req.groups },
    })
  );
});

app.get("/ping", (req, res) => {
  res.send("ok");
});

var server = https
  .createServer(
    {
      key: fs.readFileSync(path.join("certs/key.pem")),
      cert: fs.readFileSync(path.join("certs/server.crt")),
    },
    app
  )
  .listen(process.env.PORT, function () {
    console.log("HTTPS Server Listening on Port ", process.env.PORT);
  });

server.on("error", function (e) {
  if (e.code === "EADDRINUSE") {
    console.log(
      "Error: Port %d is already in use, select a different port.",
      port
    );
  } else if (e.code === "EACCES") {
    console.log(
      "Error: This process does not have permission to listen on port %d.",
      port
    );
  }
  console.log(e);
  process.exit(1);
});

server.on("close", function () {
  console.log("STEELCASE Server stopped.");
});

// app.listen(8008)
