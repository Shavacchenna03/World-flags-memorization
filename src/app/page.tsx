import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { getCountryByCode } from '../lib/countries';
import { FlagImage } from '../components/FlagImage';

export default function LandingPage() {
  // A subtle, balanced sample mosaic across continents
  const mosaicCodes = ['NP', 'JP', 'BR', 'ZA', 'GR', 'CA', 'NZ', 'SE'];
  const mosaicCountries = mosaicCodes
    .map((code) => getCountryByCode(code))
    .filter((c) => c !== undefined);

  return (
    <main className={styles.landingContainer}>
      <div className={styles.heroContent}>
        <div className={styles.wordmark}>
          <span className={styles.wordmarkDot} aria-hidden="true" />
          <span>World Flags</span>
        </div>

        <h1 className={styles.headline}>
          Know every flag.<br />
          Remember every country.
        </h1>

        <p className={styles.subheadline}>
          A personal, local-first active recall study tool designed to help you
          learn and permanently memorize the flags of all 195 sovereign countries.
        </p>

        <div className={styles.ctaGroup}>
          <Link href="/learn" className={styles.startBtn}>
            <span>Start Learning</span>
            <span className={styles.arrowIcon} aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Subtle, restrained flag mosaic ribbon */}
        <div className={styles.flagMosaic} aria-hidden="true">
          {mosaicCountries.map((country) => (
            <FlagImage key={country.code} country={country} size="sm" />
          ))}
        </div>

        <p className={styles.footerNote}>
          195 Sovereign Countries · Batches of 10 · Spaced Repetition · Local &amp; Private
        </p>
      </div>
    </main>
  );
}
