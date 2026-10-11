'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';
import { createClient } from '../../lib/supabase/client';
import { getSupabaseConfig } from '../../lib/supabase/config';
import { validatePassword, validatePasswordConfirmation } from '../../lib/supabase/validation';

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { isConfigured } = getSupabaseConfig();

  useEffect(() => {
    if (!isConfigured) {
      setCheckingSession(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.getSession().then((response) => {
      setHasSession(Boolean(response.data?.session));
      setCheckingSession(false);
    });
  }, [isConfigured]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const passVal = validatePassword(password);
    if (!passVal.isValid) {
      setErrorMsg(passVal.error || 'Invalid password');
      return;
    }

    const confirmVal = validatePasswordConfirmation(password, confirmPassword);
    if (!confirmVal.isValid) {
      setErrorMsg(confirmVal.error || 'Passwords do not match');
      return;
    }

    if (!isConfigured) {
      setErrorMsg('Supabase credentials are not configured in .env.local.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMsg(error.message || 'Failed to update password. Recovery link may have expired.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push('/learn');
        router.refresh();
      }, 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMsg(message);
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            Verifying recovery session…
          </p>
        </div>
      </div>
    );
  }

  if (isConfigured && !hasSession) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <h1 className={styles.authTitle}>Link Expired</h1>
            <p className={styles.authSubtitle}>
              This password recovery link is invalid or has expired.
            </p>
          </div>
          <div className={styles.alertError}>
            Please request a fresh password recovery email to reset your credentials.
          </div>
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link href="/forgot-password" className={styles.submitBtn} style={{ textDecoration: 'none' }}>
              Request New Recovery Link →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Choose New Password</h1>
          <p className={styles.authSubtitle}>
            Enter your new secure password below
          </p>
        </div>

        {errorMsg && <div className={styles.alertError}>{errorMsg}</div>}

        {success ? (
          <div className={styles.alertSuccess}>
            <p>
              Your password has been successfully updated! Redirecting to your learning workspace…
            </p>
            <div style={{ marginTop: '1rem' }}>
              <Link href="/learn" className={styles.submitBtn} style={{ textDecoration: 'none' }}>
                Go to Workspace →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
            <div className={styles.formGroup}>
              <label htmlFor="reset-new-password" className={styles.formLabel}>
                New Password (min. 6 characters)
              </label>
              <input
                id="reset-new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.formInput}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="reset-confirm-password" className={styles.formLabel}>
                Confirm New Password
              </label>
              <input
                id="reset-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.formInput}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
              id="reset-submit-btn"
            >
              {loading ? 'Updating password…' : 'Update Password →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className={styles.authContainer}><p>Loading reset password…</p></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
