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
    // Read live local progress on mount
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

  // Determine next continue action
  const lastSession = progress?.lastSession;
  const continueContinent: Continent = lastSession?.continent || 'Africa';
  const continueBatchIndex = lastSession ? lastSession.batchIndex : 0;
  const isBrandNew = !lastSession && stats.introducedCount === 0;

  return (
    <div className="container">
      <div className={styles.dashboardContainer}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Study Workspace</h1>
          <p className={styles.subtitle}>
            Sequential continent batches, active recall practice, and spaced retention.
          </p>
        </div>

        {/* Continue Learning Action Card */}
        <div className={styles.continueCard}>
          <div className={styles.continueInfo}>
            <span className={styles.continueBadge}>
              {isBrandNew ? 'First Step' : 'Resume Learning'}
            </span>
            <h2 className={styles.continueTitle}>
              {continueContinent} · Batch {continueBatchIndex + 1}
            </h2>
            <p className={styles.continueDesc}>
              {isBrandNew
                ? 'Begin your study journey with the first 10 sovereign country flags in Africa.'
                : `Pick up where you left off in ${continueContinent}.`}
            </p>
          </div>

          <Link
            href={`/learn/study/${encodeURIComponent(continueContinent)}/${continueBatchIndex}`}
            className={styles.continueBtn}
          >
            <span>{isBrandNew ? 'Begin Batch 1' : 'Continue Batch'}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Real Progress Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {stats.introducedCount} / {stats.totalCountries}
            </div>
            <div className={styles.statLabel}>Flags Introduced</div>
            <div className={styles.statSubtext}>
              {Math.round((stats.introducedCount / stats.totalCountries) * 100)}% of world covered
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.completedBatchCount}</div>
            <div className={styles.statLabel}>Batches Completed</div>
            <div className={styles.statSubtext}>Across all continents</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statValue}>
              {stats.practiceAttemptsCount > 0 ? `${stats.practiceAccuracy}%` : '—'}
            </div>
            <div className={styles.statLabel}>Practice Accuracy</div>
            <div className={styles.statSubtext}>
              {stats.practiceAttemptsCount > 0
                ? `${stats.practiceAttemptsCount} attempts recorded`
                : 'Complete a practice session to measure'}
            </div>
          </div>
        </div>

        {/* Continents Grid */}
        <section className={styles.section} id="continents">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Seven-Continent Progression</h2>
            <span className={styles.sectionDesc}>10 countries per batch</span>
          </div>

          <div className={styles.continentsGrid}>
            {ALL_CONTINENTS.map((continent) => {
              const countries = getCountriesByContinent(continent);
              const batchCount = getContinentBatchCount(continent);
              const isAntarctica = continent === 'Antarctica';

              // Calculate how many countries in this continent are introduced
              const introducedInContinent = countries.filter((c) =>
                progress?.introducedCountryCodes.includes(c.code)
              ).length;

              const completedBatchesForContinent =
                progress?.completedBatches[continent]?.length || 0;

              if (isAntarctica) {
                return (
                  <div
                    key={continent}
                    className={`${styles.continentCard} ${styles.continentCardDisabled}`}
                  >
                    <div className={styles.cardTop}>
                      <h3 className={styles.continentName}>{continent}</h3>
                      <span className={styles.batchBadge}>0 Batches</span>
                    </div>
                    <p className={styles.continentMeta}>
                      0 sovereign countries. Governed by the Antarctic Treaty System; excluded from national flag learning.
                    </p>
                    <div className={styles.cardFooter}>
                      <span>No learning batches</span>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={continent}
                  href={`/learn/continents/${encodeURIComponent(continent)}`}
                  className={styles.continentCard}
                >
                  <div>
                    <div className={styles.cardTop}>
                      <h3 className={styles.continentName}>{continent}</h3>
                      <span className={styles.batchBadge}>
                        {batchCount} {batchCount === 1 ? 'Batch' : 'Batches'}
                      </span>
                    </div>
                    <p className={styles.continentMeta}>
                      {countries.length} sovereign states · {introducedInContinent} introduced
                    </p>
                  </div>

                  <div className={styles.cardFooter}>
                    <span>
                      {completedBatchesForContinent > 0
                        ? `${completedBatchesForContinent} of ${batchCount} batches completed`
                        : 'Not started'}
                    </span>
                    <span className={styles.startLink}>Open Continent →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Due Reviews Status */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Retention &amp; Scheduled Reviews</h2>
          </div>

          <div className={styles.reviewBox}>
            <span className={styles.reviewIcon} aria-hidden="true">⏱️</span>
            <div className={styles.reviewText}>
              <h4>Review queue clear (0 due)</h4>
              <p>
                The adaptive spaced-repetition scheduler is scheduled for Phase 3.
                Any countries you introduce and practice now will be queued for multi-day retention checks once active.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
