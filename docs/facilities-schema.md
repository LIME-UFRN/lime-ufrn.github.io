---
title: Facilities content schema
purpose: Developer notes for Codex
---

This repository serves the LIME-UFRN lab website (static HTML/CSS/JS), where pages can load Markdown content dynamically (e.g., via `marked`).

This document defines the **recommended schema** for the Facilities section and how Codex should add/update content safely and consistently.

# 1. File locations and naming

Recommended folder structure:

- `content/facilities/`
  - `equipment.md` *(equipment inventory; parsed into the Facilities/Equipment page)*
  - `computing.md` *(optional; if you later split computing infrastructure)*
  - `microfab.md` *(optional; if you later split prototyping)*
  - `facilities.md` *(optional; umbrella intro page)*

**Naming rules**
- Use lowercase filenames with hyphens if needed (e.g., `microfabrication.md`).
- Keep one topic per file to simplify maintenance.

# 2. Markdown conventions

## 2.1 Front matter (optional but recommended)

If the site parser supports YAML front matter, use:

```yaml
---
title: Equipment
page: facilities
updated: YYYY-MM-DD
---
```

If front matter is not supported by the current loader, Codex should **strip it** or ensure the loader removes it before rendering.

## 2.2 Headings

Use a clean hierarchy:

- `#` Page title (only once)
- `##` Major categories
- `###` Subcategories (only if needed)

Do not skip levels.

## 2.3 Lists

Prefer short bullet lines, with **bold** for the key item and the rest as details.

Keep “inventory” items as bullets, not paragraphs.

## 2.4 Links

- Keep original vendor/product links when available.
- Prefer official manufacturer pages.
- Use normal Markdown links: `[Label](https://example.com)`.

# 3. Facilities page layout guidance

Facilities should remain **technical and institutional** (not a photo album).

Recommended Facilities subheadings (single-lab setup):

- `## Laboratory Infrastructure`
- `## Measurement & Test Equipment`
- `## Microfabrication & Prototyping`
- `## Computational Infrastructure`

**Gallery/people photos must not be placed here**. Put them in a separate `Gallery` section/page.

# 4. How Codex should implement the Facilities/Equipment page

## 4.1 Content sourcing

- Convert legacy HTML equipment list into structured English Markdown.
- Preserve product links and manufacturer/model identifiers.
- Translate Portuguese terms (e.g., “Fontes de alimentação” → “Bench power supplies”).

## 4.2 Parsing and rendering

When implementing the Facilities/Equipment page:

- Load `content/facilities/equipment.md` via fetch.
- Parse via `marked` (or the current markdown pipeline).
- Inject into the page container (e.g., `#content`).

## 4.3 Safety and maintenance

- Do not hardcode equipment lists into HTML.
- Keep the equipment inventory only in `equipment.md`.
- If adding new items, keep the same category structure and avoid duplication.

# 5. Minimal acceptance checklist for PRs touching Facilities

- [ ] Markdown renders without broken headings.
- [ ] All links open correctly.
- [ ] Categories are consistent and not duplicated.
- [ ] No photos embedded (Facilities ≠ Gallery).
- [ ] The page still matches the site’s academic visual style.
