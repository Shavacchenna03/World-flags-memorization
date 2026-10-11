'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import { Continent, ALL_CONTINENTS } from '../../../../../types/country';
import { getBatch } from '../../../../../lib/batches';
import {
  markCountriesIntroduced,
  markBatchCompleted,
} from '../../../../../lib/progress';
import { FlagImage } from '../../../../../components/FlagImage';

interface StudyPageProps {
  params: Promise<{
    continent: string;
    batchIndex: string;
  }>;
}

export default function BatchStudyPage({ params }: StudyPageProps) {
  const resolvedParams = use(params);
  const rawContinent = decodeURIComponent(resolvedParams.continent) as Continent;
  const batchIdx = parseInt(resolvedParams.batchIndex, 10);

  if (!ALL_CONTINENTS.includes(rawContinent) || isNaN(batchIdx)) {
    notFound();
  }

  const batch = getBatch(rawContinent, batchIdx);
  if (!batch) {
    notFound();
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const countries = batch.countries;
  const currentCountry = countries[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / countries.length) * 100);

  const handleNext = useCallback(() => {
    if (currentIndex < countries.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Completed introduction
      const codes = countries.map((c) => c.code);
      markCountriesIntroduced(codes);
      markBatchCompleted(rawContinent, batchIdx);
      setIsCompleted(true);
    }
  }, [currentIndex, countries, rawContinent, batchIdx]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isCompleted) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNext, handlePrev, isCompleted]);

  if (isCompleted) {
    return (
      <div className={styles.studyContainer}>
        <div className={styles.completeCard}>
          <div className={styles.completeGlyph} aria-hidden="true">✓</div>
          <h1 className={styles.completeTitle}>Batch Introduction Complete</h1>
          <p className={styles.completeDesc}>
            You have studied all <strong>{countries.length}</strong> flags in {rawContinent} · Batch {batch.batchNumber}.
            These flags are now marked as introduced in your study records. Ready to test your recall?
          </p>

          <div className={styles.completeActions}>
            <Link
              href={`/learn/practice/${encodeURIComponent(rawContinent)}/${batchIdx}`}
              className={styles.nextBtn}
              style={{ padding: '0.8rem 1.8rem' }}
            >
              <span>Start Practice Session</span>
              <span aria-hidden="true">→</span>
            </Link>

            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsCompleted(false);
              }}
              className={styles.prevBtn}
              style={{ padding: '0.8rem 1.4rem' }}
            >
              Review Batch Again
            </button>

            <Link
              href={`/learn/continents/${encodeURIComponent(rawContinent)}`}
              className={styles.prevBtn}
              style={{ padding: '0.8rem 1.4rem' }}
            >
              Back to {rawContinent}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.studyContainer}>
      <div className={styles.topBar}>
        <div className={styles.breadcrumb}>
          <Link href={`/learn/continents/${encodeURIComponent(rawContinent)}`}>
            ← {rawContinent} / Batch {batch.batchNumber}
          </Link>
        </div>

        <div className={styles.stepIndicator}>
          Flag {currentIndex + 1} of {countries.length}
        </div>
      </div>

      <div className={styles.progressBarTrack} role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
        <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
      </div>

      <main className={styles.studyCard}>
        <div className={styles.flagWrapper}>
          <FlagImage country={currentCountry} size="xl" />
        </div>

        <h2 className={styles.countryName}>{currentCountry.name}</h2>
        <p className={styles.officialName}>{currentCountry.officialName}</p>

        {currentCountry.capital && (
          <div className={styles.capitalBadge}>
            <span>🏛️</span>
            <span>Capital: {currentCountry.capital}</span>
          </div>
        )}

        <div className={styles.controlsRow}>
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`${styles.navBtn} ${styles.prevBtn}`}
            aria-label="Previous Flag"
          >
            ← Previous
          </button>

          <button
            onClick={handleNext}
            className={`${styles.navBtn} ${styles.nextBtn}`}
            aria-label={currentIndex === countries.length - 1 ? 'Complete Introduction' : 'Next Flag'}
          >
            <span>{currentIndex === countries.length - 1 ? 'Complete Introduction' : 'Next Flag'}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <p className={styles.keyboardHint}>
          Tip: Use <kbd>←</kbd> and <kbd>→</kbd> arrow keys to navigate
        </p>
      </main>
    </div>
  );
}
