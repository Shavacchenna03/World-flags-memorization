'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../auth.module.css';
import { createClient } from '../../lib/supabase/client';
import { getSupabaseConfig } from '../../lib/supabase/config';
import {
  validateEmail,
  validatePassword,
  validateDisplayName,
  validatePasswordConfirmation,
} from '../../lib/supabase/validation';
import { sanitizeRedirectUrl } from '../../lib/supabase/redirect';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect_to') || searchParams.get('next');
  const safeRedirect = sanitizeRedirectUrl(rawRedirect, '/learn');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const { isConfigured } = getSupabaseConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);

    const nameVal = validateDisplayName(displayName);
    if (!nameVal.isValid) {
      setErrorMsg(nameVal.error || 'Invalid display name');
      return;
    }

    const emailVal = validateEmail(email);
    if (!emailVal.isValid) {
      setErrorMsg(emailVal.error || 'Invalid email');
      return;
    }

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
      setErrorMsg(
        'Supabase credentials are not configured yet. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.'
      );
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const origin = window.location.origin;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeRedirect)}`,
        },
      });

      if (error) {
        setErrorMsg(error.message || 'Registration failed. Please try again.');
        setLoading(false);
        return;
      }

      // If email confirmation is enabled on Supabase, a user is created without a session
      if (data.user && !data.session) {
        setSuccessNotice(
          `Account registered! A verification link was sent to ${email}. Please check your inbox to confirm your address, then sign in.`
        );
        setLoading(false);
        return;
      }

      // Immediate session created (email confirmation disabled in Supabase project settings)
      router.push(safeRedirect);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setErrorMsg(message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <h1 className={styles.authTitle}>Create Account</h1>
          <p className={styles.authSubtitle}>
            Save and synchronize your flag memorization journey
          </p>
        </div>

        {!isConfigured && (
          <div className={styles.alertNotice}>
            <strong>Setup Notice:</strong> Supabase credentials are not defined in <code>.env.local</code>.
            Copy <code>.env.example</code> to <code>.env.local</code> to activate live cloud registration.
          </div>
        )}

        {errorMsg && <div className={styles.alertError}>{errorMsg}</div>}

        {successNotice ? (
          <div className={styles.alertSuccess}>
            <p>{successNotice}</p>
            <div style={{ marginTop: '1rem' }}>
              <Link href="/login" className={styles.submitBtn} style={{ textDecoration: 'none' }}>
                Proceed to Sign In →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
            <div className={styles.formGroup}>
              <label htmlFor="signup-name" className={styles.formLabel}>
                Display Name
              </label>
              <input
                id="signup-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={styles.formInput}
                placeholder="Atlas Learner"
                required
                autoComplete="name"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="signup-email" className={styles.formLabel}>
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.formInput}
                placeholder="learner@example.com"
                required
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="signup-password" className={styles.formLabel}>
                Password (min. 6 characters)
              </label>
              <input
                id="signup-password"
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
              <label htmlFor="signup-confirm-password" className={styles.formLabel}>
                Confirm Password
              </label>
              <input
                id="signup-confirm-password"
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
              id="signup-submit-btn"
            >
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>
        )}

        <div className={styles.authFooter}>
          <div>
            Already have an account?{' '}
            <Link href={`/login${rawRedirect ? `?redirect_to=${encodeURIComponent(safeRedirect)}` : ''}`}>
              Sign in
            </Link>
          </div>
          <div>
            <Link href="/learn" style={{ color: 'var(--text-muted)' }}>
              Continue as Guest (Local Storage) →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className={styles.authContainer}><p>Loading sign up…</p></div>}>
      <SignupForm />
    </Suspense>
  );
}
