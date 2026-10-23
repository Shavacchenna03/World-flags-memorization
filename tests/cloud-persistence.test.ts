import { describe, it, expect, beforeEach } from 'vitest';
import {
  mergeLocalAndCloudProgress,
  hasMeaningfulLocalProgress,
  hasMeaningfulCloudProgress,
  calculateMasteryScore,
} from '../src/lib/progress/merge';
import { UserProgress, createDefaultProgress } from '../src/lib/progress';
import { FlagProgressRecord, ProfileRecord } from '../src/lib/progress/types';
import {
  DEFAULT_LESSON_SIZE,
  VALID_LESSON_SIZES,
  isValidLessonSize,
  LearningPreferences,
} from '../src/lib/preferences';

describe('Phase 2: Supabase Cloud Persistence & Data Repository', () => {
  const TEST_USER_ID = 'test-user-uuid-1234';
  const OTHER_USER_ID = 'other-user-uuid-5678';

  describe('Profile Defaults & Constraints', () => {
    it('enforces default lesson size of 10 and onboarding false for profiles', () => {
      expect(DEFAULT_LESSON_SIZE).toBe(10);
      expect(VALID_LESSON_SIZES).toEqual([5, 10, 15]);
    });

    it('validates only permissible lesson sizes (5, 10, 15)', () => {
      expect(isValidLessonSize(5)).toBe(true);
      expect(isValidLessonSize(10)).toBe(true);
      expect(isValidLessonSize(15)).toBe(true);
      expect(isValidLessonSize(20)).toBe(false);
      expect(isValidLessonSize(0)).toBe(false);
      expect(isValidLessonSize(-5)).toBe(false);
      expect(isValidLessonSize(null)).toBe(false);
      expect(isValidLessonSize('10')).toBe(false);
    });
  });

  describe('Mastery Calculation', () => {
    it('calculates mastery score based on volume and accuracy', () => {
      expect(calculateMasteryScore(0, 0)).toBe(0);
      // 1 attempt, 1 correct: 100% accuracy but low volume (1/5) => ~20%
      expect(calculateMasteryScore(1, 1)).toBe(20);
      // 5 attempts, 5 correct: 100% accuracy and full volume factor (5/5) => 100%
      expect(calculateMasteryScore(5, 5)).toBe(100);
      // 5 attempts, 3 correct: 60% accuracy and full volume factor => 60%
      expect(calculateMasteryScore(5, 3)).toBe(60);
      // 10 attempts, 0 correct: 0%
      expect(calculateMasteryScore(10, 0)).toBe(0);
    });
  });

  describe('Local and Cloud Meaningful Progress Detection', () => {
    it('detects meaningful local progress', () => {
      const empty = createDefaultProgress();
      expect(hasMeaningfulLocalProgress(empty)).toBe(false);
      expect(hasMeaningfulLocalProgress(null)).toBe(false);

      const withIntroduced: UserProgress = {
        ...empty,
        introducedCountryCodes: ['GQ', 'GA'],
      };
      expect(hasMeaningfulLocalProgress(withIntroduced)).toBe(true);

      const withHistory: UserProgress = {
        ...empty,
        practiceHistory: [
          { countryCode: 'FR', mode: 'multiple-choice', isCorrect: true, timestamp: 123 },
        ],
      };
      expect(hasMeaningfulLocalProgress(withHistory)).toBe(true);

      const withCompletedBatch: UserProgress = {
        ...empty,
        completedBatches: { Africa: [0] },
      };
      expect(hasMeaningfulLocalProgress(withCompletedBatch)).toBe(true);
    });

    it('detects established cloud progress', () => {
      expect(hasMeaningfulCloudProgress([])).toBe(false);

      const unintroduced: FlagProgressRecord[] = [
        {
          user_id: TEST_USER_ID,
          country_code: 'DZ',
          introduced: false,
          mastery: 0,
          recall_attempts: 0,
          correct_attempts: 0,
        },
      ];
      expect(hasMeaningfulCloudProgress(unintroduced)).toBe(false);

      const withIntroduced: FlagProgressRecord[] = [
        {
          user_id: TEST_USER_ID,
          country_code: 'DZ',
          introduced: true,
          mastery: 0,
          recall_attempts: 0,
          correct_attempts: 0,
        },
      ];
      expect(hasMeaningfulCloudProgress(withIntroduced)).toBe(true);

      const withPractice: FlagProgressRecord[] = [
        {
          user_id: TEST_USER_ID,
          country_code: 'DZ',
          introduced: false,
          mastery: 50,
          recall_attempts: 3,
          correct_attempts: 2,
        },
      ];
      expect(hasMeaningfulCloudProgress(withPractice)).toBe(true);
    });
  });

  describe('Deterministic Progress Merge (Local -> Cloud Migration)', () => {
    it('imports all local introduced countries into an empty cloud account', () => {
      const local: UserProgress = {
        version: 1,
        introducedCountryCodes: ['GQ', 'GA', 'CM'],
        completedBatches: { Africa: [0] },
        practiceHistory: [
          { countryCode: 'GQ', mode: 'multiple-choice', isCorrect: true, timestamp: 100 },
          { countryCode: 'GQ', mode: 'multiple-choice', isCorrect: true, timestamp: 101 },
          { countryCode: 'GA', mode: 'typed', isCorrect: false, timestamp: 102 },
        ],
        lastActivity: Date.now(),
      };

      const localPrefs: LearningPreferences = {
        lessonSize: 5,
        onboardingCompleted: true,
        updatedAt: Date.now(),
      };

      const result = mergeLocalAndCloudProgress(TEST_USER_ID, local, [], localPrefs, null);

      expect(result.stats.importedCountryCount).toBe(3);
      expect(result.stats.totalMergedAttempts).toBe(3);

      const gqRecord = result.mergedFlags.find((f) => f.country_code === 'GQ');
      expect(gqRecord).toBeDefined();
      expect(gqRecord?.user_id).toBe(TEST_USER_ID);
      expect(gqRecord?.introduced).toBe(true);
      expect(gqRecord?.recall_attempts).toBe(2);
      expect(gqRecord?.correct_attempts).toBe(2);
      expect(gqRecord?.mastery).toBeGreaterThan(0);

      const gaRecord = result.mergedFlags.find((f) => f.country_code === 'GA');
      expect(gaRecord).toBeDefined();
      expect(gaRecord?.recall_attempts).toBe(1);
      expect(gaRecord?.correct_attempts).toBe(0);

      // Inherits local 5-flag preference because cloud was uninitialized
      expect(result.mergedPreferences.lessonSize).toBe(5);
      expect(result.mergedPreferences.onboardingCompleted).toBe(true);
    });

    it('preserves established cloud mastery and combines attempt counts', () => {
      const cloudFlags: FlagProgressRecord[] = [
        {
          user_id: TEST_USER_ID,
          country_code: 'JP',
          introduced: true,
          mastery: 80,
          recall_attempts: 5,
          correct_attempts: 4,
          updated_at: '2026-10-20T10:00:00Z',
        },
      ];

      const local: UserProgress = {
        version: 1,
        introducedCountryCodes: ['JP', 'KR'], // JP exists in cloud, KR is new
        completedBatches: {},
        practiceHistory: [
          { countryCode: 'JP', mode: 'multiple-choice', isCorrect: true, timestamp: 200 },
          { countryCode: 'KR', mode: 'typed', isCorrect: true, timestamp: 201 },
        ],
        lastActivity: Date.now(),
      };

      const cloudProfile: ProfileRecord = {
        id: TEST_USER_ID,
        display_name: 'Existing Cloud User',
        lesson_size: 15,
        onboarding_completed: true,
      };

      const result = mergeLocalAndCloudProgress(
        TEST_USER_ID,
        local,
        cloudFlags,
        { lessonSize: 5, onboardingCompleted: true, updatedAt: 1 },
        cloudProfile
      );

      // Total countries should be JP + KR = 2
      expect(result.mergedFlags.length).toBe(2);

      const jp = result.mergedFlags.find((f) => f.country_code === 'JP')!;
      expect(jp.recall_attempts).toBe(6); // 5 (cloud) + 1 (local)
      expect(jp.correct_attempts).toBe(5); // 4 (cloud) + 1 (local)
      expect(jp.mastery).toBe(80); // Preserved existing high cloud mastery

      const kr = result.mergedFlags.find((f) => f.country_code === 'KR')!;
      expect(kr.introduced).toBe(true);
      expect(kr.recall_attempts).toBe(1);

      // Cloud profile onboarding completed takes precedence
      expect(result.mergedPreferences.lessonSize).toBe(15);
      expect(result.mergedPreferences.onboardingCompleted).toBe(true);
    });

    it('ensures country progress keys are strictly ISO country codes, never array indexes', () => {
      const local: UserProgress = {
        version: 1,
        introducedCountryCodes: ['IN', 'NP', 'LK'],
        completedBatches: {},
        practiceHistory: [],
        lastActivity: Date.now(),
      };

      const result = mergeLocalAndCloudProgress(TEST_USER_ID, local, []);
      for (const flag of result.mergedFlags) {
        expect(typeof flag.country_code).toBe('string');
        expect(flag.country_code.length).toBe(2);
        expect(flag.country_code).toBe(flag.country_code.toUpperCase());
        expect(flag.country_code).not.toMatch(/^\d+$/); // Not an index number
      }
    });

    it('maintains strict user isolation during progress synthesis', () => {
      const local: UserProgress = {
        version: 1,
        introducedCountryCodes: ['BR', 'AR'],
        completedBatches: {},
        practiceHistory: [],
        lastActivity: Date.now(),
      };

      const resultUser1 = mergeLocalAndCloudProgress(TEST_USER_ID, local, []);
      const resultUser2 = mergeLocalAndCloudProgress(OTHER_USER_ID, local, []);

      expect(resultUser1.mergedFlags.every((f) => f.user_id === TEST_USER_ID)).toBe(true);
      expect(resultUser2.mergedFlags.every((f) => f.user_id === OTHER_USER_ID)).toBe(true);
      expect(resultUser1.mergedFlags.some((f) => f.user_id === OTHER_USER_ID)).toBe(false);
    });
  });
});
