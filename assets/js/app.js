function renderMarkdown(md) {
  if (window.marked && typeof window.marked.parse === "function") {
    // Basic safety: no raw HTML rendering
    marked.setOptions({ headerIds: false, mangle: false });
    return marked.parse(md, { sanitize: false });
  }

  // Fallback: plain text if marked didn't load
  return `<pre>${md.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
}

function configureExternalLinks(root) {
  const scope = root || document;
  const anchors = scope.querySelectorAll("a[href]");

  anchors.forEach((a) => {
    const rawHref = (a.getAttribute("href") || "").trim();
    if (!rawHref) return;
    if (
      rawHref.startsWith("#") ||
      rawHref.startsWith("mailto:") ||
      rawHref.startsWith("tel:") ||
      rawHref.startsWith("javascript:")
    ) {
      return;
    }

    let url;
    try {
      url = new URL(rawHref, window.location.href);
    } catch {
      return;
    }

    const isHttp = url.protocol === "http:" || url.protocol === "https:";
    const isExternal = isHttp && url.origin !== window.location.origin;
    if (!isExternal) return;

    a.setAttribute("target", "_blank");
    const rel = new Set((a.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
    rel.add("noopener");
    rel.add("noreferrer");
    a.setAttribute("rel", Array.from(rel).join(" "));
  });
}

async function loadMarkdownInto(selector, path) {
  const el = document.querySelector(selector);
  if (!el) return;

  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const mdRaw = await res.text();
    const { body } = parseYamlFrontMatter(mdRaw);
    el.innerHTML = renderMarkdown(body);
    configureExternalLinks(el);
  } catch (err) {
    el.innerHTML = `<p class="muted">Could not load <code>${path}</code> (${err.message}).</p>`;
  }
}

function initSiteNav() {
  const nav = document.querySelector("header nav");
  if (!nav) return;

  const dropdowns = Array.from(nav.querySelectorAll("[data-nav-dropdown]"));
  const closeAllDropdowns = () => {
    dropdowns.forEach((dd) => {
      dd.classList.remove("open");
      const btn = dd.querySelector("[data-nav-dropdown-toggle]");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  };

  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector("[data-nav-dropdown-toggle], .dropdown-toggle");
    const menu = dropdown.querySelector("[data-nav-dropdown-menu], .dropdown-menu");
    if (!toggle || !menu) return;

    const submenuLinks = Array.from(menu.querySelectorAll("a"));

    const setOpen = (open) => {
      dropdown.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    };

    const isButtonToggle = toggle.tagName === "BUTTON";
    if (isButtonToggle) {
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const willOpen = !dropdown.classList.contains("open");
        closeAllDropdowns();
        setOpen(willOpen);
        if (willOpen && window.matchMedia("(hover: none)").matches && submenuLinks[0]) {
          submenuLinks[0].focus();
        }
      });
    }

    toggle.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        closeAllDropdowns();
        setOpen(true);
        if (submenuLinks[0]) submenuLinks[0].focus();
      }
      if ((event.key === " " || event.key === "Spacebar") && !isButtonToggle) {
        event.preventDefault();
        closeAllDropdowns();
        setOpen(true);
        if (submenuLinks[0]) submenuLinks[0].focus();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        toggle.focus();
      }
    });

    dropdown.addEventListener("focusin", () => setOpen(true));
    dropdown.addEventListener("focusout", (event) => {
      if (!dropdown.contains(event.relatedTarget)) setOpen(false);
    });

    menu.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        toggle.focus();
      }
    });

    submenuLinks.forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });
  });

  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target)) closeAllDropdowns();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAllDropdowns();
  });

  // Active state resolution based on current path
  const current = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  let activeKey = current.replace(/\.html$/, "");
  if (activeKey === "index") activeKey = "home";

  const facilitiesChildren = new Set(["facilities", "equipment", "resources", "gallery"]);
  if (facilitiesChildren.has(activeKey)) {
    const dd = nav.querySelector('[data-nav-dropdown="facilities"]');
    if (dd) dd.classList.add("is-active");
    if (activeKey === "facilities") {
      const parent = nav.querySelector('[data-nav-key="facilities"]');
      if (parent) {
        parent.classList.add("is-active");
        parent.setAttribute("aria-current", "page");
      }
    }
    const facilityLinks = nav.querySelectorAll('[data-nav-group="facilities"]');
    facilityLinks.forEach((link) => {
      if ((link.getAttribute("data-nav-key") || "") === activeKey) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
    return;
  }

  nav.querySelectorAll("[data-nav-key]").forEach((link) => {
    if ((link.getAttribute("data-nav-key") || "") === activeKey) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });
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
    configureExternalLinks(el);
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
    configureExternalLinks(el);
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

function buildEmailPlaceholderHtml(email) {
  const value = String(email || "").trim();
  const at = value.lastIndexOf("@");
  if (at <= 0 || at === value.length - 1) return "";

  const user = value.slice(0, at);
  const domain = value.slice(at + 1);
  return `<span class="email-placeholder" data-user="${escapeHtml(user)}" data-domain="${escapeHtml(domain)}"></span>`;
}

function hydrateEmailPlaceholders(root) {
  const scope = root || document;
  const placeholders = scope.querySelectorAll(".email-placeholder");

  placeholders.forEach((el) => {
    const user = el.getAttribute("data-user") || "";
    const domain = el.getAttribute("data-domain") || "";
    if (!user || !domain) return;

    const email = `${user}@${domain}`;
    const link = document.createElement("a");
    link.href = `mailto:${email}`;
    link.textContent = `${user} [at] ${domain.replace(/\./g, " [dot] ")}`;

    el.replaceChildren(link);
  });
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

function parseYamlFrontMatter(raw) {
  const lines = raw.split(/\r?\n/);
  if (!lines.length || lines[0].trim() !== "---") {
    return { metadata: {}, body: raw.trim() };
  }

  const metadata = {};
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "---") {
      end = i;
      break;
    }
    if (!line) continue;

    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim().toLowerCase();
    let value = line.slice(sep + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    metadata[key] = value;
  }

  if (end === -1) {
    return { metadata: {}, body: raw.trim() };
  }

  const body = lines.slice(end + 1).join("\n").trim();
  return { metadata, body };
}

function toNumberOrNaN(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function buildThesisMetaLine(item) {
  const institution = item.institution || "UFRN";

  if (item.status === "ongoing") {
    const startedYear = Number.isNaN(item.startYear) ? item.year : item.startYear;
    const levelMap = {
      phd: "PhD Supervision",
      msc: "MSc Supervision",
      ug: "Undergraduate Supervision"
    };
    const label = levelMap[item.level] || "Supervision";
    const startedText = Number.isNaN(startedYear) ? "Started" : `Started ${startedYear}`;
    return `${label} - ${institution} - ${startedText}`;
  }

  if (item.level === "phd") return `PhD Thesis - ${institution} - ${item.year}`;
  if (item.level === "msc") return `MSc Dissertation - ${institution} - ${item.year}`;
  if (item.level === "ug") {
    if (item.ugSubtype === "ic") return `Undergraduate Research (IC) - ${institution} - ${item.year}`;
    return `Undergraduate Project (TCC) - ${institution} - ${item.year}`;
  }

  return `${institution} - ${item.year}`;
}

async function loadThesesList(listSelector, indexJsonPath, basePath) {
  const el = document.querySelector(listSelector);
  if (!el) return;

  try {
    const res = await fetch(indexJsonPath, { cache: "no-store" });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const files = await res.json();

    const entries = [];
    const validStatus = new Set(["ongoing", "completed"]);
    const validLevels = new Set(["phd", "msc", "ug"]);

    for (const f of files) {
      const r = await fetch(`${basePath}/${f}`, { cache: "no-store" });
      if (!r.ok) continue;
      const raw = await r.text();
      const { metadata, body } = parseYamlFrontMatter(raw);

      const status = (metadata.status || "").toLowerCase();
      const level = (metadata.level || "").toLowerCase();
      if (!validStatus.has(status) || !validLevels.has(level)) continue;

      const type = (metadata.type || "").toLowerCase();
      const ugSubtype = (metadata.ug_subtype || "").toLowerCase();
      const year = toNumberOrNaN(metadata.year);
      const startYear = toNumberOrNaN(metadata.start_year);
      const title = metadata.title || "";
      const student = metadata.student || "";
      const advisor = metadata.advisor || "";
      if (!title || !student || !advisor) continue;
      if (status === "completed" && Number.isNaN(year)) continue;

      entries.push({
        status,
        level,
        type,
        ugSubtype,
        year,
        startYear,
        title,
        student,
        institution: metadata.institution || "UFRN",
        advisor,
        coadvisor: metadata.coadvisor || "",
        pdf: metadata.pdf || "",
        repo: metadata.repo || "",
        notes: metadata.notes || "",
        body
      });
    }

    const sections = [
      {
        title: "Ongoing Supervisions",
        items: entries
          .filter((e) => e.status === "ongoing")
          .sort((a, b) => {
            const ay = Number.isNaN(a.startYear) ? a.year : a.startYear;
            const by = Number.isNaN(b.startYear) ? b.year : b.startYear;
            return (Number.isNaN(by) ? 0 : by) - (Number.isNaN(ay) ? 0 : ay);
          })
      },
      {
        title: "PhD Theses",
        items: entries
          .filter((e) => e.status === "completed" && e.level === "phd")
          .sort((a, b) => b.year - a.year)
      },
      {
        title: "MSc Dissertations",
        items: entries
          .filter((e) => e.status === "completed" && e.level === "msc")
          .sort((a, b) => b.year - a.year)
      },
      {
        title: "Undergraduate Projects",
        items: entries
          .filter((e) => e.status === "completed" && e.level === "ug")
          .sort((a, b) => b.year - a.year)
      }
    ];

    let out = "";
    for (const section of sections) {
      out += `<h2>${section.title}</h2>`;
      if (!section.items.length) {
        out += `<p class="muted">No entries yet.</p>`;
        continue;
      }

      out += section.items
        .map((item) => {
          const title = escapeHtml(item.title);
          const student = escapeHtml(item.student);
          const metaLine = escapeHtml(buildThesisMetaLine(item));
          let advisorLine = `Advisor: ${escapeHtml(item.advisor)}`;
          if (item.coadvisor) advisorLine += ` | Co-advisor: ${escapeHtml(item.coadvisor)}`;

          const links = [];
          if (item.pdf) links.push(`<a href="${escapeHtml(item.pdf)}">PDF</a>`);
          if (item.repo) links.push(`<a href="${escapeHtml(item.repo)}">Repository</a>`);
          const linksHtml = links.length ? `<p class="thesis-links">${links.join(" | ")}</p>` : "";

          const summarySource = item.notes || item.body;
          const summaryHtml = summarySource
            ? `<div class="thesis-summary">${renderMarkdown(summarySource)}</div>`
            : "";

          return `<article class="thesis-card">
            <h3>${title}</h3>
            <p>${student}</p>
            <p class="muted">${metaLine}</p>
            <p class="muted thesis-advisor">${advisorLine}</p>
            ${linksHtml}
            ${summaryHtml}
          </article>`;
        })
        .join("");
    }

    el.innerHTML = out || `<p class="muted">No entries yet.</p>`;
    configureExternalLinks(el);
  } catch (err) {
    el.innerHTML = `<p class="muted">Could not load list (${err.message}).</p>`;
  }
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

    for (const [position, people] of activeByPosition) {
      if (position === "faculty") {
        people.sort((a, b) => {
          if (a.lead !== b.lead) return a.lead ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
        continue;
      }
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
            ? `<div class="person-email"><span class="label">Email:</span>${buildEmailPlaceholderHtml(person.email)}</div>`
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
    hydrateEmailPlaceholders(el);
    configureExternalLinks(el);
  } catch (err) {
    el.innerHTML = `<p class="muted">Could not load list (${err.message}).</p>`;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initSiteNav();
    configureExternalLinks(document);
  });
} else {
  initSiteNav();
  configureExternalLinks(document);
}



