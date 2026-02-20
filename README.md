# LIME --- Laboratory of Instrumentation & Microelectronics

Federal University of Rio Grande do Norte (UFRN)\
Natal, RN --- Brazil

This repository hosts the official website of the LIME research
laboratory.

The website is built using static HTML, CSS, and JavaScript, and is
deployed via GitHub Pages.

------------------------------------------------------------------------

## 🌐 Website

Live at:\
https://lime-ufrn.github.io

------------------------------------------------------------------------

## 📁 Repository Structure

index.html → Landing page (About)\
projects.html → Projects page\
publications.html → Publications page\
theses.html → Theses / TCC page\
people.html → Current members + alumni\
infrastructure.html → Equipment and facilities\
news.html → News and events (optional)

assets/\
css/style.css → Main stylesheet\
js/app.js → Markdown renderer and loader\
img/lime.svg → Official logo

content/\
about.md\
infrastructure.md

people/\
current.md\
alumni.md

publications/\
\_index.json\
2026-paper-title.md\
2025-paper-title.md

theses/\
\_index.json\
2026-tcc-student.md

news/\
\_index.json\
2026-02-20-site-launch.md

------------------------------------------------------------------------

## ✍️ How to Update Content

### Add a Publication

1.  Create a new Markdown file inside:\
    content/publications/

2.  Add the filename to:\
    content/publications/\_index.json

3.  Commit.

The website will automatically display it.

------------------------------------------------------------------------

### Add a Thesis / TCC

1.  Create a new Markdown file inside:\
    content/theses/

2.  Add the filename to:\
    content/theses/\_index.json

3.  Commit.

------------------------------------------------------------------------

### Update People

Edit:

content/people/current.md\
content/people/alumni.md

------------------------------------------------------------------------

### Update Infrastructure

Edit:

content/infrastructure.md

------------------------------------------------------------------------

## 🚀 Deployment

The website is automatically deployed by GitHub Pages from the main
branch.

Changes usually appear within 1--2 minutes after committing.

------------------------------------------------------------------------

## 🧱 Design Philosophy

-   Clean white layout\
-   Minimal dependencies\
-   No build system\
-   Easy Markdown-based updates\
-   Long-term maintainability
