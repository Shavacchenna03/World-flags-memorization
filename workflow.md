# World Flags — Project Workflow & File Architecture

> **Purpose:** Detailed end-to-end guide of the application's runtime flow, directory structure, module responsibilities, design tokens, and call graph. Updated after each prompt execution.

---

## 1. Centralized Theme System & Visual Tokens

The visual design system is a centralized, easily configurable theme architecture defined in `src/lib/theme.ts`.

### A. Architecture
- **Single Source of Truth:** `src/lib/theme.ts` contains semantic token definitions, typography, geometry scales, and registered palettes.
- **Dynamic CSS Variable Injection:** In `src/app/layout.tsx`, `generateThemeCssVariables(getActiveTheme())` injects root variables dynamically into `<head>` before render.
- **Switching Themes:** Edit `ACTIVE_THEME_NAME` in `src/lib/theme.ts`. Choose between `'editorial-warm'`, `'nordic-frost'`, or `'monastic-terracotta'`, or define a new palette conforming to `ThemeConfig`.

### B. Registered Palettes
1. **Editorial Warm (`editorial-warm` - Active Default):**
   - Backgrounds: `#171814` (charcoal base), `#1E1F19` (secondary), `#25261F` (elevated)
   - Typography: `#EAE6DC` (ivory primary), `#AAA99D` (stone secondary), `#828276` (muted)
   - Accents: `#A6A77A` (restrained olive), `#C5A574` (warm amber)
   - Status: `#7DA383` (sage green), `#C26762` (terracotta red)
2. **Nordic Frost (`nordic-frost`):**
   - Deep slate obsidian `#0E1116`, cool ice-steel accent `#79C0FF`, silver-white text `#F0F3F6`.
3. **Monastic Terracotta (`monastic-terracotta`):**
   - Earth-black `#1A1615`, terracotta accent `#D47D68`, parchment text `#F4ECE4`.

---

## 2. Authentication & Session Architecture (Phase 1)

### A. Core Authentication Principles
- **Library Stack:** `@supabase/ssr` (v0.12.7) + `@supabase/supabase-js` (v2.117.3).
- **Identity Provider:** Supabase Auth with Email + Password.
- **User Metadata:** Separate display name captured at registration and stored in `options.data.display_name`.
- **Session Mechanism:** Secure HTTP-only cookies managed via Next.js 15 App Router request lifecycle.
- **Open Redirect Protection:** Centralized redirect sanitizer in `src/lib/supabase/redirect.ts`.

### B. End-to-End Application Lifecycle & Route Map

```text
[Landing Page (/)]
  ├── Header: Brand, Navigation, Auth status ("Sign In" / Display Name + "Log Out")
  ├── Background: Asynchronous Continuous Moving Flag Wall (MovingFlagWall.tsx)
  └── CTA: "Start Learning →" (links to /learn)

[Authentication Routes]
  ├── /login ───────────────► Email + password sign in; link to signup & password recovery
  ├── /signup ──────────────► Email + password + display name; handles verification link state
  ├── /forgot-password ─────► Requests recovery link; protected against user enumeration
  ├── /reset-password ──────► Secure password update (requires active recovery session or code)
  └── /auth/callback ───────► Next.js route handler exchanging recovery/verification code for cookies

[Study Workspace Dashboard (/learn)]
  ├── Guest Mode: Retains local-storage progress persistence as default
  ├── Authenticated Mode: Displays user display name in header; session maintained across reloads
  │
  ├── 1. PRIMARY: Next Lesson Card (Derived dynamically via getNextLessonRecommendation)
  │     ├── Shows next uncompleted batch (e.g. Africa · Batch 1) or active session resume
  │     └── Direct action: "Start First Lesson →" / "Resume Lesson →"
  │
  ├── 2. SECONDARY: Compact Learning Analytics
  │     ├── Flags Introduced: X / 195 with meter bar
  │     ├── Batches Completed: Y / 23 with meter bar
  │     └── Independent Recall Accuracy: Z% (calculated from objective practice attempts)
  │
  ├── 3. TERTIARY: Continents Curriculum (Scannable structured rows)
  │     ├── Africa (54 sovereign states · 6 batches)
  │     ├── Asia (47 sovereign states · 5 batches)
  │     ├── Europe (44 sovereign states · 5 batches)
  │     ├── North America (23 sovereign states · 3 batches)
  │     ├── South America (12 sovereign states · 2 batches)
  │     ├── Oceania (15 sovereign states · 2 batches)
  │     └── Antarctica (0 sovereign states · Excluded under international treaty)
  │
  └── 4. QUATERNARY: Secondary Study Tools
        ├── Spaced Repetition status notice
        └── Flag Explorer (/learn/explorer)
```

---

## 3. File Directory & Caller-Callee Hierarchy Map

| File Path | Role & Purpose | Imported / Called By | Why It Is Called |
| :--- | :--- | :--- | :--- |
| `src/middleware.ts` | Next.js Edge Middleware for session lifecycle and route protection. | Next.js runtime | Intercepts requests, refreshes auth tokens, and protects auth routes. |
| `src/lib/supabase/config.ts` | Centralized Supabase environment configuration and validation. | Auth clients, middleware, UI | Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. |
| `src/lib/supabase/client.ts` | Singleton browser Supabase client using `@supabase/ssr`. | Client components (`Header`, `/login`, etc.) | Executes browser-side authentication calls. |
| `src/lib/supabase/server.ts` | Server-side Supabase client for Next.js 15 App Router. | Server components, route handlers | Manages server-side cookie sessions. |
| `src/lib/supabase/middleware.ts` | Session refresher and route protection logic. | `src/middleware.ts` | Refreshes session tokens and redirects authenticated users from guest forms. |
| `src/lib/supabase/redirect.ts` | Open redirect vulnerability sanitizer. | Route handlers, auth pages | Rejects external URLs and protocol-relative links (`//evil.com`). |
| `src/lib/supabase/validation.ts` | Email, password, and display name validation rules. | Auth pages, tests | Enforces client validation before submitting to Supabase. |
| `src/app/auth/callback/route.ts` | Supabase Auth PKCE / confirmation code exchange handler. | Supabase email link redirects | Exchanges `code` for session cookies and redirects to destination. |
| `src/app/login/page.tsx` | Sign-in page with credential validation and setup alert. | Route (`/login`) | Authenticates existing users with email and password. |
| `src/app/signup/page.tsx` | Account registration page with display name metadata. | Route (`/signup`) | Registers new accounts and handles email verification states. |
| `src/app/forgot-password/page.tsx` | Password recovery request form with enumeration safety. | Route (`/forgot-password`) | Triggers Supabase password reset email. |
| `src/app/reset-password/page.tsx` | Password reset form with session verification. | Route (`/reset-password`) | Allows user to set a new password during recovery. |
| `src/components/Header.tsx` | Navigation bar with dynamic auth state, user badge, and logout. | `src/app/layout.tsx` | Reflects sign-in status and provides session termination. |
| `src/lib/theme.ts` | Single source of truth for semantic tokens, themes, and CSS generation. | `src/app/layout.tsx`, tests | Exposes `getActiveTheme()`, `generateThemeCssVariables()`, and named palettes. |
| `src/app/layout.tsx` | Root shell injecting dynamic theme `:root` CSS variables and Header. | Next.js App Router | Wraps entire app in active theme variables and semantic shell. |
| `src/components/MovingFlagWall.tsx` | Asynchronous continuous moving flag columns. | `src/app/page.tsx` | Renders 9 independent continuous CSS-scrolling columns of flags behind hero. |
| `src/app/learn/page.tsx` | Redesigned learning dashboard. | Route (`/learn`) | Houses Next Lesson card, Compact Analytics, Curriculum rows, and Secondary Utilities. |
| `src/lib/progress.ts` | Progress persistence & dynamic next lesson engine. | Learn pages, study, practice, tests | Provides `getNextLessonRecommendation()`, `getProgressStats()`, storage schema. |
| `src/lib/batches.ts` | Deterministic batch generation (batches of 10). | Learn pages, study, practice, tests | Splits continent countries into stable chunks of 10. |
| `src/lib/countries.ts` | Static dataset loader, validator, and continent indexer. | Batches, moving flag wall, explorer, tests | Loads 195 sovereign nation records without runtime API calls. |

---

## 4. How the Independent Flag Wall Animation Works

1. **Deterministic Partitioning:**
   - All 195 sovereign countries from the local dataset are partitioned into 9 vertical columns (~21–22 countries per column) in `src/components/MovingFlagWall.tsx`.
2. **Seamless 3-Cycle Looping via CSS Keyframes:**
   - Within each column, the flag sequence is triplicated (`[...flags, ...flags, ...flags]`).
   - The CSS animation uses `@keyframes scrollDown`:
     ```css
     @keyframes scrollDown {
       0% { transform: translateY(-66.6666%); }
       100% { transform: translateY(-33.3333%); }
     }
     ```
   - Because the 33.333% delta represents exactly one identical cycle of items, translating from `-66.6666%` to `-33.3333%` creates an infinite, seamless downward flow with zero reset jumps, zero flashes, and guaranteed top/bottom coverage on screens of any height.
3. **Clearly Noticeable, Asynchronous Downward Motion:**
   - Column durations are tuned between 18s and 27s (~90px–130px/sec downward drift), ensuring movement is clearly noticeable within the first second.
   - Each column is assigned a distinct duration and negative animation delay (e.g., `-3s`, `-6s`, `-9s`, `-16s`, `-22s`), ensuring independent asynchronous movement without alignment.
4. **Larger Flag Sizing & Authentic Aspect Ratios:**
   - Each flag uses a consistent target height of `clamp(68px, 7.5vh, 92px)` with `width: auto; max-width: 100%`, allowing native aspect ratios (1:1, 3:2, 2:1, etc.) to render naturally without card cropping, stretching, or letterboxing.
   - Consecutive flags in each column are visually separated by `clamp(1.25rem, 2vh, 1.75rem)` vertical spacing.
5. **Horizontal Spacing & Full Viewport Coverage:**
   - Columns are distributed with `justify-content: space-evenly` across 100% of the viewport width, separated by distinct horizontal gaps (`clamp(1.5rem, 2.2vw, 2.75rem)`).
   - No narrow center clustering or empty black margins on the left/right. Responsive breakpoints adjust column counts smoothly (9 desktop, 7 laptop, 5 tablet, 4 mobile).
6. **High Visibility & Subtle Depth Overlays:**
   - Animation track opacity is set to `0.82` (preserving authentic flag colors and contrast).
   - Center radial overlay (`--hero-overlay-center`: `rgba(23, 24, 20, 0.76)`, `--hero-overlay-edge`: `rgba(23, 24, 20, 0.38)`) softly subdues only the area behind the headline, while the edge vignette is confined to subtle 10% gradients.
   - Foreground headline, subheadline, and button use layered drop-shadows for 100% crisp readability.
7. **Accessibility (`prefers-reduced-motion`):**
   - `@media (prefers-reduced-motion: reduce)` halts animation (`animation: none`) while preserving a static backdrop.
   - Tagged with `aria-hidden="true"` so screen readers are not burdened.
