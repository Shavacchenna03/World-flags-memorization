'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { ALL_CONTINENTS, Continent } from '../../types/country';
import { getCountriesByContinent, getCountryCount } from '../../lib/countries';
import { getContinentBatchCount } from '../../lib/batches';
import {
  loadProgress,
  getProgressStats,
  UserProgress,
} from '../../lib/progress';

export default function LearnDashboardPage() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const totalCountryCount = getCountryCount();

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const stats = progress
    ? getProgressStats(totalCountryCount)
    : {
        introducedCount: 0,
        totalCountries: totalCountryCount,
        completedBatchCount: 0,
        practiceAttemptsCount: 0,
        practiceAccuracy: 0,
      };

  const lastSession = progress?.lastSession;
  const continueContinent: Continent = lastSession?.continent || 'Africa';
  const continueBatchIndex = lastSession ? lastSession.batchIndex : 0;
  const isBrandNew = !lastSession && stats.introducedCount === 0;

  return (
    <div className="container">
      <div className={styles.workspaceContainer}>
        {/* Workspace Header */}
        <header className={styles.workspaceHeader}>
          <h1 className={styles.title}>Study Workspace</h1>

          {/* Understated Inline Progress Strip */}
          <div className={styles.progressStrip}>
            <span className={styles.progressItem}>
              <strong className={styles.progressValue}>{stats.introducedCount}</strong> of{' '}
              {stats.totalCountries} Flags Introduced
            </span>
            <span className={styles.progressDivider} aria-hidden="true">·</span>
            <span className={styles.progressItem}>
              <strong className={styles.progressValue}>{stats.completedBatchCount}</strong> Batches Completed
            </span>
            <span className={styles.progressDivider} aria-hidden="true">·</span>
            <span className={styles.progressItem}>
              {stats.practiceAttemptsCount > 0 ? (
                <>
                  <strong className={styles.progressValue}>{stats.practiceAccuracy}%</strong> Recall Accuracy
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>No Practice Records Yet</span>
              )}
            </span>
          </div>
        </header>

        {/* Focused Resume Action */}
        <section className={styles.resumeSection} aria-label="Current Learning Session">
          <div className={styles.resumeInfo}>
            <span className={styles.resumeLabel}>
              {isBrandNew ? 'First Lesson' : 'Current Lesson'}
            </span>
            <h2 className={styles.resumeHeading}>
              {continueContinent} · Batch {continueBatchIndex + 1}
            </h2>
            <p className={styles.resumeDescription}>
              {isBrandNew
                ? 'Begin your study with the first 10 sovereign country flags in Africa.'
                : `Resume studying the 10 flags in ${continueContinent} Batch ${continueBatchIndex + 1}.`}
            </p>
          </div>

          <Link
            href={`/learn/study/${encodeURIComponent(continueContinent)}/${continueBatchIndex}`}
            className={styles.resumeBtn}
          >
            <span>{isBrandNew ? 'Begin Batch 1' : 'Resume Batch'}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </section>

        {/* Continents Progression: Structured Scannable Rows */}
        <section className={styles.section} aria-labelledby="continents-heading">
          <div className={styles.sectionHeader}>
            <h2 id="continents-heading" className={styles.sectionTitle}>
              Continents Curriculum
            </h2>
            <span className={styles.sectionNote}>Batches of 10</span>
          </div>

          <div className={styles.continentList}>
            {ALL_CONTINENTS.map((continent) => {
              const countries = getCountriesByContinent(continent);
              const batchCount = getContinentBatchCount(continent);
              const isAntarctica = continent === 'Antarctica';

              const introducedInContinent = countries.filter((c) =>
                progress?.introducedCountryCodes.includes(c.code)
              ).length;

              const completedBatchesForContinent =
                progress?.completedBatches[continent]?.length || 0;

              if (isAntarctica) {
                return (
                  <div
                    key={continent}
                    className={`${styles.continentRow} ${styles.continentRowDisabled}`}
                  >
                    <div className={styles.continentLeft}>
                      <span className={styles.continentName}>{continent}</span>
                      <span className={styles.continentMeta}>
                        0 sovereign countries · Excluded under international treaty
                      </span>
                    </div>
                    <div className={styles.continentRight}>
                      <span className={styles.continentProgress}>No Lessons</span>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={continent}
                  href={`/learn/continents/${encodeURIComponent(continent)}`}
                  className={styles.continentRow}
                >
                  <div className={styles.continentLeft}>
                    <span className={styles.continentName}>{continent}</span>
                    <span className={styles.continentMeta}>
                      {countries.length} sovereign states · {batchCount} {batchCount === 1 ? 'batch' : 'batches'}
                    </span>
                  </div>

                  <div className={styles.continentRight}>
                    <span className={styles.continentProgress}>
                      {completedBatchesForContinent > 0
                        ? `${completedBatchesForContinent} of ${batchCount} batches completed`
                        : introducedInContinent > 0
                        ? `${introducedInContinent} flags introduced`
                        : 'Not started'}
                    </span>
                    <span className={styles.actionIndicator} aria-hidden="true">
                      Open →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Retention Status Note */}
        <section className={styles.section} aria-label="Review Queue">
          <div className={styles.reviewNotice}>
            <span className={styles.reviewNoticeGlyph} aria-hidden="true">✦</span>
            <div className={styles.reviewNoticeText}>
              <h4>Spaced Repetition &amp; Maintenance Reviews</h4>
              <p>
                As countries are studied and practiced, multi-day retention intervals will be scheduled here in Phase 3.
                Continents and batches remain open for self-directed practice at any time.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
