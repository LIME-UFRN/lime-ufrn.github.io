function renderMarkdown(md) {
  if (window.marked && typeof window.marked.parse === "function") {
    // Basic safety: no raw HTML rendering
    marked.setOptions({ headerIds: false, mangle: false });
    return marked.parse(md, { sanitize: false });
  }

  // Fallback: plain text if marked didn't load
  return `<pre>${md.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
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
      blocks.push(`<article class="card pub-card">${renderMarkdown(md)}</article>`);
    }

    el.innerHTML = blocks.join("") || `<p class="muted">No entries yet.</p>`;
  } catch (err) {
    el.innerHTML = `<p class="muted">Could not load list (${err.message}).</p>`;
  }
}
