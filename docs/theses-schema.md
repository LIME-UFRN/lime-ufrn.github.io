# Theses page — Codex build instructions (LIME-UFRN)

Goal: add a new **top navigation tab** called **Theses** (NOT “Theses/TCC”, and NOT “Theses & Projects” because a separate **Projects** tab already exists).  
The Theses page should list **student supervision outputs** in a clean academic style consistent with the Publications page.

---

## 1) Information architecture

### Tab name (navbar)
- **Theses**

### Page title (inside the page)
- **Theses & Undergraduate Projects**

### Section order (top → bottom)
1. **Ongoing Supervisions**
2. **PhD Theses**
3. **MSc Dissertations**
4. **Undergraduate Projects** (TCC + IC mixed)

Notes:
- Do **NOT** subgroup by year (we don’t have many items).
- Within each section, sort entries **newest → oldest** (by year).

---

## 2) Content model (one item per Markdown file)

Create one Markdown file per thesis/project (similar to Publications items).  
Keep the same “load Markdown dynamically” approach you already use.

### Required metadata fields (front matter)
Use YAML front matter at the top of each MD file:

- `status`: `ongoing` | `completed`
- `level`: `phd` | `msc` | `ug`
- `type`: for completed items: `thesis` | `dissertation` | `ug_project`
  - For undergraduate projects, store the subtype in:
    - `ug_subtype`: `tcc` | `ic`
- `year`: integer (e.g., 2026)
- `title`: string
- `student`: string
- `institution`: string (default “UFRN” if omitted)
- `advisor`: string
- Optional:
  - `coadvisor`: string
  - `pdf`: url/path (relative or absolute)
  - `repo`: url (institutional repository, if any)
  - `notes`: short string (avoid long text)
  - For ongoing:
    - `start_year`: integer (preferred over year if ongoing)

### Example MD (dummy)
(Use as reference for the pattern—Codex should generate files like this.)

```yaml
---
status: completed
level: ug
type: ug_project
ug_subtype: tcc
year: 2025
title: Implementation of an ESP32-Based Data Logger
student: Ana Costa
institution: UFRN
advisor: Sebastian Yuri Catunda
pdf: assets/theses/ana-costa-2025.pdf
---
Short optional abstract/summary (1–3 lines). Keep it brief.
```

---

## 3) Display rules (how each item renders)

### General (all sections)
- Show items as compact “cards” (same width philosophy as Publications).
- No year grouping headers.
- No badges, no icons, no logos, no colorful labels.
- Keep a subtle, very light shading (like your pub-card shading) and comfortable padding.

### Entry visual hierarchy (recommended)
1. **Title** (bold, headline)
2. Student name (normal)
3. One line with: Degree/Type – Institution – Year (or Start Year)
4. Advisor line; optional co-advisor
5. Links (PDF / Repository), if present

### Text conventions
- Use “PhD”, “MSc” in display text.
- Undergrad line should explicitly state subtype:
  - “Undergraduate Project (TCC)”
  - “Undergraduate Research (IC)”
- Ongoing items should show **Started YYYY** (from `start_year`).

---

## 4) Grouping logic (page assembly)

Codex should implement a build that:
1. Loads all theses/project MD files from a dedicated folder, e.g.:
   - `content/theses/` (recommended)
2. Parses YAML front matter into objects.
3. Creates four arrays (sections) using these filters:

### Section filters
- **Ongoing Supervisions**
  - `status == "ongoing"` (any level)
- **PhD Theses**
  - `status == "completed" AND level == "phd"`
- **MSc Dissertations**
  - `status == "completed" AND level == "msc"`
- **Undergraduate Projects**
  - `status == "completed" AND level == "ug"`

### Sorting inside each section
- Ongoing: sort by `start_year` descending (if missing, fallback to `year`)
- Completed: sort by `year` descending

---

## 5) File/folder conventions

Recommended folder layout (align with your existing pattern):

- `theses.html` (new page)
- `content/theses/` (MD files)
- `assets/theses/` (PDFs, if hosted locally)
- Optional: `assets/img/theses/` (avoid thumbnails unless necessary)

Naming convention for MD files:
- `YYYY-student-lastname-shorttitle.md` (example)
- `2025-costa-esp32-data-logger.md`

PDF naming:
- `YYYY-student-lastname.pdf` or match the MD stem

---

## 6) Styling rules (match Publications aesthetic)

Create a dedicated card class, e.g. `.thesis-card`, with:
- very light background
- subtle border or none
- small rounding
- consistent spacing between cards

Typography:
- Title similar to publication title (h3 scale)
- Student and metadata as normal text
- Advisor line slightly muted (optional)

Spacing:
- Slightly tighter than landing-page `.card`, similar to `.pub-card`.

Avoid:
- grids of tiles
- multi-column layouts
- heavy shadows

---

## 7) Content policy notes

- Keep descriptions short. This page is a curated academic list, not a full profile per thesis.
- If you don’t have PDF/repository links, omit the link row entirely.
- Ongoing items should not include long abstracts—1 line max if needed.

---

## 8) Acceptance checklist

Codex should confirm:
- Navbar has a **Theses** tab.
- Theses page renders four sections in the specified order.
- No year subgroup headers exist.
- Undergraduate items display subtype (TCC or IC) inline.
- Sorting is newest → oldest within each section.
- Styling matches Publications: clean, academic, minimal.

