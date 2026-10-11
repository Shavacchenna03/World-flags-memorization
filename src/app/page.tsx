import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { getCountryByCode } from '../lib/countries';
import { FlagImage } from '../components/FlagImage';

export default function LandingPage() {
  // A subtle, balanced selection of 6 representative sovereign flags
  const sampleCodes = ['NP', 'JP', 'ZA', 'GR', 'BR', 'SE'];
  const sampleCountries = sampleCodes
    .map((code) => getCountryByCode(code))
    .filter((c) => c !== undefined);

  return (
    <main className={styles.landingContainer}>
      <div className={styles.heroContent}>
        <div className={styles.identityTag}>
          <span className={styles.identityTagDot} aria-hidden="true" />
          <span>Personal Flag Atlas</span>
        </div>

        <h1 className={styles.headline}>
          Know every flag.<br />
          Remember every country.
        </h1>

        <p className={styles.subheadline}>
          A local-first study space designed to master the national flags of all
          195 sovereign countries through sequential batches and active recall.
        </p>

        <div className={styles.ctaWrapper}>
          <Link href="/learn" className={styles.startBtn}>
            <span>Start Learning</span>
            <span className={styles.arrowGlyph} aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Subtle, quiet flag vignette framed by hairline rules */}
        <div className={styles.flagVignette} aria-hidden="true">
          {sampleCountries.map((country) => (
            <FlagImage key={country.code} country={country} size="sm" />
          ))}
        </div>

        <p className={styles.footerNote}>
          195 Sovereign Countries · Seven Continents · Spaced Practice
        </p>
      </div>
    </main>
  );
}
