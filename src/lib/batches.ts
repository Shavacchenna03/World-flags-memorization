import { Continent, Country } from '../types/country';
import { getCountriesByContinent } from './countries';

export const BATCH_SIZE = 10;

export interface CountryBatch {
  continent: Continent;
  batchIndex: number;
  batchNumber: number; // 1-indexed for display
  totalBatches: number;
  countries: readonly Country[];
  isFinalBatch: boolean;
}

/**
 * Deterministically splits a continent's countries into sequential batches of 10.
 * Countries maintain stable alphabetical ordering by default.
 */
export function getContinentBatches(continent: Continent): readonly CountryBatch[] {
  const list = getCountriesByContinent(continent);
  if (list.length === 0) return [];

  const batches: CountryBatch[] = [];
  const totalBatches = Math.ceil(list.length / BATCH_SIZE);

  for (let i = 0; i < totalBatches; i++) {
    const start = i * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, list.length);
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
 * Retrieves a specific batch by continent and 0-based batch index.
 */
export function getBatch(
  continent: Continent,
  batchIndex: number
): CountryBatch | undefined {
  const batches = getContinentBatches(continent);
  if (batchIndex < 0 || batchIndex >= batches.length) return undefined;
  return batches[batchIndex];
}

/**
 * Returns the total batch count for a continent.
 */
export function getContinentBatchCount(continent: Continent): number {
  const list = getCountriesByContinent(continent);
  return Math.ceil(list.length / BATCH_SIZE);
}
