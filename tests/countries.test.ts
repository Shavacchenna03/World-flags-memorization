import { describe, it, expect } from 'vitest';
import {
  getAllCountries,
  getCountryByCode,
  getCountriesByContinent,
  getContinentSummaries,
  getCountryCount,
  resolvePrimaryContinent,
  EXPECTED_COUNTRY_COUNT,
} from '../src/lib/countries';
import { RawCountry } from '../src/types/country';

describe('Country Data Registry', () => {
  it('loads exactly 195 sovereign countries without duplicates', () => {
    const countries = getAllCountries();
    expect(countries.length).toBe(EXPECTED_COUNTRY_COUNT);
    expect(getCountryCount()).toBe(EXPECTED_COUNTRY_COUNT);

    const codes = new Set(countries.map((c) => c.code));
    expect(codes.size).toBe(EXPECTED_COUNTRY_COUNT);
  });

  it('includes UN observer states Holy See (VA) and Palestine (PS)', () => {
    const va = getCountryByCode('VA');
    expect(va).toBeDefined();
    expect(va?.name).toBe('Vatican City');
    expect(va?.continent).toBe('Europe');

    const ps = getCountryByCode('PS');
    expect(ps).toBeDefined();
    expect(ps?.name).toBe('Palestine');
    expect(ps?.continent).toBe('Asia');
  });

  it('supports case-insensitive code lookup', () => {
    const jp = getCountryByCode('jp');
    expect(jp).toBeDefined();
    expect(jp?.name).toBe('Japan');

    const fr = getCountryByCode('FR');
    expect(fr).toBeDefined();
    expect(fr?.name).toBe('France');

    expect(getCountryByCode('XX')).toBeUndefined();
    expect(getCountryByCode('')).toBeUndefined();
  });

  it('assigns all 195 countries across 6 inhabited continents and 0 to Antarctica', () => {
    const summaries = getContinentSummaries();
    expect(summaries.length).toBe(7);

    const antarctica = summaries.find((s) => s.name === 'Antarctica');
    expect(antarctica).toBeDefined();
    expect(antarctica?.countryCount).toBe(0);

    const totalFromContinents = summaries.reduce(
      (sum, s) => sum + s.countryCount,
      0
    );
    expect(totalFromContinents).toBe(EXPECTED_COUNTRY_COUNT);

    // Continent breakdown matches geography rules
    expect(getCountriesByContinent('Africa').length).toBe(54);
    expect(getCountriesByContinent('Europe').length).toBe(45);
    expect(getCountriesByContinent('Asia').length).toBe(47);
    expect(getCountriesByContinent('North America').length).toBe(23);
    expect(getCountriesByContinent('South America').length).toBe(12);
    expect(getCountriesByContinent('Oceania').length).toBe(14);
  });

  it('correctly maps transcontinental countries to primary continents', () => {
    const russia = getCountryByCode('RU');
    expect(russia?.continent).toBe('Europe');

    const turkey = getCountryByCode('TR');
    expect(turkey?.continent).toBe('Asia');

    const egypt = getCountryByCode('EG');
    expect(egypt?.continent).toBe('Africa');
  });

  it('preserves valid local SVG flag asset paths for every country', () => {
    const countries = getAllCountries();
    for (const country of countries) {
      expect(country.flagAssetPath).toBe(`/flags/${country.code.toLowerCase()}.svg`);
    }
  });

  it('throws an error when resolving an unmapped or invalid continent', () => {
    const malformed = {
      id: 'ZZ',
      code: 'ZZ',
      isoAlpha3: 'ZZZ',
      name: 'Nowhere',
      officialName: 'Republic of Nowhere',
      continent: null,
      region: 'Atlantis',
      subregion: 'Deep Ocean',
      capital: 'City',
      flagAssetPath: '/flags/zz.svg',
    } as unknown as RawCountry;

    expect(() => resolvePrimaryContinent(malformed)).toThrow(
      /Unable to resolve primary continent/
    );
  });
});
