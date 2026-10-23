'use client';

import React, { use, useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import { Continent, ALL_CONTINENTS, Country } from '../../../../../types/country';
import { getBatch, getBatchByNumber, getContinentBatchCount } from '../../../../../lib/batches';
import { getCountryByCode } from '../../../../../lib/countries';
import {
  initStudySession,
  saveStudySession,
  StudySessionState,
} from '../../../../../lib/session';
import { loadPreferences, LearningPreferences } from '../../../../../lib/preferences';
import { learningRepository } from '../../../../../lib/progress/repository';
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
  const routeBatchNum = parseInt(resolvedParams.batchIndex, 10);

  if (!ALL_CONTINENTS.includes(rawContinent) || isNaN(routeBatchNum)) {
    notFound();
  }

  // Pre-check if route number exceeds the maximum possible lessons for this continent under any lesson size (size 5)
  if (routeBatchNum < 1 || routeBatchNum > getContinentBatchCount(rawContinent, 5)) {
    notFound();
  }

  const [preferences, setPreferences] = useState<LearningPreferences>(() => loadPreferences());
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    learningRepository.getLearningPreferences().then((prefs) => {
      setPreferences(prefs);
    });
  }, []);

  // Authoritative lesson lookup using user's active lesson size
  const batch =
    routeBatchNum >= 1
      ? getBatchByNumber(rawContinent, routeBatchNum, preferences.lessonSize)
      : getBatch(rawContinent, 0, preferences.lessonSize);

  // If component is mounted on client and batch is invalid for current lesson size, trigger 404
  if (mounted && !batch) {
    notFound();
  }

  // Active study session state:
  // Randomizes flag presentation order per session while maintaining deterministic curriculum membership.
  // Preserves shuffled order across page reloads (F5) so user doesn't lose position.
  const [session, setSession] = useState<StudySessionState | null>(() => {
    if (!batch) return null;
    return initStudySession(rawContinent, batch.batchNumber, batch.countries);
  });

  // Re-initialize session if batch becomes available or changes
  useEffect(() => {
    if (batch && (!session || session.batchNumber !== batch.batchNumber || session.lessonSize !== batch.countries.length)) {
      setSession(initStudySession(rawContinent, batch.batchNumber, batch.countries));
    }
  }, [batch, rawContinent]);

  const currentIndex = session?.currentIndex ?? 0;
  const isCompleted = session?.completed ?? false;

  // Resolve country objects in the active session's randomized order
  const sessionCountries: Country[] = useMemo(() => {
    if (!session) return [];
    return session.shuffledCountryCodes
      .map((code) => getCountryByCode(code))
      .filter((c): c is Country => Boolean(c));
  }, [session]);

  const currentCountry: Country | undefined = sessionCountries[currentIndex];
  const progressPercent = Math.round(
    ((currentIndex + 1) / (sessionCountries.length || 10)) * 100
  );

  // Mark country as introduced using country-identity (ISO code), not position
  useEffect(() => {
    if (currentCountry && !isCompleted) {
      learningRepository.saveCountriesIntroduced([currentCountry.code]);
    }
  }, [currentCountry, isCompleted]);

  const handleNext = useCallback(() => {
    if (!batch || !session) return;
    if (currentIndex < sessionCountries.length - 1) {
      const nextIndex = currentIndex + 1;
      const updatedSession: StudySessionState = {
        ...session,
        currentIndex: nextIndex,
      };
      setSession(updatedSession);
      saveStudySession(updatedSession);
    } else {
      // Completed full lesson introduction
      const canonicalCodes = batch.countries.map((c) => c.code);
      learningRepository.saveCountriesIntroduced(canonicalCodes);
      learningRepository.saveBatchCompleted(rawContinent, batch.batchIndex);

      const completedSession: StudySessionState = {
        ...session,
        currentIndex,
        completed: true,
      };
      setSession(completedSession);
      saveStudySession(completedSession);
    }
  }, [currentIndex, sessionCountries.length, session, batch, rawContinent]);

  const handlePrev = useCallback(() => {
    if (!session) return;
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const updatedSession: StudySessionState = {
        ...session,
        currentIndex: prevIndex,
      };
      setSession(updatedSession);
      saveStudySession(updatedSession);
    }
  }, [currentIndex, session]);

  // Restart lesson with a fresh randomized presentation order
  const handleReviewAgain = useCallback(() => {
    if (!batch) return;
    const newSession = initStudySession(
      rawContinent,
      batch.batchNumber,
      batch.countries,
      true // forceNew = true creates a fresh shuffle
    );
    setSession(newSession);
  }, [rawContinent, batch]);

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

  if (!batch || !session || !currentCountry) {
    return (
      <div className={styles.studyContainer}>
        <div style={{ padding: '3rem 0', color: 'var(--text-secondary)' }}>
          Loading lesson...
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className={styles.studyContainer}>
        <div className={styles.completeCard}>
          <div className={styles.completeGlyph} aria-hidden="true">✓</div>
          <h1 className={styles.completeTitle}>Lesson Introduction Complete</h1>
          <p className={styles.completeDesc}>
            You have studied all <strong>{batch.countries.length}</strong> flags in {rawContinent} · Lesson {batch.batchNumber}.
            These flags are now marked as introduced in your study records. Ready to test your recall?
          </p>

          <div className={styles.completeActions}>
            <Link
              href={`/learn/practice/${encodeURIComponent(rawContinent)}/${batch.batchNumber}`}
              className={styles.nextBtn}
              style={{ padding: '0.8rem 1.8rem' }}
            >
              <span>Start Practice Session</span>
              <span aria-hidden="true">→</span>
            </Link>

            <button
              onClick={handleReviewAgain}
              className={styles.prevBtn}
              style={{ padding: '0.8rem 1.4rem' }}
            >
              Review Lesson Again
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
            ← {rawContinent} / Lesson {batch.batchNumber}
          </Link>
        </div>

        <div className={styles.stepIndicator}>
          Flag {currentIndex + 1} of {sessionCountries.length}
        </div>
      </div>

      <div
        className={styles.progressBarTrack}
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
      </div>

      <main
        className={styles.studyCard}
        data-country-id={currentCountry.code}
        data-session-index={currentIndex}
      >
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
            aria-label={
              currentIndex === sessionCountries.length - 1
                ? 'Complete Introduction'
                : 'Next Flag'
            }
          >
            <span>
              {currentIndex === sessionCountries.length - 1
                ? 'Complete Introduction'
                : 'Next Flag'}
            </span>
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
