/**
 * Type definitions for the World Flags country registry and learning domain.
 */

export type Continent =
  | 'Africa'
  | 'Asia'
  | 'Europe'
  | 'North America'
  | 'South America'
  | 'Oceania'
  | 'Antarctica';

export const ALL_CONTINENTS: readonly Continent[] = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
  'Antarctica',
] as const;

/**
 * Raw country record matching data/countries.json schema.
 */
export interface RawCountry {
  id: string;
  code: string;
  isoAlpha3: string;
  name: string;
  officialName: string;
  continent: string | null;
  region: string | null;
  subregion: string | null;
  capital: string | null;
  flagAssetPath: string;
}

/**
 * Normalized country entity with validated primary continent assignment.
 */
export interface Country {
  id: string;
  code: string;
  isoAlpha3: string;
  name: string;
  officialName: string;
  continent: Continent;
  region: string | null;
  subregion: string | null;
  capital: string | null;
  flagAssetPath: string;
}

/**
 * Aggregated summary for continent-level navigation and progress.
 */
export interface ContinentSummary {
  name: Continent;
  countryCount: number;
  description: string;
}
