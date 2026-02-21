# LIME-UFRN Website --- Development Notes

Live site: https://lime-ufrn.github.io/

------------------------------------------------------------------------

## 1. Project Architecture

### Stack

-   Static site (GitHub Pages)
-   HTML + CSS + Vanilla JS
-   Markdown content rendered client-side using `marked`
-   `.nojekyll` enabled (no Jekyll processing)

### Folder Structure

    / (root)
    │
    ├── index.html                # Landing page (About LIME)
    ├── publications.html
    ├── theses.html
    ├── projects.html
    ├── news.html
    │
    ├── content/
    │   ├── about.md
    │   ├── publications/
    │   │   ├── index.json
    │   │   ├── 2026-paper-name.md
    │   │   └── ...
    │   ├── theses/
    │   ├── news/
    │   └── projects/
    │
    ├── assets/
    │   ├── css/
    │   │   └── style.css
    │   ├── js/
    │   │   └── app.js
    │   └── img/
    │       └── lime.svg
    │
    └── .nojekyll

------------------------------------------------------------------------

## 2. Content Rules

### Publications

Each publication is one Markdown file.

Required metadata at top:

    year: 2025

Formatting pattern:

    ### Paper Title

    Author 1; Author 2; Author 3  
    *Venue Name*, vol. X, year, pp. xx–xx  
    [DOI](https://doi.org/xxxxx) • PDF

Rules: - Title = `###` (renders as h3) - Authors = normal text (no
italics) - Venue = italic - DOI must use proper Markdown link syntax -
No bold "Authors:" or "Venue:" labels

------------------------------------------------------------------------

## 3. Design Principles

### Overall Tone

-   Academic
-   Clean
-   Institutional
-   Minimal UI
-   Avoid "dashboard" aesthetics

### Visual Hierarchy

-   h1 → Page title
-   h2 → Year group
-   h3 → Paper title
-   Paragraph → Authors + venue

### Cards Usage

-   `.card` → Landing page containers (Mission, Research Areas,
    Highlights)
-   `.pub-card` → Publications entries (lightweight, minimal style)

DO NOT: - Mix `.card` into publications - Use heavy borders or strong
gray backgrounds - Overuse rounded corners - Use neon colors - Add
decorative shadows

------------------------------------------------------------------------

## 4. Typography Choices

Base: - System UI stack - Clean sans-serif - Line-height ≈ 1.5

Hierarchy: - h1: \~34px - h2: \~22px - h3: \~16px--18px

Venue line: - Italic - Same size as body text

DO NOT: - Italicize authors - Use all caps titles - Use bold excessively

------------------------------------------------------------------------

## 5. Spacing Guidelines

Publications list: - Use `gap` on container instead of margins - Compact
vertical rhythm

Example:

    #pub_list{
      display:flex;
      flex-direction:column;
      gap: 14px;
    }

.pub-card: - Padding: 8--12px - No heavy margins - Very subtle
background (#fafafa optional)

Year headers: - Border-bottom: subtle - Generous top margin (\~30px)

Landing page cards: - Padding \~14--16px - Border-radius \~14px - No
shadows

------------------------------------------------------------------------

## 6. Design "Don't Do" List

❌ No dark theme\
❌ No gradient backgrounds\
❌ No animation-heavy effects\
❌ No Bootstrap or large UI frameworks\
❌ No inline styles\
❌ No inconsistent citation formatting\
❌ No mixing academic and app-style design

------------------------------------------------------------------------

## 7. Coding Conventions

-   Keep CSS modular
-   Add new styles at bottom of file
-   Avoid duplicating selectors
-   Avoid conflicting class reuse
-   Keep JS minimal and readable
-   Avoid adding frameworks unless strictly necessary

------------------------------------------------------------------------

## 8. TODO (Incremental Build Plan)

### Short-Term

-   Refine landing page proportions
-   Improve Highlights section
-   Finalize publication shading style
-   Standardize DOI styling

### Mid-Term

-   Build Theses/TCC page (same pattern as publications)
-   Build Projects page (manual layout)
-   Build News page (Markdown entries)
-   Add automatic sorting by year + month (optional)

### Long-Term

-   Auto-highlight lab members in publications
-   Add Google Scholar citation integration (optional)
-   Add search/filter functionality
-   Add language toggle (EN/PT)

------------------------------------------------------------------------

## 9. Development Workflow

Recommended setup: - VSCode - Local static preview (Live Server) - Codex
or AI assistance for incremental edits - Commit small, frequent
changes - Test mobile layout before pushing

Deployment: - Push to main branch - Wait \~1 minute for GitHub Pages -
Hard refresh to clear cache

------------------------------------------------------------------------

End of Dev Notes
