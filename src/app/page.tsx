import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { getAllCountries } from '../lib/countries';
import { MovingFlagWall } from '../components/MovingFlagWall';

export default function LandingPage() {
  const allCountries = getAllCountries();

  return (
    <main className={styles.heroWrapper}>
      {/* Immersive asynchronous moving columns of real country flags */}
      <MovingFlagWall countries={allCountries} />

      {/* Foreground Hero Content */}
      <div className={styles.heroForeground}>
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

        <p className={styles.footerNote}>
          195 Sovereign Countries · Seven Continents · Spaced Practice
        </p>
      </div>
    </main>
  );
}
