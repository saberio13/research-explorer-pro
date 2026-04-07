# Research Explorer Pro v2 — Design Spec

**Date:** 2026-04-07
**Audience:** Students and researchers
**Scope:** UI polish, export/sharing, notes, caching, discovery features

---

## 1. UI Polish & Reliability

### Error Handling
- Replace generic "Search failed" toast with an inline error card in the results area
- Error card shows: icon, human-readable message, Retry button that re-submits the last query
- During search: replace spinner with animated status message ("Analyzing research literature…")

### Paper Cards
- Stance badge: color-coded (green=yes, yellow=possibly, red=no)
- Study type pill next to year
- Citation count with icon
- APA Copy Citation button per card (copies formatted string to clipboard, shows "Copied!" confirmation)
- Abstract truncated to 3 lines with "Read more" toggle
- Card hover: subtle elevation shadow

### Loading Skeleton
- Skeleton shapes match actual layout: consensus meter arc, 5 card blocks with correct proportions
- Animated shimmer effect

### Empty States
- Library empty: illustration + "Save papers from your search results to build your library"
- History empty: illustration + "Your past searches will appear here"

---

## 2. Export & Sharing

### Export Results (toolbar button above results)
Three export options in a dropdown:
- **PDF**: triggers browser print dialog with print-optimized CSS (hides nav, formats papers cleanly)
- **BibTeX**: generates `.bib` file with all papers, downloads as `research-export.bib`
- **CSV**: downloads `research-export.csv` with columns: title, authors, journal, year, citations, stance, DOI/URL

BibTeX entry format:
```
@article{AuthorYear,
  title = {Paper Title},
  author = {Author1 and Author2},
  journal = {Journal Name},
  year = {2024},
  url = {https://doi.org/...}
}
```

### Share URL
- Search results encode query params into URL hash: `/#/search?q=...&type=topic`
- Share button copies full URL to clipboard
- On page load, if URL has search params, auto-run the search

### Copy Citation (per paper)
- APA format: `Author, A., & Author, B. (Year). Title. *Journal*. URL`
- One-click copy with "Copied!" toast confirmation

---

## 3. Notes on Saved Papers

### UI
- Notes textarea visible in library card (collapsed by default, "Add note" link to expand)
- Auto-saves on blur (no save button needed)
- Shows character count (max 500)

### Backend
- Add `notes` column (TEXT, nullable) to `savedPapers` table
- New endpoint: `PATCH /api/saved-papers/:id` — updates notes field only
- Schema updated in `shared/schema.ts`

---

## 4. Search Result Caching

### Logic
- Before calling Gemini: check SQLite for existing result with matching `query + searchType + yearRange + studyTypes`, created within last 24 hours
- Cache hit: return stored result immediately, add `cached: true` flag to response
- Cache miss: call Gemini, store result, return it

### UI
- "Cached result" badge (grey pill) shown near search results header when result is from cache
- Tooltip: "From cache · [time ago] · Click to refresh"
- Clicking the badge forces a fresh search

### Storage
- Reuse existing `searches` table — cache key is the combination of query params
- Add `cacheKey` column (TEXT) to `searches` for efficient lookup

---

## 5. Discovery

### Related Searches
- After results render, show a "Related searches" row of 3–5 chip buttons
- Chips generated from `keyFindings` + Gemini suggestion (add `relatedQueries: string[]` to LLM response schema)
- Clicking a chip runs a new search

### Paper Comparison
- Checkbox on each paper card (visible on hover)
- When 2–3 papers selected: floating "Compare (2)" button appears at bottom
- Comparison modal: side-by-side columns, rows for: stance, study type, sample size, methodology, key finding, year
- "Export Comparison" button in modal → CSV download

---

## Architecture Changes

### Files modified
- `shared/schema.ts` — add `notes` to savedPapers, add `cacheKey` to searches
- `server/routes.ts` — add caching logic, PATCH endpoint, extend LLM schema for `relatedQueries`
- `server/storage.ts` — add `updatePaperNotes()`, `findCachedSearch()`, `saveCachedSearch()`
- `client/src/pages/home.tsx` — share URL logic, comparison state
- `client/src/components/results-view.tsx` — export toolbar, related searches, comparison checkboxes, cached badge
- `client/src/components/paper-modal.tsx` — copy citation button
- `client/src/components/paper-card.tsx` — new component extracted from results-view
- `client/src/components/library-view.tsx` — notes field, empty state
- `client/src/components/history-panel.tsx` — empty state
- `client/src/components/comparison-modal.tsx` — new component
- `client/src/components/export-menu.tsx` — new component

### No new dependencies needed
- PDF export via `window.print()` + print CSS
- BibTeX/CSV export via browser Blob download
- All UI components already available via shadcn/radix

---

## Out of Scope
- Authentication / user accounts
- Real-time paper database API integration (stays LLM-based)
- Mobile app
