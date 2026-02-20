// Very small markdown-ish renderer (headings, paragraphs, lists, links).
// Keeps things simple for GitHub Pages static hosting.
function renderMarkdown(md) {
  const esc = (s) => s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Basic link: [text](url)
  const linkify = (s) => s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  const lines = md.replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let inList = false;

  const closeList = () => { if (inList) { html += "</ul>"; inList = false; } };

  for (let raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) { closeList(); continue; }

    // Headings
    if (line.startsWith("### ")) { closeList(); html += `<h3>${linkify(esc(line.slice(4)))}</h3>`; continue; }
    if (line.startsWith("## "))  { closeList(); html += `<h2>${linkify(esc(line.slice(3)))}</h2>`; continue; }
    if (line.startsWith("# "))   { closeList(); html += `<h1>${linkify(esc(line.slice(2)))}</h1>`; continue; }

    // List items
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${linkify(esc(line.slice(2)))}</li>`;
      continue;
    }

    closeList();
    html += `<p>${linkify(esc(line))}</p>`;
  }

  closeList();
  return html;
}

async function loadMarkdownInto(selector, path) {
  const el = document.querySelector(selector);
  if (!el) return;

  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const md = await res.text();
    el.innerHTML = renderMarkdown(md);
  } catch (err) {
    el.innerHTML = `<p class="muted">Could not load <code>${path}</code> (${err.message}).</p>`;
  }
}

// For list pages (publications/news/theses), uses an index.json to load multiple MD files.
async function loadIndexList(listSelector, indexJsonPath, basePath) {
  const el = document.querySelector(listSelector);
  if (!el) return;

  try {
    const res = await fetch(indexJsonPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const files = await res.json();

    const blocks = [];
    for (const f of files) {
      const r = await fetch(`${basePath}/${f}`, { cache: "no-store" });
      if (!r.ok) continue;
      const md = await r.text();
      blocks.push(`<div class="card" style="margin:14px 0">${renderMarkdown(md)}</div>`);
    }

    el.innerHTML = blocks.join("") || `<p class="muted">No entries yet.</p>`;
  } catch (err) {
    el.innerHTML = `<p class="muted">Could not load list (${err.message}).</p>`;
  }
}