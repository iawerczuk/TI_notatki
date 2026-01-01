const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
app.disable("x-powered-by");

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");
  next();
});

function jsonError(res, status, message) {
  return res.status(status).json({ error: message });
}

const db = new Database(path.join(__dirname, "notes.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS notes(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tags(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS note_tags(
  note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_notes_title_body ON notes(title, body);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
`);

app.get("/api/notes", (req, res) => {
  const { q, tag } = req.query;

  let sql = `
    SELECT DISTINCT n.id, n.title, n.body, n.created_at
    FROM notes n
    LEFT JOIN note_tags nt ON nt.note_id = n.id
    LEFT JOIN tags t ON t.id = nt.tag_id
    WHERE 1=1
  `;
  const params = [];

  if (q) {
    sql += " AND (n.title LIKE ? OR n.body LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }

  if (tag) {
    sql += " AND t.name = ?";
    params.push(tag);
  }

  sql += " ORDER BY n.created_at DESC";

  const notes = db.prepare(sql).all(...params);
  res.json(notes);
});

app.post("/api/notes", (req, res) => {
  const { title, body } = req.body || {};
  const t = typeof title === "string" ? title.trim() : "";
  const b = typeof body === "string" ? body.trim() : "";

  if (!t || !b) return jsonError(res, 400, "Invalid title/body");

  const created_at = new Date().toISOString();
  const info = db.prepare(
    "INSERT INTO notes(title, body, created_at) VALUES(?,?,?)"
  ).run(t, b, created_at);

  const created = db.prepare(
    "SELECT id, title, body, created_at FROM notes WHERE id=?"
  ).get(info.lastInsertRowid);

  res.location(`/api/notes/${created.id}`).status(201).json(created);
});

app.get("/api/tags", (req, res) => {
  const tags = db.prepare("SELECT id, name FROM tags ORDER BY name").all();
  res.json(tags);
});

app.post("/api/notes/:id/tags", (req, res) => {
  const noteId = Number(req.params.id);
  const { tags } = req.body || {};

  if (!Number.isFinite(noteId) || noteId <= 0) {
    return jsonError(res, 400, "Invalid note id");
  }
  if (!Array.isArray(tags)) {
    return jsonError(res, 400, "Tags must be array");
  }

  const note = db.prepare("SELECT id FROM notes WHERE id=?").get(noteId);
  if (!note) return jsonError(res, 404, "Note not found");

  const insTag = db.prepare("INSERT OR IGNORE INTO tags(name) VALUES(?)");
  const getTag = db.prepare("SELECT id FROM tags WHERE name=?");
  const link = db.prepare(
    "INSERT OR IGNORE INTO note_tags(note_id, tag_id) VALUES(?,?)"
  );

  for (const raw of tags) {
    const name = String(raw).trim();
    if (!name) continue;
    insTag.run(name);
    const tag = getTag.get(name);
    link.run(noteId, tag.id);
  }

  res.json({ ok: true });
});

app.use("/api", (req, res) => jsonError(res, 404, "Not found"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = 5050;
app.listen(port, () => console.log(`Notes API on http://localhost:${port}`));