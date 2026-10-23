import { Country } from '../types/country';

export interface StudySessionState {
  continent: string;
  batchNumber: number;
  lessonSize?: number;
  shuffledCountryCodes: string[];
  currentIndex: number;
  completed: boolean;
  createdAt: number;
}

/**
 * Deterministic Fisher-Yates array shuffle.
 * Returns a new shuffled array without mutating the input array.
 */
export function shuffleArray<T>(items: readonly T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

const SESSION_STORAGE_KEY_PREFIX = 'world_flags_study_session_';

export function getStudySessionKey(
  continent: string,
  batchNumber: number,
  size: number = 10
): string {
  return `${SESSION_STORAGE_KEY_PREFIX}${encodeURIComponent(continent)}_${batchNumber}_s${size}`;
}

/**
 * Checks whether the current page load is a browser reload/refresh action.
 */
export function isBrowserPageReload(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const navEntries = window.performance?.getEntriesByType?.('navigation') as PerformanceNavigationTiming[] | undefined;
    if (navEntries && navEntries.length > 0) {
      return navEntries[0].type === 'reload';
    }
    // Fallback for older browsers
    const legacyNav = (window.performance as unknown as { navigation?: { type: number } })?.navigation;
    if (legacyNav && legacyNav.type === 1) {
      return true;
    }
  } catch {
    // Ignore error
  }
  return false;
}

/**
 * Initializes or restores an active study session for a batch/lesson.
 *
 * Rules:
 * 1. If forceNew is true or session was already completed, generates a new shuffled session.
 * 2. If an active uncompleted session exists in sessionStorage AND this is a page refresh (F5),
 *    restores the shuffled order and currentIndex so the user does not lose their place.
 * 3. Entering the lesson anew (navigation from elsewhere) creates a fresh randomized order.
 */
export function initStudySession(
  continent: string,
  batchNumber: number,
  canonicalCountries: readonly Country[],
  forceNew: boolean = false
): StudySessionState {
  const lessonSize = canonicalCountries.length;
  const key = getStudySessionKey(continent, batchNumber, lessonSize);

  if (!forceNew && typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = window.sessionStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as StudySessionState;
        const canonicalCodes = new Set(canonicalCountries.map((c) => c.code));
        const storedCodes = parsed.shuffledCountryCodes;

        const isValid =
          parsed.continent === continent &&
          parsed.batchNumber === batchNumber &&
          Array.isArray(storedCodes) &&
          storedCodes.length === canonicalCountries.length &&
          storedCodes.every((c) => canonicalCodes.has(c)) &&
          typeof parsed.currentIndex === 'number' &&
          parsed.currentIndex >= 0 &&
          parsed.currentIndex < canonicalCountries.length &&
          !parsed.completed;

        // If it's a page reload and session is valid, preserve it
        if (isValid && isBrowserPageReload()) {
          return parsed;
        }
      }
    } catch {
      // Fall through to create fresh session
    }
  }

  // Generate new randomized presentation order
  const shuffledCodes = shuffleArray(canonicalCountries.map((c) => c.code));
  const newSession: StudySessionState = {
    continent,
    batchNumber,
    lessonSize,
    shuffledCountryCodes: shuffledCodes,
    currentIndex: 0,
    completed: false,
    createdAt: Date.now(),
  };

  saveStudySession(newSession);
  return newSession;
}

/**
 * Persists updated study session state to sessionStorage.
 */
export function saveStudySession(session: StudySessionState): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    const size = session.lessonSize || session.shuffledCountryCodes.length || 10;
    const key = getStudySessionKey(session.continent, session.batchNumber, size);
    window.sessionStorage.setItem(key, JSON.stringify(session));
  } catch {
    // Ignore storage quota warnings
  }
}

/**
 * Clears an active study session from sessionStorage.
 */
export function clearStudySession(
  continent: string,
  batchNumber: number,
  size: number = 10
): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    const key = getStudySessionKey(continent, batchNumber, size);
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore
  }
}
