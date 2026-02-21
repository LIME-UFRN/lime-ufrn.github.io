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

      const html = `<article class="pub-card">${renderMarkdown(md)}</article>`;

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

async function loadProjectList(listSelector, indexJsonPath, basePath) {
  const el = document.querySelector(listSelector);
  if (!el) return;

  try {
    const res = await fetch(indexJsonPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const files = await res.json();

    const groups = new Map([
      ["Current projects", []],
      ["Past projects", []]
    ]);

    for (const f of files) {
      const r = await fetch(`${basePath}/${f}`, { cache: "no-store" });
      if (!r.ok) continue;
      const mdRaw = await r.text();

      const m = mdRaw.match(/^\s*status:\s*(current|past)\s*$/mi);
      const status = m ? m[1].toLowerCase() : "current";
      const groupName = status === "past" ? "Past projects" : "Current projects";

      const md = mdRaw.replace(/^\s*status:\s*(current|past)\s*$/mi, "").trim();
      const html = `<article class="project-card">${renderMarkdown(md)}</article>`;
      groups.get(groupName).push(html);
    }

    let out = "";
    for (const [groupName, items] of groups.entries()) {
      if (!items.length) continue;
      out += `<h2>${groupName}</h2>`;
      out += items.join("");
    }

    el.innerHTML = out || `<p class="muted">No projects yet.</p>`;
  } catch (err) {
    el.innerHTML = `<p class="muted">Could not load list (${err.message}).</p>`;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseMetadataBlock(raw) {
  const lines = raw.split(/\r?\n/);
  const metadata = {};
  let bodyStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      bodyStart = i + 1;
      break;
    }

    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim().toLowerCase();
    const value = line.slice(sep + 1).trim();
    metadata[key] = value;
    bodyStart = i + 1;
  }

  const body = lines.slice(bodyStart).join("\n").trim();
  return { metadata, body };
}

function parseLinks(rawLinks) {
  if (!rawLinks) return [];
  return rawLinks
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.indexOf("=");
      if (idx === -1) return null;
      const label = entry.slice(0, idx).trim();
      const url = entry.slice(idx + 1).trim();
      if (!label || !url) return null;
      return { label, url };
    })
    .filter(Boolean);
}

async function loadPeopleList(listSelector, indexJsonPath, basePath) {
  const el = document.querySelector(listSelector);
  if (!el) return;

  const positionOrder = [
    { key: "faculty", label: "Faculty" },
    { key: "researcher", label: "Researchers" },
    { key: "postdoc", label: "Postdoctoral Researchers" },
    { key: "phd", label: "PhD Students" },
    { key: "msc", label: "MSc Students" },
    { key: "undergraduate", label: "Undergraduate Students" },
    { key: "staff", label: "Staff" }
  ];

  const positionSet = new Set(positionOrder.map((p) => p.key));
  const statusSet = new Set(["active", "alumni", "inactive"]);

  const activeByPosition = new Map(positionOrder.map((p) => [p.key, []]));
  const alumni = [];

  try {
    const res = await fetch(indexJsonPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const files = await res.json();

    for (const f of files) {
      const r = await fetch(`${basePath}/${f}`, { cache: "no-store" });
      if (!r.ok) continue;
      const raw = await r.text();
      const { metadata, body } = parseMetadataBlock(raw);

      const position = (metadata.position || "").toLowerCase();
      const status = (metadata.status || "").toLowerCase();
      const name = metadata.name || "";
      if (!positionSet.has(position) || !statusSet.has(status) || !name) continue;
      if (status === "inactive") continue;

      const links = parseLinks(metadata.links);
      const item = {
        position,
        status,
        name,
        body,
        affiliation: metadata.affiliation || "",
        since: metadata.since || "",
        email: metadata.email || "",
        lead: /^true$/i.test(metadata.lead || ""),
        links,
        degree: metadata.degree || "",
        current: metadata.current || "",
        graduationYear: metadata.graduation_year ? Number(metadata.graduation_year) : NaN
      };

      if (status === "alumni") {
        if (!item.degree || !item.current || Number.isNaN(item.graduationYear)) continue;
        alumni.push(item);
      } else {
        activeByPosition.get(position).push(item);
      }
    }

    for (const [, people] of activeByPosition) {
      people.sort((a, b) => a.name.localeCompare(b.name));
    }
    alumni.sort((a, b) => {
      if (b.graduationYear !== a.graduationYear) return b.graduationYear - a.graduationYear;
      return a.name.localeCompare(b.name);
    });

    let out = "";

    for (const section of positionOrder) {
      const people = activeByPosition.get(section.key);
      if (!people.length) continue;
      out += `<h2>${section.label}</h2>`;
      out += people
        .map((person) => {
          const name = escapeHtml(person.name);
          const headBadge = person.lead ? `<span class="person-badge">Lab Head</span>` : "";
          const affiliation = person.affiliation
            ? `<p class="muted person-affiliation">${escapeHtml(person.affiliation)}</p>`
            : "";
          const since = person.since
            ? `<p class="muted person-since">Since ${escapeHtml(person.since)}</p>`
            : "";
          const bodyHtml = person.body ? `<div class="person-body">${renderMarkdown(person.body)}</div>` : "";
          const email = person.email
            ? `<p class="person-contact"><a href="mailto:${escapeHtml(person.email)}">${escapeHtml(person.email)}</a></p>`
            : "";
          const links = person.links.length
            ? `<p class="person-links">${person.links
                .map((link) => `<a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a>`)
                .join(" • ")}</p>`
            : "";

          return `<article class="person-card">
            <div class="person-heading">
              <h3>${name}</h3>
              ${headBadge}
            </div>
            ${affiliation}
            ${since}
            ${bodyHtml}
            ${email}
            ${links}
          </article>`;
        })
        .join("");
    }

    if (alumni.length) {
      out += "<h2>Alumni</h2>";
      out += alumni
        .map((person) => {
          const title = `${escapeHtml(person.name)} - ${escapeHtml(person.degree)} (${escapeHtml(person.graduationYear)})`;
          const current = `<p class="muted">${escapeHtml(person.current)}</p>`;
          const links = person.links.length
            ? `<p class="person-links">${person.links
                .map((link) => `<a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a>`)
                .join(" • ")}</p>`
            : "";
          return `<article class="alumni-card">
            <h3>${title}</h3>
            ${current}
            ${links}
          </article>`;
        })
        .join("");
    }

    el.innerHTML = out || `<p class="muted">No people entries yet.</p>`;
  } catch (err) {
    el.innerHTML = `<p class="muted">Could not load list (${err.message}).</p>`;
  }
}

