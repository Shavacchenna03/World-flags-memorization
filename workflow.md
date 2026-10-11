# World Flags — Project Workflow & File Architecture

> **Purpose:** Detailed end-to-end guide of the application's runtime flow, directory structure, module responsibilities, and call graph. Updated after each execution.

---

## 1. High-Level Application Lifecycle & Navigation Flow

```text
[Landing Page (/)]
       │
       ▼ (User clicks "Start Learning")
[Study Workspace Dashboard (/learn)]
       │
       ├───► [Continue Learning Card] ──► Direct link to resume active/next batch
       │
       ├───► [Seven-Continent Overview]
       │            │ (User selects a populated continent)
       │            ▼
       │     [/learn/continents/[continent]] (Sequential batches of 10)
       │            │
       │            ├──► [Study Batch] ──► [/learn/study/[continent]/[batchIndex]]
       │            │                              │
       │            │                              ▼ (Mark introduced & completed)
       │            └──► [Practice Batch] ─► [/learn/practice/[continent]/[batchIndex]]
       │                                           ├── Multiple Choice (4 distinct options)
       │                                           ├── Typed Recall (normalized text & aliases)
       │                                           ├── Flashcards (self-ratings: Again/Hard/Good/Easy)
       │                                           └── Session Summary (accuracy %, retry, next batch)
       │
       └───► [Flag Explorer (/learn/explorer)] ──► Search all 195 sovereign countries & flags
```

---

## 2. File Directory & Caller-Callee Hierarchy Map

| File Path | Role & Purpose | Imported / Called By | Why It Is Called |
| :--- | :--- | :--- | :--- |
| `src/app/page.tsx` | Minimalist dark landing page. Hero message and entry CTA. | Next.js root router (`/`) | Acts as the focused entrance into the personal learning tool. |
| `src/app/layout.tsx` | App shell, viewport, metadata, and common header. | Next.js App Router | Wraps all pages with dark theme styles and top navigation. |
| `src/app/learn/page.tsx` | Study workspace dashboard with stats and continent cards. | Next.js route (`/learn`) | Primary hub showing real progress, resume action, and continents. |
| `src/app/learn/continents/[continent]/page.tsx` | Continent learning sequence breaking continent into batches of 10. | Next.js dynamic route | Shows list of sequential batches, completion status, and actions. |
| `src/app/learn/study/[continent]/[batchIndex]/page.tsx` | Focused 10-country study screen with arrow-key navigation. | Next.js dynamic route | Presents flags & names to establish visual relationship; marks introduced. |
| `src/app/learn/practice/[continent]/[batchIndex]/page.tsx` | Interactive practice session (MCQ, Typed Recall, Flashcards, Summary). | Next.js dynamic route | Tests active recall, records attempts, calculates session accuracy. |
| `src/app/learn/explorer/page.tsx` | Dedicated full-page flag registry explorer. | Next.js route (`/learn/explorer`) | Provides searchable reference for all 195 sovereign country flags. |
| `src/components/Header.tsx` | Dark navigation bar with workspace links. | `src/app/layout.tsx` | Provides persistent top navigation across the learning app. |
| `src/components/FlagImage.tsx` | Reusable, accessible flag component preserving aspect ratios. | Pages, cards, study, and practice screens | Renders local SVGs via `object-fit: contain` without distortion or remote calls. |
| `src/components/FlagExplorer.tsx` | Search and continent-filter country table. | `src/app/learn/explorer/page.tsx` | Interactive client search and filter for 195 flags. |
| `src/lib/countries.ts` | Static dataset loader, validator, and continent resolver. | `batches.ts`, pages, tests | Loads `data/countries.json` once, validates integrity, indexes by code. |
| `src/lib/batches.ts` | Deterministic chunking into sequential batches of 10. | Continent, study, and practice pages, tests | Divides countries into stable batches of 10 (or remainder for final batch). |
| `src/lib/answers.ts` | Normalization, alias matching, and 4-option MCQ generator. | Practice page, tests | Evaluates learner input strictly without false matches; builds MCQ options. |
| `src/lib/progress.ts` | Versioned browser `localStorage` persistence layer. | Dashboard, study, practice pages, tests | Persists introduced flags, batch completions, attempts, and stats safely. |
| `src/types/country.ts` | TypeScript domain types (Country, Continent, etc.). | All application modules | Enforces strict typing and data contracts across the codebase. |

---

## 3. Detailed Data Lifecycles

### A. Country Registry Lifecycle
1. `data/countries.json` is loaded statically by `src/lib/countries.ts`.
2. On startup, `initializeCountryRegistry` verifies that exactly 195 records exist, each with non-empty fields, unique alpha-2 codes, and valid SVG paths.
3. Transcontinental and continental assignments are deterministically resolved into the 7-continent model.

### B. Learning Workflow Lifecycle
1. **Selection:** User opens `/learn` and clicks a continent (e.g., Africa).
2. **Batch Generation:** `getContinentBatches('Africa')` groups the 54 countries into 6 batches (10, 10, 10, 10, 10, 4).
3. **Study:** User navigates flags 1 through 10. Clicking "Complete Introduction" calls `markCountriesIntroduced` and `markBatchCompleted` in `src/lib/progress.ts`.
4. **Practice:** User tests recall via Multiple Choice, Typed Recall, or Flashcards. Each answer is evaluated by `src/lib/answers.ts` and logged via `recordPracticeAttempt`.
5. **Session Summary:** Real session statistics (questions attempted, correct count, accuracy percentage) are displayed with actions to retry, return, or advance.

### C. Storage & Persistence Lifecycle
- Stored under `localStorage['world_flags_learner_progress_v1']`.
- Protected by `isValidProgress` schema validator.
- Graceful in-memory fallback during SSR, Node runtime, or test environments.
