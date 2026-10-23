import { Continent, ALL_CONTINENTS, Country } from '../types/country';
import { getCountriesByContinent } from './countries';
import { LessonSize, DEFAULT_LESSON_SIZE } from './preferences';

export const BATCH_SIZE = DEFAULT_LESSON_SIZE;

export interface CountryBatch {
  continent: Continent;
  batchIndex: number;
  batchNumber: number; // 1-indexed for display / lesson number
  totalBatches: number;
  countries: readonly Country[];
  isFinalBatch: boolean;
}

/**
 * Deterministically derives sequential lessons for a continent given the user's lesson size (5, 10, or 15).
 * The canonical 195-country curriculum and country ordering remain untouched.
 */
export function getContinentBatches(
  continent: Continent,
  lessonSize: LessonSize = DEFAULT_LESSON_SIZE
): readonly CountryBatch[] {
  const list = getCountriesByContinent(continent);
  if (list.length === 0) return [];

  const batches: CountryBatch[] = [];
  const totalBatches = Math.ceil(list.length / lessonSize);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * lessonSize;
    const end = Math.min(start + lessonSize, list.length);
    const batchCountries = list.slice(start, end);

    batches.push({
      continent,
      batchIndex: i,
      batchNumber: i + 1,
      totalBatches,
      countries: Object.freeze(batchCountries),
      isFinalBatch: i === totalBatches - 1,
    });
  }

  return Object.freeze(batches);
}

/**
 * Retrieves a specific lesson by continent, 0-based index, and lesson size.
 */
export function getBatch(
  continent: Continent,
  batchIndex: number,
  lessonSize: LessonSize = DEFAULT_LESSON_SIZE
): CountryBatch | undefined {
  const batches = getContinentBatches(continent, lessonSize);
  if (batchIndex < 0 || batchIndex >= batches.length) return undefined;
  return batches[batchIndex];
}

/**
 * Retrieves a specific lesson by continent, 1-based lesson number, and lesson size.
 * Returns undefined if lessonNumber is less than 1 or out of range.
 */
export function getBatchByNumber(
  continent: Continent,
  batchNumber: number,
  lessonSize: LessonSize = DEFAULT_LESSON_SIZE
): CountryBatch | undefined {
  if (batchNumber < 1) return undefined;
  return getBatch(continent, batchNumber - 1, lessonSize);
}

/**
 * Returns the total lesson count for a continent given a specific lesson size.
 */
export function getContinentBatchCount(
  continent: Continent,
  lessonSize: LessonSize = DEFAULT_LESSON_SIZE
): number {
  const list = getCountriesByContinent(continent);
  return Math.ceil(list.length / lessonSize);
}

/**
 * Returns the total lesson count across all 7 continents respecting continental boundaries.
 */
export function getTotalLessonsCount(lessonSize: LessonSize = DEFAULT_LESSON_SIZE): number {
  return ALL_CONTINENTS.reduce(
    (sum, c) => sum + getContinentBatchCount(c, lessonSize),
    0
  );
}
