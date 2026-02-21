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

    // year -> array of html blocks
    const groups = new Map();

    for (const f of files) {
      const r = await fetch(`${basePath}/${f}`, { cache: "no-store" });
      if (!r.ok) continue;
      const mdRaw = await r.text();

      // Extract "year: ####" from the first lines (simple + robust)
      const m = mdRaw.match(/^\s*year:\s*(\d{4})\s*$/m);
      const year = m ? m[1] : "Other";

      // Remove the year line from display
      const md = mdRaw.replace(/^\s*year:\s*\d{4}\s*$/m, "").trim();

      const html = `<article class="card pub-card">${renderMarkdown(md)}</article>`;

      if (!groups.has(year)) groups.set(year, []);
      groups.get(year).push(html);
    }

    // Sort years descending (2026, 2025, ...)
    const years = Array.from(groups.keys()).sort((a, b) => (b + "").localeCompare(a + ""));

    let out = "";
    for (const y of years) {
      out += `<h2 style="margin-top:22px">${y}</h2>`;
      out += groups.get(y).join("");
    }

    el.innerHTML = out || `<p class="muted">No entries yet.</p>`;
  } catch (err) {
    el.innerHTML = `<p class="muted">Could not load list (${err.message}).</p>`;
  }
}

