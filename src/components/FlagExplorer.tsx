'use client';

import React, { useState, useMemo } from 'react';
import styles from './FlagExplorer.module.css';
import { Country, Continent } from '../types/country';
import { FlagImage } from './FlagImage';

interface FlagExplorerProps {
  countries: readonly Country[];
}

const FILTER_CONTINENTS: Array<Continent | 'All'> = [
  'All',
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
];

export function FlagExplorer({ countries }: FlagExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<Continent | 'All'>('All');

  const filteredCountries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return countries.filter((country) => {
      // Continent filter
      if (selectedContinent !== 'All' && country.continent !== selectedContinent) {
        return false;
      }
      // Search term filter
      if (!term) return true;
      return (
        country.name.toLowerCase().includes(term) ||
        country.officialName.toLowerCase().includes(term) ||
        country.code.toLowerCase().includes(term) ||
        country.isoAlpha3.toLowerCase().includes(term) ||
        (country.capital && country.capital.toLowerCase().includes(term))
      );
    });
  }, [countries, searchTerm, selectedContinent]);

  return (
    <section id="explorer" className={styles.explorerContainer}>
      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <span className={styles.searchIcon} aria-hidden="true">🔍</span>
          <input
            type="search"
            aria-label="Search countries by name, code, or capital"
            placeholder="Search 195 countries by name, capital, or code (e.g. Switzerland, NP, Tokyo)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterTabs} role="tablist" aria-label="Filter by continent">
          {FILTER_CONTINENTS.map((continent) => (
            <button
              key={continent}
              role="tab"
              aria-selected={selectedContinent === continent}
              onClick={() => setSelectedContinent(continent)}
              className={`${styles.filterTab} ${
                selectedContinent === continent ? styles.filterTabActive : ''
              }`}
            >
              {continent}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.statusRow}>
        <span>
          Showing <strong>{filteredCountries.length}</strong> of {countries.length} sovereign countries
        </span>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: '0.8125rem' }}
          >
            Clear search
          </button>
        )}
      </div>

      {filteredCountries.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No sovereign countries found matching "{searchTerm}".</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredCountries.map((country) => (
            <div key={country.code} className={styles.countryCard}>
              <FlagImage country={country} size="md" />
              <div className={styles.countryInfo}>
                <h4 className={styles.countryName} title={country.officialName}>
                  {country.name}
                </h4>
                <p className={styles.countryDetails}>
                  {country.capital ? `Capital: ${country.capital}` : 'No official capital'}
                </p>
                <div className={styles.badgeRow}>
                  <span className={styles.codeBadge}>{country.code}</span>
                  <span className={styles.continentPill}>{country.continent}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
