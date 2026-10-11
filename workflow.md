# World Flags — Project Workflow & File Architecture

> **Purpose:** Detailed end-to-end guide of the application's runtime flow, directory structure, module responsibilities, design tokens, and call graph. Updated after each prompt execution.

---

## 1. Design System & Visual Philosophy

The visual design system is an **understated, editorial personal study workspace** designed for sustained focus:
- **Palette:**
  - Main background: `#171814` (warm deep charcoal)
  - Secondary background: `#1E1F19` (soft warm charcoal)
  - Elevated surfaces: `#25261F` (warm charcoal stone)
  - Primary text: `#EAE6DC` (warm linen off-white)
  - Secondary text: `#AAA99D` (muted warm stone)
  - Muted text: `#828276` (neutral olive-slate)
  - Dividers: `#38392F` (hairline subtle rule)
  - Primary accent: `#A6A77A` (muted olive)
  - Secondary accent: `#C5A574` (subdued warm amber)
  - Success state: `#7DA383` (muted sage)
  - Error state: `#C26762` (muted terracotta)
- **Typography:**
  - Display & Headings: `Newsreader` / `Charter` / `Georgia` (literary, warm serif)
  - Interface & Body: `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto` (high legibility)
  - Numerical & Codes: `ui-monospace`, `Cascadia Code` (ISO codes, batch numbers)
- **Layout:**
  - Replaced repetitive boxed cards with whitespace, hairline dividers, and structured rows.
  - Eliminated glowing borders, electric-blue buttons, and colorful pill badges.

---

## 2. High-Level Application Lifecycle & Navigation Flow

```text
[Landing Page (/)]
       │
       ▼ (User clicks "Start Learning")
[Study Workspace Dashboard (/learn)]
       │
       ├───► [Current Lesson Strip] ─────► Direct action to resume active/next batch
       │
       ├───► [Continents Curriculum]
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

## 3. File Directory & Caller-Callee Hierarchy Map

| File Path | Role & Purpose | Imported / Called By | Why It Is Called |
| :--- | :--- | :--- | :--- |
| `src/app/globals.css` | Global editorial theme tokens, typography, and focus states. | Next.js root layout | Establishes the warm charcoal, muted olive, and serif tokens. |
| `src/app/page.tsx` | Minimalist literary landing page. | Next.js root router (`/`) | Uncluttered, quiet entrance to the study workspace. |
| `src/app/layout.tsx` | Root shell with metadata and Header. | Next.js App Router | Wraps all views in the dark workspace theme and navigation. |
| `src/app/learn/page.tsx` | Main study dashboard. | Next.js route (`/learn`) | Houses progress metrics, resume action, and continents curriculum. |
| `src/app/learn/continents/[continent]/page.tsx` | Continent learning sequence with sequential batches. | Next.js dynamic route | Shows batch sequence, country previews, and study/practice actions. |
| `src/app/learn/study/[continent]/[batchIndex]/page.tsx` | Focused flag study screen with arrow navigation. | Next.js dynamic route | Presents flags & names to establish visual relationships; marks introduced. |
| `src/app/learn/practice/[continent]/[batchIndex]/page.tsx` | Active recall practice (MCQ, Typed Recall, Flashcards, Summary). | Next.js dynamic route | Evaluates recall, logs attempts to storage, presents session summary. |
| `src/app/learn/explorer/page.tsx` | Dedicated full-page flag registry explorer. | Next.js route (`/learn/explorer`) | Provides searchable reference for all 195 sovereign countries. |
| `src/components/Header.tsx` | Understated navigation bar with hairline divider. | `src/app/layout.tsx` | Quiet top navigation without distracting highlights. |
| `src/components/FlagImage.tsx` | Reusable flag component preserving native aspect ratios. | Pages, cards, study, and practice screens | Renders local SVGs via `object-fit: contain` without distortion or remote calls. |
| `src/components/FlagExplorer.tsx` | Search and continent-filter country table. | `src/app/learn/explorer/page.tsx` | Interactive client search and filter for 195 flags. |
| `src/lib/countries.ts` | Static dataset loader, validator, and continent resolver. | `batches.ts`, pages, tests | Loads `data/countries.json` once, validates integrity, indexes by code. |
| `src/lib/batches.ts` | Deterministic chunking into sequential batches of 10. | Continent, study, and practice pages, tests | Divides countries into stable batches of 10 (or remainder for final batch). |
| `src/lib/answers.ts` | Normalization, alias matching, and 4-option MCQ generator. | Practice page, tests | Evaluates learner input strictly without false matches; builds MCQ options. |
| `src/lib/progress.ts` | Versioned browser `localStorage` persistence layer. | Dashboard, study, practice pages, tests | Persists introduced flags, batch completions, attempts, and stats safely. |
| `src/types/country.ts` | TypeScript domain types (Country, Continent, etc.). | All application modules | Enforces strict typing and data contracts across the codebase. |

---

## 4. Detailed Data Lifecycles

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
