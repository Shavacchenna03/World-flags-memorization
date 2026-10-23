import { UserProgress } from '../progress';
import { LearningPreferences, LessonSize, isValidLessonSize } from '../preferences';
import { FlagProgressRecord, ProfileRecord } from './types';

/**
 * Evaluates whether local storage contains meaningful progress worthy of importing.
 */
export function hasMeaningfulLocalProgress(local: UserProgress | null): boolean {
  if (!local) return false;
  const hasIntroduced = Array.isArray(local.introducedCountryCodes) && local.introducedCountryCodes.length > 0;
  const hasHistory = Array.isArray(local.practiceHistory) && local.practiceHistory.length > 0;
  const hasCompletedBatches =
    Boolean(local.completedBatches) &&
    Object.values(local.completedBatches).some((list) => Array.isArray(list) && list.length > 0);

  return Boolean(hasIntroduced || hasHistory || hasCompletedBatches);
}

/**
 * Evaluates whether the cloud account already has established progress.
 */
export function hasMeaningfulCloudProgress(cloudFlags: readonly FlagProgressRecord[]): boolean {
  if (!Array.isArray(cloudFlags) || cloudFlags.length === 0) return false;
  return cloudFlags.some((f) => f.introduced || f.recall_attempts > 0 || f.mastery > 0);
}

/**
 * Calculates a 0-100 mastery estimate based on attempts and accuracy.
 */
export function calculateMasteryScore(attempts: number, correct: number): number {
  if (attempts <= 0) return 0;
  const accuracy = correct / attempts;
  // Weight volume (up to 5 attempts) and accuracy
  const volumeFactor = Math.min(1, attempts / 5);
  const score = Math.round(accuracy * volumeFactor * 100);
  return Math.min(100, Math.max(0, score));
}

export interface MergeResult {
  mergedFlags: FlagProgressRecord[];
  mergedPreferences: {
    lessonSize: LessonSize;
    onboardingCompleted: boolean;
  };
  stats: {
    importedCountryCount: number;
    totalMergedAttempts: number;
  };
}

/**
 * Deterministically merges local learning progress and preferences into cloud records.
 * Preserves the strongest/useful progress without blindly overwriting cloud data.
 */
export function mergeLocalAndCloudProgress(
  userId: string,
  localProgress: UserProgress,
  cloudFlags: readonly FlagProgressRecord[],
  localPrefs?: LearningPreferences | null,
  cloudProfile?: ProfileRecord | null
): MergeResult {
  const flagsMap = new Map<string, FlagProgressRecord>();

  // 1. Populate existing cloud records
  for (const cf of cloudFlags) {
    flagsMap.set(cf.country_code.toUpperCase(), {
      user_id: userId,
      country_code: cf.country_code.toUpperCase(),
      introduced: Boolean(cf.introduced),
      mastery: cf.mastery || 0,
      recall_attempts: cf.recall_attempts || 0,
      correct_attempts: cf.correct_attempts || 0,
      updated_at: cf.updated_at || new Date().toISOString(),
    });
  }

  // 2. Accumulate local practice history by country code
  const localStatsByCountry = new Map<string, { attempts: number; correct: number }>();
  if (Array.isArray(localProgress.practiceHistory)) {
    for (const item of localProgress.practiceHistory) {
      if (!item.countryCode) continue;
      const code = item.countryCode.toUpperCase();
      const current = localStatsByCountry.get(code) || { attempts: 0, correct: 0 };
      current.attempts += 1;
      if (item.isCorrect) {
        current.correct += 1;
      }
      localStatsByCountry.set(code, current);
    }
  }

  // 3. Merge local introduced countries
  if (Array.isArray(localProgress.introducedCountryCodes)) {
    for (const rawCode of localProgress.introducedCountryCodes) {
      if (!rawCode) continue;
      const code = rawCode.toUpperCase();
      const existing = flagsMap.get(code);

      if (existing) {
        existing.introduced = true;
      } else {
        flagsMap.set(code, {
          user_id: userId,
          country_code: code,
          introduced: true,
          mastery: 0,
          recall_attempts: 0,
          correct_attempts: 0,
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  // 4. Merge local practice stats
  let totalMergedAttempts = 0;
  for (const [code, localStat] of localStatsByCountry.entries()) {
    const existing = flagsMap.get(code);
    const localMastery = calculateMasteryScore(localStat.attempts, localStat.correct);

    if (existing) {
      existing.recall_attempts += localStat.attempts;
      existing.correct_attempts += localStat.correct;
      existing.mastery = Math.max(existing.mastery, localMastery);
      existing.introduced = true; // Any tested country is implicitly introduced
      totalMergedAttempts += localStat.attempts;
    } else {
      flagsMap.set(code, {
        user_id: userId,
        country_code: code,
        introduced: true,
        mastery: localMastery,
        recall_attempts: localStat.attempts,
        correct_attempts: localStat.correct,
        updated_at: new Date().toISOString(),
      });
      totalMergedAttempts += localStat.attempts;
    }
  }

  // 5. Merge preferences: If cloud profile already has custom/onboarded preferences, respect them;
  // otherwise inherit local preferences.
  let mergedLessonSize: LessonSize = 10;
  let mergedOnboarding = false;

  if (cloudProfile && cloudProfile.onboarding_completed) {
    mergedLessonSize = isValidLessonSize(cloudProfile.lesson_size) ? cloudProfile.lesson_size : 10;
    mergedOnboarding = true;
  } else if (localPrefs) {
    mergedLessonSize = isValidLessonSize(localPrefs.lessonSize) ? localPrefs.lessonSize : 10;
    mergedOnboarding = localPrefs.onboardingCompleted;
  }

  const mergedFlags = Array.from(flagsMap.values());
  const importedCountryCount = mergedFlags.filter((f) => f.introduced).length;

  return {
    mergedFlags,
    mergedPreferences: {
      lessonSize: mergedLessonSize,
      onboardingCompleted: mergedOnboarding,
    },
    stats: {
      importedCountryCount,
      totalMergedAttempts,
    },
  };
}
