'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { ALL_CONTINENTS } from '../../types/country';
import { getCountriesByContinent, getCountryCount } from '../../lib/countries';
import { getBatch, getContinentBatchCount } from '../../lib/batches';
import {
  loadProgress,
  getProgressStats,
  getNextLessonRecommendation,
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

  const totalBatchesAllContinents = ALL_CONTINENTS.reduce(
    (sum, c) => sum + getContinentBatchCount(c),
    0
  );

  // Derive the next lesson dynamically from actual persisted progress
  const nextLesson = progress
    ? getNextLessonRecommendation(progress, (continent, batchIndex) => {
        const batch = getBatch(continent, batchIndex);
        if (!batch) return undefined;
        return {
          countryCount: batch.countries.length,
          totalBatches: batch.totalBatches,
        };
      })
    : {
        continent: 'Africa' as const,
        batchIndex: 0,
        batchNumber: 1,
        countryCount: 10,
        totalBatchesInContinent: 6,
        actionType: 'start' as const,
        badgeLabel: 'First Lesson',
        buttonLabel: 'Start First Lesson →',
        description: 'Begin your study journey with the first 10 sovereign country flags in Africa.',
      };

  const introducedPercent = Math.min(
    100,
    Math.round((stats.introducedCount / (stats.totalCountries || 195)) * 100)
  );

  const completedBatchesPercent = Math.min(
    100,
    Math.round((stats.completedBatchCount / (totalBatchesAllContinents || 23)) * 100)
  );

  return (
    <div className="container">
      <main className={styles.dashboardLayout}>
        {/* Workspace Header */}
        <header className={styles.dashboardHeader}>
          <h1 className={styles.pageTitle}>Learning Dashboard</h1>
          <p className={styles.pageSubtitle}>
            Structured spaced-repetition curriculum across 195 sovereign nations
          </p>
        </header>

        {/* 1. PRIMARY: Next Lesson / Resume Action */}
        <section
          className={styles.nextLessonCard}
          aria-label="Recommended Next Learning Action"
        >
          <div className={styles.nextLessonInfo}>
            <span className={styles.nextLessonBadge}>{nextLesson.badgeLabel}</span>
            <h2 className={styles.nextLessonTitle}>
              {nextLesson.continent} · Batch {nextLesson.batchNumber}
            </h2>
            <p className={styles.nextLessonDesc}>
              {nextLesson.description}
            </p>
          </div>

          <Link
            href={`/learn/study/${encodeURIComponent(nextLesson.continent)}/${nextLesson.batchIndex}`}
            className={styles.nextLessonAction}
            id="start-next-lesson-btn"
          >
            <span>{nextLesson.buttonLabel}</span>
          </Link>
        </section>

        {/* 2. SECONDARY: Compact Learning Analytics Section */}
        <section
          className={styles.analyticsSection}
          aria-labelledby="analytics-heading"
        >
          <div className={styles.analyticsHeader}>
            <h2 id="analytics-heading" className={styles.sectionHeading}>
              Learning Analytics
            </h2>
            <span className={styles.sectionSubtext}>
              {stats.practiceAttemptsCount} verified active recall practice records
            </span>
          </div>

          <div className={styles.analyticsGrid}>
            {/* Flags Introduced */}
            <div className={styles.analyticsCard}>
              <span className={styles.analyticsValue}>
                {stats.introducedCount}
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                  {' '}/ {stats.totalCountries}
                </span>
              </span>
              <span className={styles.analyticsLabel}>Flags Introduced</span>
              <div
                className={styles.analyticsMeter}
                role="progressbar"
                aria-valuenow={stats.introducedCount}
                aria-valuemin={0}
                aria-valuemax={stats.totalCountries}
                aria-label="Flags introduced progress"
              >
                <div
                  className={styles.analyticsMeterFill}
                  style={{ width: `${introducedPercent}%` }}
                />
              </div>
              <span className={styles.analyticsHint}>
                {stats.totalCountries - stats.introducedCount} countries remaining
              </span>
            </div>

            {/* Completed Batches */}
            <div className={styles.analyticsCard}>
              <span className={styles.analyticsValue}>
                {stats.completedBatchCount}
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                  {' '}/ {totalBatchesAllContinents}
                </span>
              </span>
              <span className={styles.analyticsLabel}>Batches Completed</span>
              <div
                className={styles.analyticsMeter}
                role="progressbar"
                aria-valuenow={stats.completedBatchCount}
                aria-valuemin={0}
                aria-valuemax={totalBatchesAllContinents}
                aria-label="Batches completed progress"
              >
                <div
                  className={styles.analyticsMeterFill}
                  style={{ width: `${completedBatchesPercent}%` }}
                />
              </div>
              <span className={styles.analyticsHint}>
                10 sovereign flags per curriculum batch
              </span>
            </div>

            {/* Independent Recall Accuracy */}
            <div className={styles.analyticsCard}>
              <span className={styles.analyticsValue}>
                {stats.practiceAttemptsCount > 0 ? (
                  `${stats.practiceAccuracy}%`
                ) : (
                  <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>—</span>
                )}
              </span>
              <span className={styles.analyticsLabel}>Independent Recall Accuracy</span>
              <div
                className={styles.analyticsMeter}
                role="progressbar"
                aria-valuenow={stats.practiceAccuracy}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Practice recall accuracy"
              >
                <div
                  className={styles.analyticsMeterFill}
                  style={{ width: `${stats.practiceAttemptsCount > 0 ? stats.practiceAccuracy : 0}%` }}
                />
              </div>
              <span className={styles.analyticsHint}>
                {stats.practiceAttemptsCount > 0
                  ? 'Multiple choice & typed answer tests'
                  : 'Complete a practice batch to track recall rate'}
              </span>
            </div>
          </div>
        </section>

        {/* 3. TERTIARY: Continent Curriculum */}
        <section
          className={styles.curriculumSection}
          aria-labelledby="curriculum-heading"
        >
          <div className={styles.analyticsHeader}>
            <h2 id="curriculum-heading" className={styles.sectionHeading}>
              Continents Curriculum
            </h2>
            <span className={styles.sectionSubtext}>
              7 Continents · Deterministic sequential study order
            </span>
          </div>

          <div className={styles.curriculumList}>
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
                    className={`${styles.curriculumRow} ${styles.curriculumRowDisabled}`}
                  >
                    <div>
                      <div className={styles.curriculumName}>{continent}</div>
                      <div className={styles.curriculumMeta}>
                        0 sovereign countries · Excluded under international treaty
                      </div>
                    </div>
                    <div className={styles.curriculumRight}>
                      <span className={styles.curriculumProgress}>No lessons required</span>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={continent}
                  href={`/learn/continents/${encodeURIComponent(continent)}`}
                  className={styles.curriculumRow}
                >
                  <div>
                    <div className={styles.curriculumName}>{continent}</div>
                    <div className={styles.curriculumMeta}>
                      {countries.length} sovereign states · {batchCount}{' '}
                      {batchCount === 1 ? 'batch' : 'batches'}
                    </div>
                  </div>

                  <div className={styles.curriculumRight}>
                    <span className={styles.curriculumProgress}>
                      {completedBatchesForContinent > 0
                        ? `${completedBatchesForContinent} of ${batchCount} batches completed`
                        : introducedInContinent > 0
                        ? `${introducedInContinent} flags introduced`
                        : 'Not started'}
                    </span>
                    <span className={styles.curriculumAction} aria-hidden="true">
                      Open →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 4. QUATERNARY: Secondary Study Tools */}
        <section
          className={styles.secondaryToolsSection}
          aria-label="Secondary Learning Utilities"
        >
          <div className={styles.secondaryToolCard}>
            <div>
              <h4>Spaced Repetition &amp; Maintenance Review</h4>
              <p>
                Multi-day retention intervals will be scheduled here as learning progresses.
                Batches remain open for self-directed practice at any time.
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              Phase 3 Review Scheduler
            </span>
          </div>

          <div className={styles.secondaryToolCard}>
            <div>
              <h4>Flag Explorer</h4>
              <p>
                Browse, search, and inspect the official flags and sovereign records for all 195 nations.
              </p>
            </div>
            <Link href="/learn/explorer" className={styles.secondaryToolLink} id="explore-link">
              Explore All 195 Flags →
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
