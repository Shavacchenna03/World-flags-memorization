import { describe, it, expect } from 'vitest';
import { getAllCountries, getCountryByCode } from '../src/lib/countries';

describe('Flag Asset & Aspect Ratio Verification', () => {
  it('all 195 countries have local SVG asset paths starting with /flags/', () => {
    const countries = getAllCountries();
    expect(countries.length).toBe(195);

    for (const country of countries) {
      expect(country.flagAssetPath).toMatch(/^\/flags\/[a-z]{2}\.svg$/);
      // Ensures no remote URLs are ever used
      expect(country.flagAssetPath.startsWith('http')).toBe(false);
    }
  });

  it('correctly maps unique aspect ratio flags in dataset', () => {
    // Nepal: Non-rectangular double pennant
    const nepal = getCountryByCode('NP');
    expect(nepal).toBeDefined();
    expect(nepal?.flagAssetPath).toBe('/flags/np.svg');

    // Switzerland: Square 1:1
    const switzerland = getCountryByCode('CH');
    expect(switzerland).toBeDefined();
    expect(switzerland?.flagAssetPath).toBe('/flags/ch.svg');

    // Vatican City: Square 1:1
    const vatican = getCountryByCode('VA');
    expect(vatican).toBeDefined();
    expect(vatican?.flagAssetPath).toBe('/flags/va.svg');

    // Qatar: 11:28 long
    const qatar = getCountryByCode('QA');
    expect(qatar).toBeDefined();
    expect(qatar?.flagAssetPath).toBe('/flags/qa.svg');
  });
});
