'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './OnboardingModal.module.css';
import { LessonSize, VALID_LESSON_SIZES, DEFAULT_LESSON_SIZE } from '../lib/preferences';

interface OnboardingModalProps {
  initialLessonSize?: LessonSize;
  onComplete: (size: LessonSize) => void;
  isEditing?: boolean;
  onDismiss?: () => void;
}

interface PaceOption {
  size: LessonSize;
  paceTitle: string;
  paceSubtitle: string;
  isRecommended?: boolean;
}

const PACE_OPTIONS: readonly PaceOption[] = [
  {
    size: 5,
    paceTitle: 'Light pace',
    paceSubtitle: 'A smaller daily lesson for gradual learning.',
  },
  {
    size: 10,
    paceTitle: 'Balanced pace',
    paceSubtitle: 'The recommended/default option.',
    isRecommended: true,
  },
  {
    size: 15,
    paceTitle: 'Intensive pace',
    paceSubtitle: 'For users who want to move through the curriculum faster.',
  },
];

export function OnboardingModal({
  initialLessonSize = DEFAULT_LESSON_SIZE,
  onComplete,
  isEditing = false,
  onDismiss,
}: OnboardingModalProps) {
  const [selectedSize, setSelectedSize] = useState<LessonSize>(initialLessonSize);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap / escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditing && onDismiss) {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, onDismiss]);

  const handleContinue = () => {
    onComplete(selectedSize);
  };

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-desc"
    >
      <div className={styles.modal} ref={modalRef}>
        {isEditing && onDismiss && (
          <button
            onClick={onDismiss}
            className={styles.closeXBtn}
            aria-label="Close pace settings"
          >
            ✕
          </button>
        )}

        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDot} aria-hidden="true" />
          <span>{isEditing ? 'Learning Settings' : 'Set your learning pace'}</span>
        </div>

        <h2 id="onboarding-title" className={styles.title}>
          How many flags would you like to learn at a time?
        </h2>

        <p id="onboarding-desc" className={styles.subtitle}>
          Choose a pace that feels comfortable. You can change this later.
        </p>

        <div
          className={styles.optionsGrid}
          role="radiogroup"
          aria-label="Lesson size selection"
        >
          {PACE_OPTIONS.map((opt) => {
            const isSelected = selectedSize === opt.size;
            return (
              <button
                key={opt.size}
                type="button"
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => setSelectedSize(opt.size)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    const idx = VALID_LESSON_SIZES.indexOf(opt.size);
                    const next = VALID_LESSON_SIZES[(idx + 1) % VALID_LESSON_SIZES.length];
                    setSelectedSize(next);
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    const idx = VALID_LESSON_SIZES.indexOf(opt.size);
                    const prev =
                      VALID_LESSON_SIZES[
                        (idx - 1 + VALID_LESSON_SIZES.length) % VALID_LESSON_SIZES.length
                      ];
                    setSelectedSize(prev);
                  }
                }}
                className={`${styles.optionCard} ${
                  isSelected ? styles.optionCardSelected : ''
                }`}
              >
                <div className={styles.optionHeader}>
                  <div>
                    <span className={styles.flagCount}>{opt.size}</span>
                    <span className={styles.flagUnit}>flags</span>
                  </div>
                  {opt.isRecommended && (
                    <span className={styles.recommendedPill}>Recommended</span>
                  )}
                </div>

                <div className={styles.paceLabel}>{opt.paceTitle}</div>
                <div className={styles.paceDesc}>{opt.paceSubtitle}</div>

                <div className={styles.indicatorRow}>
                  <span className={styles.radioCircle} aria-hidden="true">
                    {isSelected && <span className={styles.radioDot} />}
                  </span>
                  <span>{isSelected ? 'Selected' : 'Select'}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className={styles.footer}>
          {isEditing && onDismiss && (
            <button type="button" onClick={onDismiss} className={styles.dismissBtn}>
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleContinue}
            className={styles.continueBtn}
            id="onboarding-continue-btn"
          >
            <span>{isEditing ? 'Save Learning Pace →' : 'Continue →'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
