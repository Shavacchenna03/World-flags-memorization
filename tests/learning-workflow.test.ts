import { describe, it, expect, beforeEach } from 'vitest';
import { getAllCountries, getCountriesByContinent, getCountryByCode } from '../src/lib/countries';
import { getContinentBatches, getBatch, BATCH_SIZE } from '../src/lib/batches';
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
  });
});
