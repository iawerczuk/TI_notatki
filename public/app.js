const API = window.location.origin;

const qInput = document.getElementById("q");
const notesEl = document.getElementById("notes");
const form = document.getElementById("note-form");

async function api(url, options = {}) {
  const r = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function loadNotes() {
  const q = qInput.value.trim();
  const notes = await api(`${API}/api/notes?q=${encodeURIComponent(q)}`);
  notesEl.innerHTML = "";

  for (const n of notes) {
    const div = document.createElement("div");
    div.innerHTML = `<b>${n.title}</b><p>${n.body}</p>`;
    notesEl.appendChild(div);
  }
}

qInput.addEventListener("input", loadNotes);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const title = fd.get("title");
  const body = fd.get("body");
  const tags = fd.get("tags")
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

  const note = await api(`${API}/api/notes`, {
    method: "POST",
    body: JSON.stringify({ title, body }),
  });

  if (tags.length) {
    await api(`${API}/api/notes/${note.id}/tags`, {
      method: "POST",
      body: JSON.stringify({ tags }),
    });
  }

  form.reset();
  loadNotes();
});

loadNotes();