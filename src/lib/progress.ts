import { Continent, Country } from '../types/country';

export const PROGRESS_SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'world_flags_learner_progress_v1';

export type PracticeMode = 'multiple-choice' | 'typed' | 'flashcard';
export type FlashcardRating = 'again' | 'hard' | 'good' | 'easy';

export interface PracticeAttempt {
  countryCode: string;
  mode: PracticeMode;
  isCorrect: boolean;
  selfRating?: FlashcardRating;
  timestamp: number;
}

export interface UserProgress {
  version: 1;
  introducedCountryCodes: string[];
  completedBatches: Record<string, number[]>; // continent -> completed batchIndices
  practiceHistory: PracticeAttempt[];
  lastActivity: number;
  lastSession?: {
    continent: Continent;
    batchIndex: number;
    timestamp: number;
  };
}

export function createDefaultProgress(): UserProgress {
  return {
    version: 1,
    introducedCountryCodes: [],
    completedBatches: {},
    practiceHistory: [],
    lastActivity: Date.now(),
  };
}

// In-memory store fallback for SSR and automated testing environments
let memoryFallback: UserProgress | null = null;

/**
 * Validates whether an unknown object adheres to the UserProgress v1 schema.
 */
export function isValidProgress(data: unknown): data is UserProgress {
  if (!data || typeof data !== 'object') return false;
  const p = data as Partial<UserProgress>;

  if (p.version !== PROGRESS_SCHEMA_VERSION) return false;
  if (!Array.isArray(p.introducedCountryCodes)) return false;
  if (!p.completedBatches || typeof p.completedBatches !== 'object') return false;
  if (!Array.isArray(p.practiceHistory)) return false;
  if (typeof p.lastActivity !== 'number') return false;

  return true;
}

/**
 * Loads user progress safely from browser storage or memory fallback.
 */
export function loadProgress(): UserProgress {
  if (typeof window === 'undefined' || !window.localStorage) {
    if (!memoryFallback) {
      memoryFallback = createDefaultProgress();
    }
    return memoryFallback;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultProgress();

    const parsed = JSON.parse(raw);
    if (isValidProgress(parsed)) {
      return parsed;
    }

    console.warn('[World Flags] Stored progress schema is invalid or outdated. Resetting to default.');
    return createDefaultProgress();
  } catch (err) {
    console.error('[World Flags] Failed to read from localStorage:', err);
    return createDefaultProgress();
  }
}

/**
 * Persists user progress safely to browser storage or memory fallback.
 */
export function saveProgress(progress: UserProgress): boolean {
  const updated: UserProgress = {
    ...progress,
    lastActivity: Date.now(),
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    memoryFallback = updated;
    return true;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('[World Flags] Failed to save progress to localStorage:', err);
    return false;
  }
}

/**
 * Adds newly studied country codes to the introduced list without duplication.
 */
export function markCountriesIntroduced(codes: readonly string[]): UserProgress {
  const current = loadProgress();
  const set = new Set(current.introducedCountryCodes);

  for (const code of codes) {
    if (code) set.add(code.toUpperCase());
  }

  const updated: UserProgress = {
    ...current,
    introducedCountryCodes: Array.from(set),
    lastActivity: Date.now(),
  };

  saveProgress(updated);
  return updated;
}

/**
 * Checks whether a specific country code has been introduced.
 */
export function isCountryIntroduced(code: string): boolean {
  const progress = loadProgress();
  return progress.introducedCountryCodes.includes(code.toUpperCase());
}

/**
 * Records completion of an introduction batch.
 */
export function markBatchCompleted(continent: Continent, batchIndex: number): UserProgress {
  const current = loadProgress();
  const existing = current.completedBatches[continent] || [];

  const updatedBatches = {
    ...current.completedBatches,
    [continent]: Array.from(new Set([...existing, batchIndex])).sort((a, b) => a - b),
  };

  const updated: UserProgress = {
    ...current,
    completedBatches: updatedBatches,
    lastSession: {
      continent,
      batchIndex,
      timestamp: Date.now(),
    },
    lastActivity: Date.now(),
  };

  saveProgress(updated);
  return updated;
}

/**
 * Checks if a specific batch has been completed.
 */
export function isBatchCompleted(continent: Continent, batchIndex: number): boolean {
  const progress = loadProgress();
  const existing = progress.completedBatches[continent] || [];
  return existing.includes(batchIndex);
}

/**
 * Records an individual practice attempt into the practice history.
 */
export function recordPracticeAttempt(
  attempt: Omit<PracticeAttempt, 'timestamp'>
): UserProgress {
  const current = loadProgress();
  const record: PracticeAttempt = {
    ...attempt,
    timestamp: Date.now(),
  };

  const updated: UserProgress = {
    ...current,
    practiceHistory: [...current.practiceHistory, record],
    lastActivity: Date.now(),
  };

  saveProgress(updated);
  return updated;
}

/**
 * Computes live summary statistics derived from real progress data.
 */
export function getProgressStats(allCountriesCount: number): {
  introducedCount: number;
  totalCountries: number;
  completedBatchCount: number;
  practiceAttemptsCount: number;
  practiceAccuracy: number;
} {
  const progress = loadProgress();
  const totalCompletedBatches = Object.values(progress.completedBatches).reduce(
    (sum, list) => sum + list.length,
    0
  );

  const objectivePractices = progress.practiceHistory.filter(
    (p) => p.mode === 'multiple-choice' || p.mode === 'typed'
  );

  const correctCount = objectivePractices.filter((p) => p.isCorrect).length;
  const practiceAccuracy =
    objectivePractices.length > 0
      ? Math.round((correctCount / objectivePractices.length) * 100)
      : 0;

  return {
    introducedCount: progress.introducedCountryCodes.length,
    totalCountries: allCountriesCount,
    completedBatchCount: totalCompletedBatches,
    practiceAttemptsCount: progress.practiceHistory.length,
    practiceAccuracy,
  };
}

/**
 * Resets local progress back to factory state.
 */
export function resetProgress(): UserProgress {
  const initial = createDefaultProgress();
  saveProgress(initial);
  return initial;
}

export interface NextLessonRecommendation {
  continent: Continent;
  batchIndex: number;
  batchNumber: number;
  countryCount: number;
  totalBatchesInContinent: number;
  actionType: 'start' | 'resume' | 'next' | 'all-completed';
  badgeLabel: string;
  buttonLabel: string;
  description: string;
}

const ORDERED_CONTINENTS: readonly Continent[] = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
] as const;

/**
 * Derives the next recommended lesson dynamically from actual persisted progress
 * and the deterministic curriculum order.
 */
export function getNextLessonRecommendation(
  progress: UserProgress,
  getBatchDetails: (
    continent: Continent,
    batchIndex: number
  ) => { countryCount: number; totalBatches: number; countries?: readonly Country[] } | undefined
): NextLessonRecommendation {
  const last = progress.lastSession;

  // 1. Check if there is an unfinished active session to resume
  if (last && last.continent !== 'Antarctica') {
    const details = getBatchDetails(last.continent, last.batchIndex);
    const isCompleted =
      progress.completedBatches[last.continent]?.includes(last.batchIndex) ||
      (Boolean(details?.countries) &&
        details!.countries!.length > 0 &&
        details!.countries!.every((c) => progress.introducedCountryCodes.includes(c.code)));

    if (!isCompleted && details) {
      return {
        continent: last.continent,
        batchIndex: last.batchIndex,
        batchNumber: last.batchIndex + 1,
        countryCount: details.countryCount,
        totalBatchesInContinent: details.totalBatches,
        actionType: 'resume',
        badgeLabel: 'Resume Lesson',
        buttonLabel: 'Resume Lesson →',
        description: `Continue where you left off in ${last.continent} · Lesson ${last.batchIndex + 1}.`,
      };
    }
  }

  // 2. Scan curriculum in sequential continent order for the first uncompleted lesson
  for (const continent of ORDERED_CONTINENTS) {
    const completedList = progress.completedBatches[continent] || [];
    let bIdx = 0;

    while (true) {
      const details = getBatchDetails(continent, bIdx);
      if (!details) break; // no more lessons in this continent

      const isLessonFinished =
        completedList.includes(bIdx) ||
        (Boolean(details.countries) &&
          details.countries!.length > 0 &&
          details.countries!.every((c) => progress.introducedCountryCodes.includes(c.code)));

      if (!isLessonFinished) {
        const isBrandNew =
          progress.introducedCountryCodes.length === 0 &&
          Object.keys(progress.completedBatches).length === 0;

        return {
          continent,
          batchIndex: bIdx,
          batchNumber: bIdx + 1,
          countryCount: details.countryCount,
          totalBatchesInContinent: details.totalBatches,
          actionType: isBrandNew ? 'start' : 'next',
          badgeLabel: isBrandNew ? 'First Lesson' : 'Next Lesson',
          buttonLabel: isBrandNew ? 'Start First Lesson →' : 'Start Lesson →',
          description: isBrandNew
            ? `Begin your study journey with the first ${details.countryCount} sovereign country flags in Africa.`
            : `Continue with the next ${details.countryCount} flags in ${continent}.`,
        };
      }

      bIdx++;
    }
  }

  // 3. All lessons in all continents completed
  return {
    continent: 'Africa',
    batchIndex: 0,
    batchNumber: 1,
    countryCount: 10,
    totalBatchesInContinent: 6,
    actionType: 'all-completed',
    badgeLabel: 'Curriculum Completed',
    buttonLabel: 'Review Lesson 1 →',
    description: 'All 195 sovereign flags have been introduced! Practice any lesson or review retention.',
  };
}
