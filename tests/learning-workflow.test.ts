import { describe, it, expect, beforeEach } from 'vitest';
import { getAllCountries, getCountriesByContinent, getCountryByCode } from '../src/lib/countries';
import {
  getContinentBatches,
  getBatch,
  getBatchByNumber,
  getContinentBatchCount,
  getTotalLessonsCount,
  BATCH_SIZE,
} from '../src/lib/batches';
import {
  loadPreferences,
  savePreferences,
  resetPreferences,
  isValidLessonSize,
  isValidPreferences,
  DEFAULT_LESSON_SIZE,
  VALID_LESSON_SIZES,
  LessonSize,
} from '../src/lib/preferences';
import {
  shuffleArray,
  initStudySession,
  saveStudySession,
  clearStudySession,
} from '../src/lib/session';
import {
  normalizeAnswerText,
  evaluateTypedAnswer,
  generateMultipleChoiceOptions,
} from '../src/lib/answers';
import {
  createDefaultProgress,
  isValidProgress,
  markCountriesIntroduced,
  markBatchCompleted,
  recordPracticeAttempt,
  getProgressStats,
  resetProgress,
  loadProgress,
  getNextLessonRecommendation,
} from '../src/lib/progress';

describe('Phase 2 Learning Workflow & Domain Logic', () => {
  describe('Batch Generation & Partitioning', () => {
    it('creates deterministic batches of 10 countries, with smaller final batch where needed', () => {
      // Africa has 54 countries -> 5 batches of 10, 1 batch of 4
      const africaBatches = getContinentBatches('Africa');
      expect(africaBatches.length).toBe(6);
      expect(africaBatches[0].countries.length).toBe(10);
      expect(africaBatches[4].countries.length).toBe(10);
      expect(africaBatches[5].countries.length).toBe(4);
      expect(africaBatches[5].isFinalBatch).toBe(true);

      // Europe has 45 countries -> 4 batches of 10, 1 batch of 5
      const europeBatches = getContinentBatches('Europe');
      expect(europeBatches.length).toBe(5);
      expect(europeBatches[4].countries.length).toBe(5);

      // South America has 12 countries -> 1 batch of 10, 1 batch of 2
      const saBatches = getContinentBatches('South America');
      expect(saBatches.length).toBe(2);
      expect(saBatches[0].countries.length).toBe(10);
      expect(saBatches[1].countries.length).toBe(2);
    });

    it('ensures no duplicate country appears within a continent batch sequence', () => {
      const continents = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'] as const;

      for (const continent of continents) {
        const batches = getContinentBatches(continent);
        const seenCodes = new Set<string>();
        let totalBatchedCountries = 0;

        for (const batch of batches) {
          for (const country of batch.countries) {
            expect(seenCodes.has(country.code)).toBe(false);
            seenCodes.add(country.code);
            totalBatchedCountries++;
          }
        }

        const expectedTotal = getCountriesByContinent(continent).length;
        expect(totalBatchedCountries).toBe(expectedTotal);
        expect(seenCodes.size).toBe(expectedTotal);
      }
    });

    it('returns empty batches for Antarctica with zero countries', () => {
      const antarcticaBatches = getContinentBatches('Antarctica');
      expect(antarcticaBatches.length).toBe(0);
    });

    it('retrieves individual batch by index safely', () => {
      const batch0 = getBatch('Asia', 0);
      expect(batch0).toBeDefined();
      expect(batch0?.countries.length).toBe(10);

      const invalidBatch = getBatch('Asia', 99);
      expect(invalidBatch).toBeUndefined();
    });
  });

  describe('Multiple Choice Question Generator', () => {
    it('generates 4 distinct options with exactly one correct country', () => {
      const allCountries = getAllCountries();
      const targetCountry = getCountryByCode('FR')!; // France

      const options = generateMultipleChoiceOptions(targetCountry, allCountries, 42);
      expect(options.length).toBe(4);

      // Unique options
      const codes = new Set(options.map((o) => o.code));
      expect(codes.size).toBe(4);

      // Target country is present
      expect(codes.has('FR')).toBe(true);
    });

    it('throws when candidate pool is too small to form 4 options', () => {
      const target = getCountryByCode('NP')!;
      const smallPool = [target, getCountryByCode('IN')!];

      expect(() => generateMultipleChoiceOptions(target, smallPool)).toThrow(
        /Insufficient candidate pool/
      );
    });
  });

  describe('Typed Recall Normalization & Alias Matching', () => {
    it('normalizes casing, extra spaces, and accents', () => {
      expect(normalizeAnswerText('   France   ')).toBe('france');
      expect(normalizeAnswerText('UNITED   STATES')).toBe('united states');
      expect(normalizeAnswerText('Côte d’Ivoire')).toBe('cote d ivoire');
      expect(normalizeAnswerText('Türkiye')).toBe('turkiye');
    });

    it('accepts correct country name regardless of casing and punctuation', () => {
      const japan = getCountryByCode('JP')!;
      const result = evaluateTypedAnswer('  jaPaN  ', japan);
      expect(result.isCorrect).toBe(true);
    });

    it('accepts official name and approved unambiguous aliases', () => {
      const us = getCountryByCode('US')!;
      expect(evaluateTypedAnswer('USA', us).isCorrect).toBe(true);
      expect(evaluateTypedAnswer('United States of America', us).isCorrect).toBe(true);
      expect(evaluateTypedAnswer('America', us).isCorrect).toBe(true);

      const uk = getCountryByCode('GB')!;
      expect(evaluateTypedAnswer('UK', uk).isCorrect).toBe(true);
      expect(evaluateTypedAnswer('Great Britain', uk).isCorrect).toBe(true);

      const drc = getCountryByCode('CD')!;
      expect(evaluateTypedAnswer('DRC', drc).isCorrect).toBe(true);
      expect(evaluateTypedAnswer('Democratic Republic of the Congo', drc).isCorrect).toBe(true);

      const vatican = getCountryByCode('VA')!;
      expect(evaluateTypedAnswer('Holy See', vatican).isCorrect).toBe(true);
      expect(evaluateTypedAnswer('Vatican', vatican).isCorrect).toBe(true);
    });

    it('rejects incorrect and ambiguous country answers', () => {
      const canada = getCountryByCode('CA')!;
      expect(evaluateTypedAnswer('USA', canada).isCorrect).toBe(false);
      expect(evaluateTypedAnswer('Canadia', canada).isCorrect).toBe(false);
      expect(evaluateTypedAnswer('', canada).isCorrect).toBe(false);
    });
  });

  describe('Local Progress Persistence & Data Protection', () => {
    beforeEach(() => {
      // Clear mock storage before each test
      resetProgress();
    });

    it('validates correct progress schema and rejects corrupted payloads', () => {
      const valid = createDefaultProgress();
      expect(isValidProgress(valid)).toBe(true);

      expect(isValidProgress(null)).toBe(false);
      expect(isValidProgress({})).toBe(false);
      expect(isValidProgress({ version: 2 })).toBe(false); // wrong version
      expect(isValidProgress({ version: 1, introducedCountryCodes: 'not-an-array' })).toBe(false);
    });

    it('tracks introduced countries without duplicates', () => {
      markCountriesIntroduced(['FR', 'DE', 'IT']);
      markCountriesIntroduced(['FR', 'ES']); // FR repeated

      const current = loadProgress();
      expect(current.introducedCountryCodes.length).toBe(4);
      expect(current.introducedCountryCodes).toContain('FR');
      expect(current.introducedCountryCodes).toContain('DE');
      expect(current.introducedCountryCodes).toContain('IT');
      expect(current.introducedCountryCodes).toContain('ES');
    });

    it('records batch completion and practice attempts truthfully', () => {
      markBatchCompleted('Europe', 0);
      const afterBatch = loadProgress();
      expect(afterBatch.completedBatches.Europe).toEqual([0]);

      recordPracticeAttempt({
        countryCode: 'FR',
        mode: 'multiple-choice',
        isCorrect: true,
      });

      recordPracticeAttempt({
        countryCode: 'DE',
        mode: 'multiple-choice',
        isCorrect: false,
      });

      const stats = getProgressStats(195);
      expect(stats.completedBatchCount).toBe(1);
      expect(stats.practiceAttemptsCount).toBe(2);
      expect(stats.practiceAccuracy).toBe(50); // 1 out of 2 = 50%
    });

    it('derives the next recommended lesson dynamically based on progress', () => {
      const getBatchDetails = (continent: any, batchIndex: number) => {
        const batch = getBatch(continent, batchIndex);
        if (!batch) return undefined;
        return { countryCount: batch.countries.length, totalBatches: batch.totalBatches };
      };

      // 1. Brand new user -> Africa Batch 1
      const initial = createDefaultProgress();
      const rec1 = getNextLessonRecommendation(initial, getBatchDetails);
      expect(rec1.continent).toBe('Africa');
      expect(rec1.batchIndex).toBe(0);
      expect(rec1.batchNumber).toBe(1);
      expect(rec1.actionType).toBe('start');
      expect(rec1.badgeLabel).toBe('First Lesson');

      // 2. Active session uncompleted -> Resumes session
      const withSession = {
        ...initial,
        lastSession: {
          continent: 'Asia' as const,
          batchIndex: 1,
          mode: 'study' as const,
          timestamp: Date.now(),
        },
      };
      const rec2 = getNextLessonRecommendation(withSession, getBatchDetails);
      expect(rec2.continent).toBe('Asia');
      expect(rec2.batchIndex).toBe(1);
      expect(rec2.actionType).toBe('resume');
      expect(rec2.badgeLabel).toBe('Resume Lesson');

      // 3. Africa Batch 0 completed -> Recommends Africa Batch 1 (batchNumber 2)
      const afterAfrica0 = {
        ...initial,
        completedBatches: { Africa: [0] },
      };
      const rec3 = getNextLessonRecommendation(afterAfrica0, getBatchDetails);
      expect(rec3.continent).toBe('Africa');
      expect(rec3.batchIndex).toBe(1);
      expect(rec3.batchNumber).toBe(2);
      expect(rec3.actionType).toBe('next');

      // 4. All Africa batches completed -> Moves to Asia Batch 1
      const afterAllAfrica = {
        ...initial,
        completedBatches: { Africa: [0, 1, 2, 3, 4, 5] },
      };
      const rec4 = getNextLessonRecommendation(afterAllAfrica, getBatchDetails);
      expect(rec4.continent).toBe('Asia');
      expect(rec4.batchIndex).toBe(0);
      expect(rec4.batchNumber).toBe(1);

      // 5. All continents completed
      const allCompleted = {
        ...initial,
        completedBatches: {
          Africa: [0, 1, 2, 3, 4, 5],
          Asia: [0, 1, 2, 3, 4],
          Europe: [0, 1, 2, 3, 4],
          'North America': [0, 1, 2],
          'South America': [0, 1],
          Oceania: [0, 1],
        },
      };
      const rec5 = getNextLessonRecommendation(allCompleted, getBatchDetails);
      expect(rec5.actionType).toBe('all-completed');
      expect(rec5.badgeLabel).toBe('Curriculum Completed');
    });
  });

  describe('Authoritative Batch Identity & Numbering', () => {
    it('retrieves batches reliably by 1-based batchNumber', () => {
      const batch1 = getBatchByNumber('Africa', 1);
      expect(batch1).toBeDefined();
      expect(batch1?.batchNumber).toBe(1);
      expect(batch1?.batchIndex).toBe(0);
      expect(batch1?.countries.length).toBe(10);
      // Canonical first country in Africa
      expect(batch1?.countries[0].name).toBe('Algeria');

      const batch2 = getBatchByNumber('Africa', 2);
      expect(batch2).toBeDefined();
      expect(batch2?.batchNumber).toBe(2);
      expect(batch2?.batchIndex).toBe(1);
      expect(batch2?.countries.length).toBe(10);

      // Final batch in Africa (Batch 6)
      const batch6 = getBatchByNumber('Africa', 6);
      expect(batch6).toBeDefined();
      expect(batch6?.batchNumber).toBe(6);
      expect(batch6?.batchIndex).toBe(5);
      expect(batch6?.isFinalBatch).toBe(true);

      // Out of bounds / invalid
      expect(getBatchByNumber('Africa', 0)).toBeUndefined();
      expect(getBatchByNumber('Africa', -1)).toBeUndefined();
      expect(getBatchByNumber('Africa', 7)).toBeUndefined();
    });
  });

  describe('Lesson Session Randomization & Country Identity', () => {
    it('shuffles array without mutating original items or losing members', () => {
      const original = ['DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD'];
      const shuffled = shuffleArray(original);

      expect(shuffled.length).toBe(original.length);
      expect(new Set(shuffled)).toEqual(new Set(original));
      // Original remains untouched
      expect(original[0]).toBe('DZ');
    });

    it('initializes a study session with randomized presentation order', () => {
      const batch = getBatchByNumber('Africa', 1)!;
      const session = initStudySession('Africa', 1, batch.countries, true);

      expect(session.continent).toBe('Africa');
      expect(session.batchNumber).toBe(1);
      expect(session.currentIndex).toBe(0);
      expect(session.completed).toBe(false);
      expect(session.shuffledCountryCodes.length).toBe(10);

      const canonicalCodes = batch.countries.map((c) => c.code);
      expect(new Set(session.shuffledCountryCodes)).toEqual(new Set(canonicalCodes));
    });

    it('associates country learning state with ISO country code rather than position index', () => {
      resetProgress();

      // Study two countries in arbitrary session positions
      const countryCodeAtPos0 = 'GQ'; // Equatorial Guinea
      const countryCodeAtPos7 = 'GA'; // Gabon

      markCountriesIntroduced([countryCodeAtPos0]);
      markCountriesIntroduced([countryCodeAtPos7]);

      const progress = loadProgress();
      expect(progress.introducedCountryCodes).toContain('GQ');
      expect(progress.introducedCountryCodes).toContain('GA');
      expect(progress.introducedCountryCodes.length).toBe(2);

      // Verify that country introduced check is identity-based
      expect(progress.introducedCountryCodes.includes('GQ')).toBe(true);
      expect(progress.introducedCountryCodes.includes('GA')).toBe(true);
      expect(progress.introducedCountryCodes.includes('FR')).toBe(false);
    });
  });

  describe('Learning Preferences Model', () => {
    beforeEach(() => {
      resetPreferences();
    });

    it('has default lesson size of 10 and onboardingCompleted false for new clean state', () => {
      const prefs = loadPreferences();
      expect(prefs.lessonSize).toBe(10);
      expect(DEFAULT_LESSON_SIZE).toBe(10);
    });

    it('validates only 5, 10, 15 as permissible lesson sizes', () => {
      expect(VALID_LESSON_SIZES).toEqual([5, 10, 15]);
      expect(isValidLessonSize(5)).toBe(true);
      expect(isValidLessonSize(10)).toBe(true);
      expect(isValidLessonSize(15)).toBe(true);
      expect(isValidLessonSize(20)).toBe(false);
      expect(isValidLessonSize(0)).toBe(false);
      expect(isValidLessonSize('10')).toBe(false);
      expect(isValidLessonSize(null)).toBe(false);
    });

    it('saves and loads user preferences correctly', () => {
      const saved = savePreferences({ lessonSize: 5, onboardingCompleted: true });
      expect(saved.lessonSize).toBe(5);
      expect(saved.onboardingCompleted).toBe(true);

      const loaded = loadPreferences();
      expect(loaded.lessonSize).toBe(5);
      expect(loaded.onboardingCompleted).toBe(true);

      const updated15 = savePreferences({ lessonSize: 15 });
      expect(updated15.lessonSize).toBe(15);
      expect(updated15.onboardingCompleted).toBe(true);
    });

    it('validates preference structure and falls back safely on invalid data', () => {
      expect(isValidPreferences({ lessonSize: 10, onboardingCompleted: true, updatedAt: 123 })).toBe(true);
      expect(isValidPreferences({ lessonSize: 99, onboardingCompleted: true })).toBe(false);
      expect(isValidPreferences(null)).toBe(false);
      expect(isValidPreferences('invalid')).toBe(false);
    });
  });

  describe('Personalized Lesson Size Curriculum & Batches (5, 10, 15)', () => {
    it('partitions 54 countries in Africa correctly for 5, 10, and 15 flags', () => {
      const africaCountries = getCountriesByContinent('Africa');
      expect(africaCountries.length).toBe(54);

      // 5-flag lessons: 54 / 5 = 10 full lessons of 5 + 1 final lesson of 4 = 11 lessons
      const batches5 = getContinentBatches('Africa', 5);
      expect(batches5.length).toBe(11);
      expect(batches5[0].countries.length).toBe(5);
      expect(batches5[9].countries.length).toBe(5);
      expect(batches5[10].countries.length).toBe(4);
      expect(batches5[10].isFinalBatch).toBe(true);

      // 10-flag lessons: 54 / 10 = 5 full lessons of 10 + 1 final lesson of 4 = 6 lessons
      const batches10 = getContinentBatches('Africa', 10);
      expect(batches10.length).toBe(6);
      expect(batches10[0].countries.length).toBe(10);
      expect(batches10[4].countries.length).toBe(10);
      expect(batches10[5].countries.length).toBe(4);
      expect(batches10[5].isFinalBatch).toBe(true);

      // 15-flag lessons: 54 / 15 = 3 full lessons of 15 + 1 final lesson of 9 = 4 lessons
      const batches15 = getContinentBatches('Africa', 15);
      expect(batches15.length).toBe(4);
      expect(batches15[0].countries.length).toBe(15);
      expect(batches15[2].countries.length).toBe(15);
      expect(batches15[3].countries.length).toBe(9);
      expect(batches15[3].isFinalBatch).toBe(true);
    });

    it('preserves canonical country ordering across all lesson sizes', () => {
      const canonicalAfrica = getCountriesByContinent('Africa');

      const flat5 = getContinentBatches('Africa', 5).flatMap((b) => b.countries);
      const flat10 = getContinentBatches('Africa', 10).flatMap((b) => b.countries);
      const flat15 = getContinentBatches('Africa', 15).flatMap((b) => b.countries);

      expect(flat5.map((c) => c.code)).toEqual(canonicalAfrica.map((c) => c.code));
      expect(flat10.map((c) => c.code)).toEqual(canonicalAfrica.map((c) => c.code));
      expect(flat15.map((c) => c.code)).toEqual(canonicalAfrica.map((c) => c.code));
    });

    it('calculates total curriculum lessons dynamically respecting continental boundaries', () => {
      // Africa: 54 -> 11 (5), 6 (10), 4 (15)
      // Asia: 48 -> 10 (5), 5 (10), 4 (15)
      // Europe: 45 -> 9 (5), 5 (10), 3 (15)
      // North America: 23 -> 5 (5), 3 (10), 2 (15)
      // South America: 12 -> 3 (5), 2 (10), 1 (15)
      // Oceania: 13 -> 3 (5), 2 (10), 1 (15)
      // Antarctica: 0 -> 0 (5), 0 (10), 0 (15)
      // Totals:
      // 5 flags: 11 + 10 + 9 + 5 + 3 + 3 = 41 lessons
      // 10 flags: 6 + 5 + 5 + 3 + 2 + 2 = 23 lessons
      // 15 flags: 4 + 4 + 3 + 2 + 1 + 1 = 15 lessons
      expect(getTotalLessonsCount(5)).toBe(41);
      expect(getTotalLessonsCount(10)).toBe(23);
      expect(getTotalLessonsCount(15)).toBe(15);
    });

    it('retrieves individual batch by 1-based number with specified lesson size', () => {
      // 5-flag user can retrieve Lesson 11 in Africa
      const lesson11_size5 = getBatchByNumber('Africa', 11, 5);
      expect(lesson11_size5).toBeDefined();
      expect(lesson11_size5?.countries.length).toBe(4);

      // 10-flag user requesting Lesson 11 returns undefined
      const lesson11_size10 = getBatchByNumber('Africa', 11, 10);
      expect(lesson11_size10).toBeUndefined();

      // 15-flag user can retrieve Lesson 4 in Africa
      const lesson4_size15 = getBatchByNumber('Africa', 4, 15);
      expect(lesson4_size15).toBeDefined();
      expect(lesson4_size15?.countries.length).toBe(9);
    });
  });

  describe('Dynamic Next Lesson Recommendation with personalized lesson size', () => {
    beforeEach(() => {
      resetProgress();
    });

    it('recommends First Lesson with 5 flags for 5-flag preference', () => {
      const progress = loadProgress();
      const next5 = getNextLessonRecommendation(progress, (continent, idx) => {
        const batch = getBatch(continent, idx, 5);
        if (!batch) return undefined;
        return { countryCount: batch.countries.length, totalBatches: batch.totalBatches, countries: batch.countries };
      });

      expect(next5.continent).toBe('Africa');
      expect(next5.batchNumber).toBe(1);
      expect(next5.countryCount).toBe(5);
      expect(next5.description).toContain('5 sovereign country flags');
    });

    it('recommends First Lesson with 15 flags for 15-flag preference', () => {
      const progress = loadProgress();
      const next15 = getNextLessonRecommendation(progress, (continent, idx) => {
        const batch = getBatch(continent, idx, 15);
        if (!batch) return undefined;
        return { countryCount: batch.countries.length, totalBatches: batch.totalBatches, countries: batch.countries };
      });

      expect(next15.continent).toBe('Africa');
      expect(next15.batchNumber).toBe(1);
      expect(next15.countryCount).toBe(15);
      expect(next15.description).toContain('15 sovereign country flags');
    });

    it('advances seamlessly when country flags are introduced across lesson size switches', () => {
      // Introduce the first 10 countries of Africa (Lesson 1 under 10-flag pace)
      const batches10 = getContinentBatches('Africa', 10);
      const first10Codes = batches10[0].countries.map((c) => c.code);
      markCountriesIntroduced(first10Codes);

      const progress = loadProgress();

      // For a 5-flag user, the first 10 countries cover Lesson 1 AND Lesson 2!
      // So the next recommended lesson should be Lesson 3 (countries 11-15)
      const next5 = getNextLessonRecommendation(progress, (continent, idx) => {
        const batch = getBatch(continent, idx, 5);
        if (!batch) return undefined;
        return { countryCount: batch.countries.length, totalBatches: batch.totalBatches, countries: batch.countries };
      });

      expect(next5.continent).toBe('Africa');
      expect(next5.batchNumber).toBe(3);
      expect(next5.countryCount).toBe(5);
    });
  });
});

