'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import { Continent, ALL_CONTINENTS } from '../../../../types/country';
import { getCountriesByContinent } from '../../../../lib/countries';
import { getContinentBatches } from '../../../../lib/batches';
import { loadProgress, UserProgress } from '../../../../lib/progress';
import { loadPreferences, LearningPreferences } from '../../../../lib/preferences';
import { learningRepository } from '../../../../lib/progress/repository';
import { FlagImage } from '../../../../components/FlagImage';

interface ContinentPageProps {
  params: Promise<{
    continent: string;
  }>;
}

export default function ContinentBatchesPage({ params }: ContinentPageProps) {
  const resolvedParams = use(params);
  const rawContinent = decodeURIComponent(resolvedParams.continent) as Continent;

  if (!ALL_CONTINENTS.includes(rawContinent)) {
    notFound();
  }

  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [preferences, setPreferences] = useState<LearningPreferences>(() => loadPreferences());

  useEffect(() => {
    setProgress(loadProgress());
    setPreferences(loadPreferences());

    learningRepository.getLearningPreferences().then(setPreferences);
    learningRepository.getUserProgress().then(setProgress);
  }, []);

  const countries = getCountriesByContinent(rawContinent);
  const batches = getContinentBatches(rawContinent, preferences.lessonSize);

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        <div className={styles.breadcrumb}>
          <Link href="/learn">← Dashboard</Link>
          <span>/</span>
          <span>{rawContinent}</span>
        </div>

        <header className={styles.header}>
          <h1 className={styles.title}>{rawContinent} Learning Path</h1>
          <p className={styles.meta}>
            {countries.length} sovereign states partitioned into {batches.length} sequential study lessons ({preferences.lessonSize} flags per lesson).
          </p>
        </header>

        {batches.length === 0 ? (
          <div className={styles.batchCard}>
            <p>Antarctica contains zero sovereign country flags in this curriculum.</p>
          </div>
        ) : (
          <div className={styles.batchesList}>
            {batches.map((batch) => {
              const isBatchFlagIntroduced =
                batch.countries.length > 0 &&
                batch.countries.every((c) => progress?.introducedCountryCodes.includes(c.code));

              const isCompleted =
                isBatchFlagIntroduced ||
                progress?.completedBatches[rawContinent]?.includes(batch.batchIndex);

              const introducedInBatch = batch.countries.filter((c) =>
                progress?.introducedCountryCodes.includes(c.code)
              ).length;

              let statusLabel = 'Ready to Study';
              let statusClass = styles.statusNew;

              if (isCompleted) {
                statusLabel = 'Completed';
                statusClass = styles.statusCompleted;
              } else if (introducedInBatch > 0) {
                statusLabel = `${introducedInBatch}/${batch.countries.length} Introduced`;
                statusClass = styles.statusIntroduced;
              }

              return (
                <article key={batch.batchIndex} className={styles.batchCard}>
                  <div className={styles.batchHeader}>
                    <div>
                      <h2 className={styles.batchTitle}>
                        Lesson {batch.batchNumber} · {batch.countries.length} Countries
                      </h2>
                    </div>
                    <span className={`${styles.batchStatus} ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className={styles.flagsRow}>
                    {batch.countries.map((c) => (
                      <div key={c.code} className={styles.flagItem} title={c.name}>
                        <FlagImage country={c} size="sm" />
                        <span className={styles.countryCodeLabel}>{c.code}</span>
                      </div>
                    ))}
                  </div>

                  <div className={styles.actionsRow}>
                    <Link
                      href={`/learn/study/${encodeURIComponent(rawContinent)}/${batch.batchNumber}`}
                      className={styles.primaryBtn}
                    >
                      <span>Study Lesson</span>
                      <span aria-hidden="true">→</span>
                    </Link>

                    <Link
                      href={`/learn/practice/${encodeURIComponent(rawContinent)}/${batch.batchNumber}`}
                      className={styles.secondaryBtn}
                    >
                      <span>Practice Lesson</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
