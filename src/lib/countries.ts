import rawData from '../../data/countries.json';
import {
  Country,
  RawCountry,
  Continent,
  ALL_CONTINENTS,
  ContinentSummary,
} from '../types/country';

/**
 * Expected sovereign country count based on 193 UN Member States + 2 Observer States (VA, PS).
 */
export const EXPECTED_COUNTRY_COUNT = 195;

/**
 * Deterministic mapping rules assigning each country to exactly one primary continent:
 * - Africa: region === 'Africa' (54 sovereign states)
 * - Europe: region === 'Europe' (45 sovereign states, including transcontinental Russia)
 * - Asia: region === 'Asia' (47 sovereign states, including transcontinental Türkiye, Armenia, Azerbaijan, Georgia, Cyprus)
 * - Oceania: region === 'Oceania' (14 sovereign states)
 * - South America: region === 'Americas' && subregion === 'South America' (12 sovereign states)
 * - North America: region === 'Americas' && subregion !== 'South America' (23 sovereign states)
 * - Antarctica: 0 sovereign states under international treaty
 */
export function resolvePrimaryContinent(raw: RawCountry): Continent {
  if (raw.region === 'Africa') return 'Africa';
  if (raw.region === 'Europe') return 'Europe';
  if (raw.region === 'Asia') return 'Asia';
  if (raw.region === 'Oceania') return 'Oceania';
  if (raw.region === 'Americas') {
    return raw.subregion === 'South America' ? 'South America' : 'North America';
  }

  throw new Error(
    `Unable to resolve primary continent for country "${raw.code}" (${raw.name}) with region="${raw.region}", subregion="${raw.subregion}".`
  );
}

/**
 * Validates and normalizes raw dataset into immutable domain entities.
 */
function initializeCountryRegistry(): {
  countries: readonly Country[];
  byCode: ReadonlyMap<string, Country>;
} {
  if (!Array.isArray(rawData)) {
    throw new Error('Country dataset is malformed: expected top-level array.');
  }

  if (rawData.length !== EXPECTED_COUNTRY_COUNT) {
    throw new Error(
      `Country dataset count mismatch: expected ${EXPECTED_COUNTRY_COUNT} records, found ${rawData.length}.`
    );
  }

  const normalizedList: Country[] = [];
  const map = new Map<string, Country>();

  for (let i = 0; i < rawData.length; i++) {
    const item = rawData[i] as RawCountry;

    if (!item.id || typeof item.id !== 'string') {
      throw new Error(`Record at index ${i} has missing or invalid 'id'.`);
    }
    if (!item.code || typeof item.code !== 'string' || item.code.length !== 2) {
      throw new Error(`Record "${item.id}" has invalid alpha-2 code "${item.code}".`);
    }
    if (!item.name || typeof item.name !== 'string') {
      throw new Error(`Record "${item.id}" has missing or invalid 'name'.`);
    }
    if (!item.officialName || typeof item.officialName !== 'string') {
      throw new Error(`Record "${item.id}" has missing or invalid 'officialName'.`);
    }
    if (!item.flagAssetPath || typeof item.flagAssetPath !== 'string') {
      throw new Error(`Record "${item.id}" has missing or invalid 'flagAssetPath'.`);
    }

    const codeUpper = item.code.toUpperCase();
    if (map.has(codeUpper)) {
      throw new Error(`Duplicate country code "${codeUpper}" detected in dataset.`);
    }

    const country: Country = {
      id: item.id,
      code: codeUpper,
      isoAlpha3: item.isoAlpha3,
      name: item.name,
      officialName: item.officialName,
      continent: resolvePrimaryContinent(item),
      region: item.region,
      subregion: item.subregion,
      capital: item.capital,
      flagAssetPath: item.flagAssetPath,
    };

    normalizedList.push(country);
    map.set(codeUpper, country);
  }

  // Freeze array and objects to guarantee immutability
  normalizedList.sort((a, b) => a.name.localeCompare(b.name));
  return {
    countries: Object.freeze(normalizedList),
    byCode: map,
  };
}

// Singleton registry initialized once at module load
const { countries: REGISTRY, byCode: CODE_INDEX } = initializeCountryRegistry();

/**
 * Returns all 195 sovereign countries sorted alphabetically.
 */
export function getAllCountries(): readonly Country[] {
  return REGISTRY;
}

/**
 * Looks up a country by its ISO 3166-1 alpha-2 code (case-insensitive).
 */
export function getCountryByCode(code: string): Country | undefined {
  if (!code || typeof code !== 'string') return undefined;
  return CODE_INDEX.get(code.trim().toUpperCase());
}

/**
 * Returns all countries belonging to a given continent.
 */
export function getCountriesByContinent(continent: Continent): readonly Country[] {
  return REGISTRY.filter((c) => c.continent === continent);
}

/**
 * Returns summary statistics for all 7 continents.
 */
export function getContinentSummaries(): readonly ContinentSummary[] {
  return ALL_CONTINENTS.map((continent) => {
    const list = getCountriesByContinent(continent);
    let description = '';

    if (continent === 'Antarctica') {
      description = '0 sovereign states (Antarctic Treaty System territory; excluded from national flag learning).';
    } else {
      description = `${list.length} sovereign states included in learning path.`;
    }

    return {
      name: continent,
      countryCount: list.length,
      description,
    };
  });
}

/**
 * Total number of sovereign countries in the registry.
 */
export function getCountryCount(): number {
  return REGISTRY.length;
}
