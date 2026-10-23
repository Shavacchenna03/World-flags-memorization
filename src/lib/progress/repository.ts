import { createClient } from '../supabase/client';
import { getSupabaseConfig } from '../supabase/config';
import {
  UserProgress,
  loadProgress as loadLocalProgress,
  saveProgress as saveLocalProgress,
  markCountriesIntroduced as markLocalCountriesIntroduced,
  markBatchCompleted as markLocalBatchCompleted,
  recordPracticeAttempt as recordLocalPracticeAttempt,
  PracticeAttempt,
} from '../progress';
import {
  LearningPreferences,
  LessonSize,
  loadPreferences as loadLocalPreferences,
  savePreferences as saveLocalPreferences,
  isValidLessonSize,
} from '../preferences';
import { Continent } from '../../types/country';
import { FlagProgressRecord, ProfileRecord, MigrationState } from './types';
import {
  mergeLocalAndCloudProgress,
  hasMeaningfulLocalProgress,
  hasMeaningfulCloudProgress,
  calculateMasteryScore,
} from './merge';

const MIGRATION_STORAGE_KEY_PREFIX = 'world_flags_migration_status_';

function getMigrationDecisionKey(userId: string): string {
  return `${MIGRATION_STORAGE_KEY_PREFIX}${userId}`;
}

export class LearningRepository {
  /**
   * Identifies the currently authenticated Supabase user (if any).
   */
  async getCurrentUser() {
    const { isConfigured } = getSupabaseConfig();
    if (!isConfigured) return null;

    try {
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) return null;
      return user;
    } catch {
      return null;
    }
  }

  /**
   * Retrieves user learning preferences: from Supabase `profiles` if authenticated,
   * otherwise from local storage for guest users.
   */
  async getLearningPreferences(): Promise<LearningPreferences> {
    const user = await this.getCurrentUser();
    if (!user) {
      return loadLocalPreferences();
    }

    try {
      const supabase = createClient();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, display_name, lesson_size, onboarding_completed, updated_at')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('[LearningRepository] Error fetching cloud profile, falling back to local:', error.message);
        return loadLocalPreferences();
      }

      if (profile && isValidLessonSize(profile.lesson_size)) {
        const cloudPrefs: LearningPreferences = {
          lessonSize: profile.lesson_size,
          onboardingCompleted: Boolean(profile.onboarding_completed),
          updatedAt: profile.updated_at ? new Date(profile.updated_at).getTime() : Date.now(),
        };
        // Mirror to local storage for fast SSR/synchronous access
        saveLocalPreferences(cloudPrefs);
        return cloudPrefs;
      }

      // Profile does not exist yet (e.g., trigger didn't run): create default profile row
      const localPrefs = loadLocalPreferences();
      const initialProfile = {
        id: user.id,
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Learner',
        lesson_size: localPrefs.lessonSize,
        onboarding_completed: localPrefs.onboardingCompleted,
        updated_at: new Date().toISOString(),
      };

      await supabase.from('profiles').upsert(initialProfile);
      return localPrefs;
    } catch (err) {
      console.warn('[LearningRepository] Unexpected error reading preferences:', err);
      return loadLocalPreferences();
    }
  }

  /**
   * Saves updated learning preferences to Supabase `profiles` (if authenticated) and local storage.
   */
  async saveLearningPreferences(
    updates: Partial<Pick<LearningPreferences, 'lessonSize' | 'onboardingCompleted'>>
  ): Promise<LearningPreferences> {
    const local = saveLocalPreferences(updates);
    const user = await this.getCurrentUser();
    if (!user) return local;

    try {
      const supabase = createClient();
      const payload: Partial<ProfileRecord> = {
        id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (isValidLessonSize(updates.lessonSize)) {
        payload.lesson_size = updates.lessonSize;
      }
      if (typeof updates.onboardingCompleted === 'boolean') {
        payload.onboarding_completed = updates.onboardingCompleted;
      }

      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) {
        console.warn('[LearningRepository] Could not sync preferences to cloud:', error.message);
      }
    } catch (err) {
      console.warn('[LearningRepository] Failed to save cloud preferences:', err);
    }

    return local;
  }

  /**
   * Loads full user learning progress: from Supabase `flag_progress` if authenticated,
   * otherwise from local storage for guest users.
   */
  async getUserProgress(): Promise<UserProgress> {
    const user = await this.getCurrentUser();
    if (!user) {
      return loadLocalProgress();
    }

    try {
      const supabase = createClient();
      const { data: rows, error } = await supabase
        .from('flag_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.warn('[LearningRepository] Failed to query cloud flag_progress:', error.message);
        return loadLocalProgress();
      }

      if (!rows || rows.length === 0) {
        // No cloud progress yet. Check if local progress exists for cache
        return loadLocalProgress();
      }

      // Convert database rows into authoritative UserProgress model
      const introducedCodes: string[] = [];
      const synthesizedHistory: PracticeAttempt[] = [];
      let latestActivity = 0;

      for (const row of rows as FlagProgressRecord[]) {
        const code = row.country_code.toUpperCase();
        if (row.introduced) {
          introducedCodes.push(code);
        }

        // Reconstruct approximate practice record for analytics tracking
        if (row.recall_attempts > 0) {
          synthesizedHistory.push({
            countryCode: code,
            mode: 'multiple-choice',
            isCorrect: row.correct_attempts > 0,
            timestamp: row.updated_at ? new Date(row.updated_at).getTime() : Date.now(),
          });
        }

        if (row.updated_at) {
          const t = new Date(row.updated_at).getTime();
          if (t > latestActivity) latestActivity = t;
        }
      }

      // Load any existing local session or completedBatches to preserve continental bookmarks
      const local = loadLocalProgress();

      const cloudProgress: UserProgress = {
        version: 1,
        introducedCountryCodes: Array.from(new Set(introducedCodes)),
        completedBatches: local.completedBatches || {},
        practiceHistory: synthesizedHistory.length > 0 ? synthesizedHistory : local.practiceHistory,
        lastActivity: Math.max(latestActivity, local.lastActivity || 0),
        lastSession: local.lastSession,
      };

      // Mirror to local storage so offline/fast access works seamlessly
      saveLocalProgress(cloudProgress);
      return cloudProgress;
    } catch (err) {
      console.warn('[LearningRepository] Unexpected error loading cloud progress:', err);
      return loadLocalProgress();
    }
  }

  /**
   * Records introduced countries in both local storage and Supabase `flag_progress`.
   */
  async saveCountriesIntroduced(codes: readonly string[]): Promise<UserProgress> {
    const local = markLocalCountriesIntroduced(codes);
    const user = await this.getCurrentUser();
    if (!user || codes.length === 0) return local;

    try {
      const supabase = createClient();
      const now = new Date().toISOString();

      const upserts = codes.map((c) => ({
        user_id: user.id,
        country_code: c.toUpperCase(),
        introduced: true,
        updated_at: now,
      }));

      const { error } = await supabase.from('flag_progress').upsert(upserts, {
        onConflict: 'user_id, country_code',
      });

      if (error) {
        console.warn('[LearningRepository] Error upserting introduced flags:', error.message);
      }
    } catch (err) {
      console.warn('[LearningRepository] Failed to save introduced flags to cloud:', err);
    }

    return local;
  }

  /**
   * Records batch completion.
   */
  async saveBatchCompleted(continent: Continent, batchIndex: number): Promise<UserProgress> {
    const local = markLocalBatchCompleted(continent, batchIndex);
    return local;
  }

  /**
   * Records an active recall practice attempt in both local storage and Supabase `flag_progress`.
   */
  async savePracticeAttempt(attempt: Omit<PracticeAttempt, 'timestamp'>): Promise<UserProgress> {
    const local = recordLocalPracticeAttempt(attempt);
    const user = await this.getCurrentUser();
    if (!user) return local;

    try {
      const supabase = createClient();
      const code = attempt.countryCode.toUpperCase();

      // Retrieve existing country record to increment attempts atomically
      const { data: existing } = await supabase
        .from('flag_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('country_code', code)
        .maybeSingle();

      const prevAttempts = existing?.recall_attempts || 0;
      const prevCorrect = existing?.correct_attempts || 0;
      const nextAttempts = prevAttempts + 1;
      const nextCorrect = prevCorrect + (attempt.isCorrect ? 1 : 0);
      const nextMastery = calculateMasteryScore(nextAttempts, nextCorrect);

      const payload = {
        user_id: user.id,
        country_code: code,
        introduced: true,
        mastery: nextMastery,
        recall_attempts: nextAttempts,
        correct_attempts: nextCorrect,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('flag_progress').upsert(payload, {
        onConflict: 'user_id, country_code',
      });

      if (error) {
        console.warn('[LearningRepository] Error saving practice attempt to cloud:', error.message);
      }
    } catch (err) {
      console.warn('[LearningRepository] Failed to record practice attempt to cloud:', err);
    }

    return local;
  }

  /**
   * Checks whether the user is eligible for a local-to-cloud progress migration prompt.
   */
  async checkMigrationEligibility(): Promise<MigrationState> {
    const defaultState: MigrationState = {
      eligibleForMigration: false,
      localIntroducedCount: 0,
      cloudIntroducedCount: 0,
      localAttemptsCount: 0,
    };

    const user = await this.getCurrentUser();
    if (!user) return defaultState;

    if (typeof window !== 'undefined' && window.localStorage) {
      const decision = window.localStorage.getItem(getMigrationDecisionKey(user.id));
      if (decision === 'imported' || decision === 'dismissed') {
        return defaultState;
      }
    }

    const local = loadLocalProgress();
    if (!hasMeaningfulLocalProgress(local)) {
      return defaultState;
    }

    try {
      const supabase = createClient();
      const { data: cloudRows } = await supabase
        .from('flag_progress')
        .select('country_code, introduced, recall_attempts, mastery')
        .eq('user_id', user.id);

      const hasCloudData = hasMeaningfulCloudProgress((cloudRows as FlagProgressRecord[]) || []);

      if (hasCloudData) {
        // Cloud already has established data; do not suggest overwriting
        return defaultState;
      }

      return {
        eligibleForMigration: true,
        localIntroducedCount: local.introducedCountryCodes.length,
        cloudIntroducedCount: 0,
        localAttemptsCount: local.practiceHistory.length,
      };
    } catch {
      return defaultState;
    }
  }

  /**
   * Executes the local-to-cloud progress migration for an authenticated user.
   */
  async mergeLocalProgress(): Promise<{ success: boolean; importedFlagsCount: number }> {
    const user = await this.getCurrentUser();
    if (!user) return { success: false, importedFlagsCount: 0 };

    const localProgress = loadLocalProgress();
    const localPrefs = loadLocalPreferences();

    try {
      const supabase = createClient();

      // Fetch cloud state
      const { data: cloudRows } = await supabase
        .from('flag_progress')
        .select('*')
        .eq('user_id', user.id);

      const { data: cloudProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const mergeResult = mergeLocalAndCloudProgress(
        user.id,
        localProgress,
        (cloudRows as FlagProgressRecord[]) || [],
        localPrefs,
        cloudProfile as ProfileRecord | null
      );

      // Upload merged flag progress in bulk
      if (mergeResult.mergedFlags.length > 0) {
        const { error: flagsError } = await supabase
          .from('flag_progress')
          .upsert(mergeResult.mergedFlags, {
            onConflict: 'user_id, country_code',
          });

        if (flagsError) {
          console.error('[LearningRepository] Error upserting merged flags:', flagsError);
          return { success: false, importedFlagsCount: 0 };
        }
      }

      // Update cloud profile preferences if relevant
      await supabase.from('profiles').upsert({
        id: user.id,
        lesson_size: mergeResult.mergedPreferences.lessonSize,
        onboarding_completed: mergeResult.mergedPreferences.onboardingCompleted,
        updated_at: new Date().toISOString(),
      });

      // Mark migration as completed locally
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(getMigrationDecisionKey(user.id), 'imported');
      }

      return {
        success: true,
        importedFlagsCount: mergeResult.stats.importedCountryCount,
      };
    } catch (err) {
      console.error('[LearningRepository] Failed to merge local progress to cloud:', err);
      return { success: false, importedFlagsCount: 0 };
    }
  }

  /**
   * Dismisses the migration prompt without importing local progress.
   */
  async dismissMigration(): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) return;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(getMigrationDecisionKey(user.id), 'dismissed');
    }
  }
}

// Singleton repository instance
export const learningRepository = new LearningRepository();
