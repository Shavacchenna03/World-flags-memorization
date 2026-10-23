'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { ALL_CONTINENTS } from '../../types/country';
import { getCountriesByContinent, getCountryCount } from '../../lib/countries';
import {
  getBatch,
  getContinentBatchCount,
  getContinentBatches,
  getTotalLessonsCount,
} from '../../lib/batches';
import {
  loadProgress,
  getProgressStats,
  getNextLessonRecommendation,
  UserProgress,
} from '../../lib/progress';
import {
  loadPreferences,
  LearningPreferences,
  LessonSize,
  DEFAULT_LESSON_SIZE,
} from '../../lib/preferences';
import { OnboardingModal } from '../../components/OnboardingModal';
import { ProgressMigrationPrompt } from '../../components/ProgressMigrationPrompt';
import { learningRepository } from '../../lib/progress/repository';
import { MigrationState } from '../../lib/progress/types';
import { createClient } from '../../lib/supabase/client';
import { getSupabaseConfig } from '../../lib/supabase/config';

function LearnDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [preferences, setPreferences] = useState<LearningPreferences>(() => loadPreferences());
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [isEditingPace, setIsEditingPace] = useState<boolean>(false);
  const [migrationState, setMigrationState] = useState<MigrationState | null>(null);

  const totalCountryCount = getCountryCount();

  useEffect(() => {
    // 1. Initial fast local load for instant render
    setProgress(loadProgress());
    const currentPrefs = loadPreferences();
    setPreferences(currentPrefs);

    const hasOnboardingParam = searchParams.get('onboarding') === '1';

    // 2. Fetch authoritative repository data (cloud if authenticated, local if guest)
    learningRepository.getLearningPreferences().then((cloudPrefs) => {
      setPreferences(cloudPrefs);

      // Check onboarding modal requirement
      const { isConfigured } = getSupabaseConfig();
      if (isConfigured) {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!cloudPrefs.onboardingCompleted && (user !== null || hasOnboardingParam)) {
            setShowOnboarding(true);
          }
        });
      } else if (hasOnboardingParam && !cloudPrefs.onboardingCompleted) {
        setShowOnboarding(true);
      }
    });

    learningRepository.getUserProgress().then((userProg) => {
      setProgress(userProg);
    });

    // 3. Check if user has unmigrated local progress
    learningRepository.checkMigrationEligibility().then((state) => {
      if (state.eligibleForMigration) {
        setMigrationState(state);
      }
    });
  }, [searchParams]);

  const handlePaceSelection = async (newSize: LessonSize) => {
    const updated = await learningRepository.saveLearningPreferences({
      lessonSize: newSize,
      onboardingCompleted: true,
    });
    setPreferences(updated);
    setShowOnboarding(false);
    setIsEditingPace(false);

    // Clean up query param if present
    if (searchParams.get('onboarding')) {
      router.replace('/learn');
    }
  };

  const handleMigrationImported = async () => {
    setMigrationState(null);
    const updatedProgress = await learningRepository.getUserProgress();
    const updatedPrefs = await learningRepository.getLearningPreferences();
    setProgress(updatedProgress);
    setPreferences(updatedPrefs);
  };

  const handleMigrationDismissed = () => {
    setMigrationState(null);
  };

  const stats = progress
    ? getProgressStats(totalCountryCount)
    : {
        introducedCount: 0,
        totalCountries: totalCountryCount,
        completedBatchCount: 0,
        practiceAttemptsCount: 0,
        practiceAccuracy: 0,
      };

  const totalLessonsAllContinents = getTotalLessonsCount(preferences.lessonSize);

  // Derive the next lesson dynamically from actual persisted progress and chosen lesson size
  const nextLesson = progress
    ? getNextLessonRecommendation(progress, (continent, batchIndex) => {
        const batch = getBatch(continent, batchIndex, preferences.lessonSize);
        if (!batch) return undefined;
        return {
          countryCount: batch.countries.length,
          totalBatches: batch.totalBatches,
          countries: batch.countries,
        };
      })
    : {
        continent: 'Africa' as const,
        batchIndex: 0,
        batchNumber: 1,
        countryCount: preferences.lessonSize,
        totalBatchesInContinent: getContinentBatchCount('Africa', preferences.lessonSize),
        actionType: 'start' as const,
        badgeLabel: 'First Lesson',
        buttonLabel: 'Start First Lesson →',
        description: `Begin your study journey with the first ${preferences.lessonSize} sovereign country flags in Africa.`,
      };

  // Dynamically calculate completed lessons count across all continents for current lesson size
  let dynamicCompletedLessonsCount = 0;
  for (const continent of ALL_CONTINENTS) {
    if (continent === 'Antarctica') continue;
    const batches = getContinentBatches(continent, preferences.lessonSize);
    for (const b of batches) {
      const isCompleted =
        b.countries.length > 0 &&
        b.countries.every((c) => progress?.introducedCountryCodes.includes(c.code));
      if (isCompleted || progress?.completedBatches[continent]?.includes(b.batchIndex)) {
        dynamicCompletedLessonsCount++;
      }
    }
  }

  const introducedPercent = Math.min(
    100,
    Math.round((stats.introducedCount / (stats.totalCountries || 195)) * 100)
  );

  const completedLessonsPercent = Math.min(
    100,
    Math.round((dynamicCompletedLessonsCount / (totalLessonsAllContinents || 23)) * 100)
  );

  const paceLabel =
    preferences.lessonSize === 5
      ? 'Light'
      : preferences.lessonSize === 15
      ? 'Intensive'
      : 'Balanced';

  return (
    <div className="container">
      {/* Onboarding Modal for first-time registered users */}
      {showOnboarding && (
        <OnboardingModal
          initialLessonSize={DEFAULT_LESSON_SIZE}
          onComplete={handlePaceSelection}
          isEditing={false}
        />
      )}

      {/* Settings Modal when user clicks Change Pace */}
      {isEditingPace && (
        <OnboardingModal
          initialLessonSize={preferences.lessonSize}
          onComplete={handlePaceSelection}
          isEditing={true}
          onDismiss={() => setIsEditingPace(false)}
        />
      )}

      <main className={styles.dashboardLayout}>
        {/* Workspace Header */}
        <header className={styles.dashboardHeader}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.pageTitle}>Learning Dashboard</h1>
              <p className={styles.pageSubtitle}>
                Structured spaced-repetition curriculum across 195 sovereign nations
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingPace(true)}
              className={styles.paceBadgeBtn}
              id="change-learning-pace-btn"
              title="Change how many flags you learn per lesson"
            >
              <span className={styles.paceDot} aria-hidden="true" />
              <span>
                Pace: {preferences.lessonSize} flags ({paceLabel})
              </span>
              <span className={styles.changePaceText}>Change</span>
            </button>
          </div>
        </header>

        {/* Local -> Cloud Progress Migration Banner */}
        {migrationState && (
          <ProgressMigrationPrompt
            localIntroducedCount={migrationState.localIntroducedCount}
            localAttemptsCount={migrationState.localAttemptsCount}
            onImportCompleted={handleMigrationImported}
            onDismissed={handleMigrationDismissed}
          />
        )}

        {/* 1. PRIMARY: Next Lesson / Resume Action */}
        <section
          className={styles.nextLessonCard}
          aria-label="Recommended Next Learning Action"
        >
          <div className={styles.nextLessonInfo}>
            <span className={styles.nextLessonBadge}>{nextLesson.badgeLabel}</span>
            <h2 className={styles.nextLessonTitle}>
              {nextLesson.continent} · Lesson {nextLesson.batchNumber}
            </h2>
            <p className={styles.nextLessonDesc}>
              {nextLesson.description}
            </p>
          </div>

          <Link
            href={`/learn/study/${encodeURIComponent(nextLesson.continent)}/${nextLesson.batchNumber}`}
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

            {/* Lessons Completed */}
            <div className={styles.analyticsCard}>
              <span className={styles.analyticsValue}>
                {dynamicCompletedLessonsCount}
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                  {' '}/ {totalLessonsAllContinents}
                </span>
              </span>
              <span className={styles.analyticsLabel}>Lessons Completed</span>
              <div
                className={styles.analyticsMeter}
                role="progressbar"
                aria-valuenow={dynamicCompletedLessonsCount}
                aria-valuemin={0}
                aria-valuemax={totalLessonsAllContinents}
                aria-label="Lessons completed progress"
              >
                <div
                  className={styles.analyticsMeterFill}
                  style={{ width: `${completedLessonsPercent}%` }}
                />
              </div>
              <span className={styles.analyticsHint}>
                {preferences.lessonSize} sovereign flags per curriculum lesson
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
              const batchCount = getContinentBatchCount(continent, preferences.lessonSize);
              const isAntarctica = continent === 'Antarctica';

              const introducedInContinent = countries.filter((c) =>
                progress?.introducedCountryCodes.includes(c.code)
              ).length;

              const continentBatches = getContinentBatches(continent, preferences.lessonSize);
              const completedLessonsForContinent = continentBatches.filter(
                (b) =>
                  b.countries.length > 0 &&
                  (b.countries.every((c) => progress?.introducedCountryCodes.includes(c.code)) ||
                    progress?.completedBatches[continent]?.includes(b.batchIndex))
              ).length;

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
                      {batchCount === 1 ? 'lesson' : 'lessons'}
                    </div>
                  </div>

                  <div className={styles.curriculumRight}>
                    <span className={styles.curriculumProgress}>
                      {completedLessonsForContinent > 0
                        ? `${completedLessonsForContinent} of ${batchCount} lessons completed`
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

export default function LearnDashboardPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '3rem 0' }}>Loading curriculum...</div>}>
      <LearnDashboardContent />
    </Suspense>
  );
}
