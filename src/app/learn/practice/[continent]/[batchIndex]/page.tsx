'use client';

import React, { use, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import { Continent, ALL_CONTINENTS, Country } from '../../../../../types/country';
import { getAllCountries } from '../../../../../lib/countries';
import { getBatch, getBatchByNumber, getContinentBatchCount } from '../../../../../lib/batches';
import {
  evaluateTypedAnswer,
  generateMultipleChoiceOptions,
} from '../../../../../lib/answers';
import {
  recordPracticeAttempt,
  PracticeMode,
  FlashcardRating,
} from '../../../../../lib/progress';
import { shuffleArray } from '../../../../../lib/session';
import { loadPreferences, LearningPreferences } from '../../../../../lib/preferences';
import { learningRepository } from '../../../../../lib/progress/repository';
import { FlagImage } from '../../../../../components/FlagImage';

interface PracticePageProps {
  params: Promise<{
    continent: string;
    batchIndex: string;
  }>;
}

export default function PracticeSessionPage({ params }: PracticePageProps) {
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

  // Authoritative lesson lookup using active lesson size
  const batch =
    routeBatchNum >= 1
      ? getBatchByNumber(rawContinent, routeBatchNum, preferences.lessonSize)
      : getBatch(rawContinent, 0, preferences.lessonSize);

  if (mounted && !batch) {
    notFound();
  }

  const allWorldCountries = useMemo(() => getAllCountries(), []);
  const totalBatchesInContinent = getContinentBatchCount(rawContinent, preferences.lessonSize);
  const hasNextBatch = batch ? batch.batchNumber < totalBatchesInContinent : false;

  // Active Practice Mode
  const [mode, setMode] = useState<PracticeMode>('multiple-choice');

  // Randomized question sequence for the active practice session
  const [batchCountries, setBatchCountries] = useState<Country[]>(() =>
    batch ? shuffleArray(batch.countries) : []
  );

  useEffect(() => {
    if (batch && batchCountries.length === 0) {
      setBatchCountries(shuffleArray(batch.countries));
    }
  }, [batch, batchCountries.length]);

  // Session state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState('');
  const [typedSubmitted, setTypedSubmitted] = useState(false);
  const [isFlashcardRevealed, setIsFlashcardRevealed] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);

  // Session stats
  const [attemptedCount, setAttemptedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  const currentCountry = batchCountries[currentIndex];

  // Generate 4 distinct options for Multiple Choice
  const mcOptions = useMemo(() => {
    if (!currentCountry) return [];
    return generateMultipleChoiceOptions(currentCountry, allWorldCountries);
  }, [currentCountry, allWorldCountries]);

  // Handle MCQ selection
  const handleSelectOption = (chosen: Country) => {
    if (selectedOption !== null || !currentCountry) return; // already answered
    setSelectedOption(chosen.code);

    const isCorrect = chosen.code === currentCountry.code;
    setAttemptedCount((prev) => prev + 1);

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setFeedback({ isCorrect: true, message: `Correct! That is ${currentCountry.name}.` });
    } else {
      setIncorrectCount((prev) => prev + 1);
      setFeedback({
        isCorrect: false,
        message: `Incorrect. You chose ${chosen.name}. The correct answer is ${currentCountry.name}.`,
      });
    }

    learningRepository.savePracticeAttempt({
      countryCode: currentCountry.code,
      mode: 'multiple-choice',
      isCorrect,
    });
  };

  // Handle Typed Answer Submission
  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedSubmitted || !typedInput.trim() || !currentCountry) return;

    const evalResult = evaluateTypedAnswer(typedInput, currentCountry);
    setTypedSubmitted(true);
    setAttemptedCount((prev) => prev + 1);

    if (evalResult.isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setFeedback({
        isCorrect: true,
        message: `Correct! ${currentCountry.name}.`,
      });
    } else {
      setIncorrectCount((prev) => prev + 1);
      setFeedback({
        isCorrect: false,
        message: `Incorrect. The correct answer is ${currentCountry.name}.`,
      });
    }

    learningRepository.savePracticeAttempt({
      countryCode: currentCountry.code,
      mode: 'typed',
      isCorrect: evalResult.isCorrect,
    });
  };

  // Handle Flashcard Self-Rating
  const handleFlashcardRate = (rating: FlashcardRating) => {
    if (!currentCountry) return;
    const isConsideredPass = rating === 'good' || rating === 'easy';
    setAttemptedCount((prev) => prev + 1);

    if (isConsideredPass) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setIncorrectCount((prev) => prev + 1);
    }

    learningRepository.savePracticeAttempt({
      countryCode: currentCountry.code,
      mode: 'flashcard',
      isCorrect: isConsideredPass,
      selfRating: rating,
    });
    advanceNext();
  };

  // Advance to Next Question
  const advanceNext = () => {
    if (currentIndex < batchCountries.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setTypedInput('');
      setTypedSubmitted(false);
      setIsFlashcardRevealed(false);
      setFeedback(null);
    } else {
      setIsSessionFinished(true);
    }
  };

  // Reset/Restart Session with fresh randomization
  const restartSession = () => {
    if (!batch) return;
    setBatchCountries(shuffleArray(batch.countries));
    setCurrentIndex(0);
    setSelectedOption(null);
    setTypedInput('');
    setTypedSubmitted(false);
    setIsFlashcardRevealed(false);
    setFeedback(null);
    setAttemptedCount(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIsSessionFinished(false);
  };

  if (!batch || !currentCountry) {
    return (
      <div className={styles.practiceContainer}>
        <div style={{ padding: '3rem 0', color: 'var(--text-secondary)' }}>
          Loading practice session...
        </div>
      </div>
    );
  }

  // Session Summary View
  if (isSessionFinished) {
    const accuracy =
      attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    return (
      <div className={styles.practiceContainer}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryGlyph} aria-hidden="true">✦</div>
          <h1 className={styles.summaryTitle}>Practice Session Complete</h1>
          <p className={styles.summarySubtitle}>
            Completed review of {rawContinent} · Lesson {batch.batchNumber} ({batchCountries.length} flags)
          </p>

          <div className={styles.summaryStatsGrid}>
            <div className={styles.summaryStatItem}>
              <div className={styles.summaryStatVal}>{attemptedCount}</div>
              <div className={styles.summaryStatLabel}>Questions</div>
            </div>

            <div className={styles.summaryStatItem}>
              <div className={`${styles.summaryStatVal} ${styles.summaryStatValGreen}`}>
                {correctCount}
              </div>
              <div className={styles.summaryStatLabel}>Correct</div>
            </div>

            <div className={styles.summaryStatItem}>
              <div className={styles.summaryStatVal}>{accuracy}%</div>
              <div className={styles.summaryStatLabel}>Accuracy</div>
            </div>
          </div>

          <div className={styles.summaryActions}>
            <button
              onClick={restartSession}
              className={styles.nextQuestionBtn}
              style={{ marginTop: 0 }}
            >
              Practice Lesson Again
            </button>

            {hasNextBatch && (
              <Link
                href={`/learn/study/${encodeURIComponent(rawContinent)}/${batch.batchNumber + 1}`}
                className={styles.submitBtn}
                style={{ textDecoration: 'none' }}
              >
                Study Next Lesson (Lesson {batch.batchNumber + 1}) →
              </Link>
            )}

            <Link
              href={`/learn/continents/${encodeURIComponent(rawContinent)}`}
              className={styles.revealBtn}
              style={{ textDecoration: 'none' }}
            >
              Back to {rawContinent}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / batchCountries.length) * 100);

  return (
    <div className={styles.practiceContainer}>
      <div className={styles.topBar}>
        <div className={styles.breadcrumb}>
          <Link href={`/learn/continents/${encodeURIComponent(rawContinent)}`}>
            ← {rawContinent} / Lesson {batch.batchNumber}
          </Link>
        </div>

        <div className={styles.stepIndicator}>
          Flag {currentIndex + 1} of {batchCountries.length}
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

      {/* Mode Switcher Tabs */}
      <div className={styles.modeTabs} role="tablist" aria-label="Practice Modes">
        <button
          role="tab"
          aria-selected={mode === 'multiple-choice'}
          onClick={() => {
            setMode('multiple-choice');
            setSelectedOption(null);
            setFeedback(null);
          }}
          className={`${styles.modeTab} ${mode === 'multiple-choice' ? styles.modeTabActive : ''}`}
        >
          Multiple Choice
        </button>
        <button
          role="tab"
          aria-selected={mode === 'typed'}
          onClick={() => {
            setMode('typed');
            setTypedSubmitted(false);
            setFeedback(null);
          }}
          className={`${styles.modeTab} ${mode === 'typed' ? styles.modeTabActive : ''}`}
        >
          Typed Recall
        </button>
        <button
          role="tab"
          aria-selected={mode === 'flashcard'}
          onClick={() => {
            setMode('flashcard');
            setIsFlashcardRevealed(false);
            setFeedback(null);
          }}
          className={`${styles.modeTab} ${mode === 'flashcard' ? styles.modeTabActive : ''}`}
        >
          Flashcard
        </button>
      </div>

      <main className={styles.card}>
        <div className={styles.flagWrapper}>
          <FlagImage country={currentCountry} size="xl" />
        </div>

        {/* MODE 1: MULTIPLE CHOICE */}
        {mode === 'multiple-choice' && (
          <>
            <h2 className={styles.questionPrompt}>Which sovereign nation flies this flag?</h2>

            <div className={styles.optionsGrid}>
              {mcOptions.map((opt) => {
                const isSelected = selectedOption === opt.code;
                const isTarget = opt.code === currentCountry.code;

                let optClass = styles.optionBtn;
                if (selectedOption !== null) {
                  if (isTarget) {
                    optClass = `${styles.optionBtn} ${styles.optionCorrect}`;
                  } else if (isSelected) {
                    optClass = `${styles.optionBtn} ${styles.optionIncorrect}`;
                  }
                }

                return (
                  <button
                    key={opt.code}
                    onClick={() => handleSelectOption(opt)}
                    disabled={selectedOption !== null}
                    className={optClass}
                  >
                    <span>{opt.name}</span>
                  </button>
                );
              })}
            </div>

            {feedback && (
              <div
                className={`${styles.feedbackBanner} ${
                  feedback.isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect
                }`}
              >
                {feedback.message}
              </div>
            )}

            {selectedOption !== null && (
              <button onClick={advanceNext} className={styles.nextQuestionBtn}>
                <span>{currentIndex === batchCountries.length - 1 ? 'View Summary' : 'Next Question'}</span>
                <span aria-hidden="true"> →</span>
              </button>
            )}
          </>
        )}

        {/* MODE 2: TYPED RECALL */}
        {mode === 'typed' && (
          <>
            <h2 className={styles.questionPrompt}>Type the name of this country:</h2>

            <form onSubmit={handleTypedSubmit} className={styles.typedForm}>
              <input
                type="text"
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="e.g. Argentina, South Korea..."
                disabled={typedSubmitted}
                className={styles.typedInput}
                autoFocus
                aria-label="Country name input"
              />
              {!typedSubmitted && (
                <button type="submit" className={styles.submitBtn}>
                  Submit Answer
                </button>
              )}
            </form>

            {feedback && (
              <div
                className={`${styles.feedbackBanner} ${
                  feedback.isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect
                }`}
              >
                {feedback.message}
              </div>
            )}

            {typedSubmitted && (
              <button onClick={advanceNext} className={styles.nextQuestionBtn}>
                <span>{currentIndex === batchCountries.length - 1 ? 'View Summary' : 'Next Question'}</span>
                <span aria-hidden="true"> →</span>
              </button>
            )}
          </>
        )}

        {/* MODE 3: FLASHCARDS */}
        {mode === 'flashcard' && (
          <>
            {!isFlashcardRevealed ? (
              <button
                onClick={() => setIsFlashcardRevealed(true)}
                className={styles.revealBtn}
              >
                Reveal Country Name
              </button>
            ) : (
              <div className={styles.revealedAnswer}>
                <div className={styles.revealedName}>{currentCountry.name}</div>
                {currentCountry.capital && (
                  <div className={styles.revealedCapital}>
                    Capital: {currentCountry.capital} · {currentCountry.officialName}
                  </div>
                )}

                <div className={styles.ratingRow}>
                  <button
                    onClick={() => handleFlashcardRate('again')}
                    className={`${styles.rateBtn} ${styles.rateAgain}`}
                  >
                    Again (1)
                  </button>
                  <button
                    onClick={() => handleFlashcardRate('hard')}
                    className={`${styles.rateBtn} ${styles.rateHard}`}
                  >
                    Hard (2)
                  </button>
                  <button
                    onClick={() => handleFlashcardRate('good')}
                    className={`${styles.rateBtn} ${styles.rateGood}`}
                  >
                    Good (3)
                  </button>
                  <button
                    onClick={() => handleFlashcardRate('easy')}
                    className={`${styles.rateBtn} ${styles.rateEasy}`}
                  >
                    Easy (4)
                  </button>
                </div>

                <p className={styles.ratingDisclaimer}>
                  Self-ratings help adjust review scheduling; verified recall occurs during active tests.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
