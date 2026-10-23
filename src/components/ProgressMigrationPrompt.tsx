'use client';

import React, { useState } from 'react';
import styles from './ProgressMigrationPrompt.module.css';
import { learningRepository } from '../lib/progress/repository';

interface ProgressMigrationPromptProps {
  localIntroducedCount: number;
  localAttemptsCount: number;
  onImportCompleted: () => void;
  onDismissed: () => void;
}

export function ProgressMigrationPrompt({
  localIntroducedCount,
  localAttemptsCount,
  onImportCompleted,
  onDismissed,
}: ProgressMigrationPromptProps) {
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    try {
      const res = await learningRepository.mergeLocalProgress();
      if (res.success) {
        onImportCompleted();
      } else {
        alert('Could not complete progress import. Your local records remain intact.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartFresh = async () => {
    setLoading(true);
    try {
      await learningRepository.dismissMigration();
      onDismissed();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={styles.bannerCard}
      role="region"
      aria-label="Progress Synchronization Prompt"
    >
      <div className={styles.topRow}>
        <span className={styles.icon} aria-hidden="true">
          ☁️
        </span>
        <div className={styles.textContent}>
          <h3 className={styles.title}>Import your existing progress into this account?</h3>
          <p className={styles.description}>
            We detected prior study records on this device (
            <span className={styles.highlight}>{localIntroducedCount} flags introduced</span>
            {localAttemptsCount > 0 && `, ${localAttemptsCount} practice attempts`}). Would you like to
            merge and synchronize them with your cloud account?
          </p>
        </div>
      </div>

      <div className={styles.actionsRow}>
        <button
          type="button"
          onClick={handleImport}
          disabled={loading}
          className={styles.importBtn}
          id="migration-import-btn"
        >
          <span>{loading ? 'Importing Progress...' : 'Import Progress'}</span>
          {!loading && <span aria-hidden="true">→</span>}
        </button>

        <button
          type="button"
          onClick={handleStartFresh}
          disabled={loading}
          className={styles.dismissBtn}
          id="migration-start-fresh-btn"
        >
          <span>Start Fresh</span>
        </button>
      </div>
    </div>
  );
}
