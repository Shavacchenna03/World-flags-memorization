import React from 'react';
import styles from './ContinentCard.module.css';
import { ContinentSummary, Country } from '../types/country';
import { FlagImage } from './FlagImage';

interface ContinentCardProps {
  summary: ContinentSummary;
  sampleCountries: readonly Country[];
  onSelect?: () => void;
}

export function ContinentCard({
  summary,
  sampleCountries,
  onSelect,
}: ContinentCardProps) {
  const isAntarctica = summary.name === 'Antarctica';

  return (
    <article
      className={`${styles.card} ${isAntarctica ? styles.cardAntarctica : ''}`}
      onClick={onSelect}
    >
      <div>
        <div className={styles.cardHeader}>
          <h3 className={styles.continentName}>{summary.name}</h3>
          <span
            className={`${styles.countBadge} ${
              isAntarctica ? styles.countBadgeZero : ''
            }`}
          >
            {summary.countryCount} {summary.countryCount === 1 ? 'country' : 'countries'}
          </span>
        </div>

        <p className={styles.description}>{summary.description}</p>
      </div>

      <div>
        {!isAntarctica && sampleCountries.length > 0 ? (
          <div>
            <div className={styles.previewLabel}>Sample Flags</div>
            <div className={styles.flagsPreview}>
              {sampleCountries.slice(0, 5).map((country) => (
                <div key={country.code} title={`${country.name} (${country.code})`}>
                  <FlagImage country={country} size="sm" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.phaseNote}>
            <span>❄️</span>
            <span>Zero sovereign national flags</span>
          </div>
        )}
      </div>
    </article>
  );
}
