'use client';

import React, { use, useState, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import { Continent, ALL_CONTINENTS, Country } from '../../../../../types/country';
import { getAllCountries } from '../../../../../lib/countries';
import { getBatch, getContinentBatchCount } from '../../../../../lib/batches';
import {
  evaluateTypedAnswer,
  generateMultipleChoiceOptions,
} from '../../../../../lib/answers';
import {
  recordPracticeAttempt,
  PracticeMode,
  FlashcardRating,
} from '../../../../../lib/progress';
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
  const batchIdx = parseInt(resolvedParams.batchIndex, 10);

  if (!ALL_CONTINENTS.includes(rawContinent) || isNaN(batchIdx)) {
    notFound();
  }

  const batch = getBatch(rawContinent, batchIdx);
  if (!batch) {
    notFound();
  }

  const allWorldCountries = useMemo(() => getAllCountries(), []);
  const batchCountries = batch.countries;
  const totalBatchesInContinent = getContinentBatchCount(rawContinent);
  const hasNextBatch = batchIdx + 1 < totalBatchesInContinent;

  // Active Practice Mode
  const [mode, setMode] = useState<PracticeMode>('multiple-choice');

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
    if (selectedOption !== null) return; // already answered
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

    recordPracticeAttempt({
      countryCode: currentCountry.code,
      mode: 'multiple-choice',
      isCorrect,
    });
  };

  // Handle Typed Recall submit
  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedSubmitted || !typedInput.trim()) return;

    setTypedSubmitted(true);
    const result = evaluateTypedAnswer(typedInput, currentCountry);
    setAttemptedCount((prev) => prev + 1);

    if (result.isCorrect) {
      setCorrectCount((prev) => prev + 1);
      setFeedback({ isCorrect: true, message: `Correct! ${currentCountry.name}.` });
    } else {
      setIncorrectCount((prev) => prev + 1);
      setFeedback({
        isCorrect: false,
        message: `Incorrect. Expected: ${result.expectedAnswer}`,
      });
    }

    recordPracticeAttempt({
      countryCode: currentCountry.code,
      mode: 'typed',
      isCorrect: result.isCorrect,
    });
  };

  // Handle Flashcard self-rating
  const handleFlashcardRate = (rating: FlashcardRating) => {
    setAttemptedCount((prev) => prev + 1);
    const isSubjectiveCorrect = rating === 'good' || rating === 'easy';

    if (isSubjectiveCorrect) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setIncorrectCount((prev) => prev + 1);
    }

    recordPracticeAttempt({
      countryCode: currentCountry.code,
      mode: 'flashcard',
      isCorrect: isSubjectiveCorrect,
      selfRating: rating,
    });

    advanceNext();
  };

  // Move to next question or finish
  const advanceNext = () => {
    setSelectedOption(null);
    setTypedInput('');
    setTypedSubmitted(false);
    setIsFlashcardRevealed(false);
    setFeedback(null);

    if (currentIndex < batchCountries.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsSessionFinished(true);
    }
  };

  const restartSession = () => {
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

  // Render Session Completion Summary
  if (isSessionFinished) {
    const accuracy =
      attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    return (
      <div className={styles.practiceContainer}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} aria-hidden="true">🏆</div>
          <h1 className={styles.summaryTitle}>Practice Session Complete</h1>
          <p className={styles.summarySubtitle}>
            Completed review of {rawContinent} · Batch {batch.batchNumber} ({batchCountries.length} flags)
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
              Practice Batch Again
            </button>

            {hasNextBatch && (
              <Link
                href={`/learn/study/${encodeURIComponent(rawContinent)}/${batchIdx + 1}`}
                className={styles.submitBtn}
                style={{ textDecoration: 'none' }}
              >
                Study Next Batch (Batch {batchIdx + 2}) →
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
            ← {rawContinent} / Batch {batch.batchNumber}
          </Link>
        </div>

        {/* Practice Mode Selector */}
        <div className={styles.modeSelector} role="tablist" aria-label="Select practice mode">
          <button
            role="tab"
            aria-selected={mode === 'multiple-choice'}
            onClick={() => setMode('multiple-choice')}
            className={`${styles.modeTab} ${mode === 'multiple-choice' ? styles.modeTabActive : ''}`}
          >
            Multiple Choice
          </button>
          <button
            role="tab"
            aria-selected={mode === 'typed'}
            onClick={() => setMode('typed')}
            className={`${styles.modeTab} ${mode === 'typed' ? styles.modeTabActive : ''}`}
          >
            Typed Recall
          </button>
          <button
            role="tab"
            aria-selected={mode === 'flashcard'}
            onClick={() => setMode('flashcard')}
            className={`${styles.modeTab} ${mode === 'flashcard' ? styles.modeTabActive : ''}`}
          >
            Flashcards
          </button>
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

      <main className={styles.practiceCard}>
        <h2 className={styles.questionPrompt}>
          Question {currentIndex + 1} of {batchCountries.length} — Which country is this?
        </h2>

        <div className={styles.flagWrapper}>
          <FlagImage country={currentCountry} size="lg" />
        </div>

        {/* MODE 1: MULTIPLE CHOICE */}
        {mode === 'multiple-choice' && (
          <>
            <div className={styles.optionsGrid}>
              {mcOptions.map((option) => {
                let optionClass = '';
                if (selectedOption !== null) {
                  if (option.code === currentCountry.code) {
                    optionClass = styles.optionCorrect;
                  } else if (option.code === selectedOption) {
                    optionClass = styles.optionIncorrect;
                  }
                }

                return (
                  <button
                    key={option.code}
                    onClick={() => handleSelectOption(option)}
                    disabled={selectedOption !== null}
                    className={`${styles.optionBtn} ${optionClass}`}
                  >
                    {option.name}
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
            <form onSubmit={handleTypedSubmit} className={styles.typedForm}>
              <input
                type="text"
                autoFocus
                placeholder="Type country name..."
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                disabled={typedSubmitted}
                className={styles.typedInput}
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
