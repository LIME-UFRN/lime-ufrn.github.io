# LIME-UFRN --- People Schema v2

## 1. Core Philosophy

-   `position` = academic category\
-   `status` = current membership state\
-   No dedicated `director` category\
-   Leadership is optional via `lead: true` flag

------------------------------------------------------------------------

## 2. Required Metadata (All People)

Each file in `/people/` must begin with metadata lines in the format:

key: value

Metadata ends at the first blank line.

Required keys:

-   position:
    \<researcher\|postdoc\|phd\|msc\|undergraduate\|staff\>
-   status: \<active\|alumni\|inactive\>
-   name: `<Full Name>`{=html}

------------------------------------------------------------------------

## 3. Allowed Values

### position

-   faculty
-   researcher
-   postdoc
-   phd
-   msc
-   undergraduate
-   staff

No variations allowed.

### status

-   active → currently at LIME\
-   alumni → former students/postdocs\
-   inactive → former faculty/researchers/staff (not rendered by
    default)

------------------------------------------------------------------------

## 4. Alumni-Specific Required Fields

If status: alumni, the following are mandatory:

-   degree: \<PhD\|MSc\|BSc\|Postdoc\>
-   graduation_year: `<YYYY>`{=html}
-   current: `<short current position>`{=html}

------------------------------------------------------------------------

## 5. Optional Fields

-   affiliation: `<text>`{=html}
-   since: `<YYYY>`{=html}
-   email: `<text>`{=html}
-   links: \<label=url \| label=url \| ...\>
-   lead: true

------------------------------------------------------------------------

## 6. Rendering Logic

### Section Order (Fixed)

1.  Faculty
2.  Researchers
3.  Postdoctoral Researchers
4.  PhD Students
5.  MSc Students
6.  Undergraduate Students
7.  Staff
8.  Alumni

### Filtering Rules

Active Sections: - status: active - grouped by position

Alumni Section: - status: alumni

Inactive: - status: inactive - not rendered by default

------------------------------------------------------------------------

## 7. Sorting Rules

Active Sections: - Alphabetical by name

Alumni: - Descending by graduation_year - Tie-breaker: alphabetical by
name

------------------------------------------------------------------------

## 8. Display Model

### Active Member Entry

-   Name (prominent)
-   Position label (derived from position)
-   Affiliation (if provided)
-   Body snippet
-   Email (if provided)
-   Links (if provided)
-   If lead: true → add small "Lab Head" label

### Alumni Entry (Compact)

-   Name --- Degree (graduation_year)
-   current
-   links (optional)

------------------------------------------------------------------------

## 9. Example Files

### Faculty (Lab Head)

position: faculty status: active name: Prof. Dummy Leader since: 2015
lead: true links: scholar=https://example.com

Full Professor, Department of Electrical Engineering. Research:
Instrumentation and mixed-signal systems.

------------------------------------------------------------------------

### Active PhD

position: phd status: active name: Ana Example since: 2024

PhD Candidate. Research: Embedded measurement architectures.

------------------------------------------------------------------------

### Alumni MSc

position: msc status: alumni name: Maria Example degree: MSc
graduation_year: 2023 current: Now at Example Company

Thesis: Sensor calibration methods.
