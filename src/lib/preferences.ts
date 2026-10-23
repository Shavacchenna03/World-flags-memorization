export type LessonSize = 5 | 10 | 15;

export interface LearningPreferences {
  lessonSize: LessonSize;
  onboardingCompleted: boolean;
  updatedAt: number;
}

export const DEFAULT_LESSON_SIZE: LessonSize = 10;
export const VALID_LESSON_SIZES: readonly LessonSize[] = [5, 10, 15] as const;
export const PREFERENCES_STORAGE_KEY = 'world_flags_learning_preferences_v1';
const PROGRESS_STORAGE_KEY = 'world_flags_learner_progress_v1';

export function isValidLessonSize(val: unknown): val is LessonSize {
  return val === 5 || val === 10 || val === 15;
}

export function isValidPreferences(data: unknown): data is LearningPreferences {
  if (!data || typeof data !== 'object') return false;
  const p = data as Partial<LearningPreferences>;
  return (
    isValidLessonSize(p.lessonSize) &&
    typeof p.onboardingCompleted === 'boolean'
  );
}

export function createDefaultPreferences(onboardingCompleted = false): LearningPreferences {
  return {
    lessonSize: DEFAULT_LESSON_SIZE,
    onboardingCompleted,
    updatedAt: Date.now(),
  };
}

// In-memory fallback for SSR and automated testing environments
let memoryPreferencesFallback: LearningPreferences | null = null;

/**
 * Checks whether an existing user has prior local progress in localStorage.
 * Used to avoid showing the onboarding modal to established guest/local users.
 */
function hasExistingLocalProgress(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const rawProgress = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!rawProgress) return false;
    const parsed = JSON.parse(rawProgress);
    if (!parsed || typeof parsed !== 'object') return false;

    const hasIntroduced =
      Array.isArray(parsed.introducedCountryCodes) &&
      parsed.introducedCountryCodes.length > 0;
    const hasCompletedBatches =
      parsed.completedBatches &&
      typeof parsed.completedBatches === 'object' &&
      Object.keys(parsed.completedBatches).length > 0;
    const hasAttempts =
      Array.isArray(parsed.practiceHistory) &&
      parsed.practiceHistory.length > 0;

    return Boolean(hasIntroduced || hasCompletedBatches || hasAttempts);
  } catch {
    return false;
  }
}

/**
 * Loads user learning preferences safely from localStorage or memory fallback.
 * Automatically marks onboarding as completed for users with pre-existing local progress.
 */
export function loadPreferences(): LearningPreferences {
  if (typeof window === 'undefined' || !window.localStorage) {
    if (!memoryPreferencesFallback) {
      memoryPreferencesFallback = createDefaultPreferences(false);
    }
    return memoryPreferencesFallback;
  }

  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) {
      // If user already has established local progress, grandfather them as onboardingCompleted = true
      const existingUser = hasExistingLocalProgress();
      const initial = createDefaultPreferences(existingUser);
      window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(raw);
    if (isValidPreferences(parsed)) {
      return parsed;
    }

    // Invalid format -> fallback safely to default (lessonSize 10)
    console.warn('[World Flags] Stored preferences format is invalid. Resetting to default.');
    const fallback = createDefaultPreferences(true);
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  } catch (err) {
    console.error('[World Flags] Failed to read learning preferences:', err);
    return createDefaultPreferences(true);
  }
}

/**
 * Persists updated learning preferences to storage.
 */
export function savePreferences(
  updates: Partial<Pick<LearningPreferences, 'lessonSize' | 'onboardingCompleted'>>
): LearningPreferences {
  const current = loadPreferences();
  const nextLessonSize = isValidLessonSize(updates.lessonSize)
    ? updates.lessonSize
    : current.lessonSize;

  const nextOnboarding =
    typeof updates.onboardingCompleted === 'boolean'
      ? updates.onboardingCompleted
      : current.onboardingCompleted;

  const updated: LearningPreferences = {
    lessonSize: nextLessonSize,
    onboardingCompleted: nextOnboarding,
    updatedAt: Date.now(),
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    memoryPreferencesFallback = updated;
    return updated;
  }

  try {
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('[World Flags] Failed to save learning preferences:', err);
  }

  return updated;
}

/**
 * Resets preferences in memory and storage (for tests and dev utilities).
 */
export function resetPreferences(): LearningPreferences {
  const initial = createDefaultPreferences(false);
  memoryPreferencesFallback = initial;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(PREFERENCES_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
  return initial;
}
