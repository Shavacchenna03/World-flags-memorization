'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../auth.module.css';
import { createClient } from '../../lib/supabase/client';
import { getSupabaseConfig } from '../../lib/supabase/config';
import { validateEmail, validatePassword } from '../../lib/supabase/validation';
import { sanitizeRedirectUrl } from '../../lib/supabase/redirect';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect_to') || searchParams.get('next');
  const safeRedirect = sanitizeRedirectUrl(rawRedirect, '/learn');
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    urlError === 'auth-code-error' || urlError === 'auth-callback-failed'
      ? 'Authentication link expired or invalid. Please sign in again.'
      : null
  );

  const { isConfigured } = getSupabaseConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

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

    if (!isConfigured) {
      setErrorMsg(
        'Supabase credentials are not configured yet. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.'
      );
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message || 'Failed to sign in. Please check your credentials.');
        setLoading(false);
        return;
      }

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
          <h1 className={styles.authTitle}>Sign In</h1>
          <p className={styles.authSubtitle}>
            Access your synchronized flag learning progress
          </p>
        </div>

        {!isConfigured && (
          <div className={styles.alertNotice}>
            <strong>Setup Notice:</strong> Supabase credentials are not defined in <code>.env.local</code>.
            Copy <code>.env.example</code> to <code>.env.local</code> to activate live cloud authentication.
          </div>
        )}

        {errorMsg && <div className={styles.alertError}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="login-email" className={styles.formLabel}>
              Email Address
            </label>
            <input
              id="login-email"
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label htmlFor="login-password" className={styles.formLabel}>
                Password
              </label>
              <Link href="/forgot-password" className={styles.inlineLink}>
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.formInput}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
            id="login-submit-btn"
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div className={styles.authFooter}>
          <div>
            Don&apos;t have an account?{' '}
            <Link href={`/signup${rawRedirect ? `?redirect_to=${encodeURIComponent(safeRedirect)}` : ''}`}>
              Create one
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={styles.authContainer}><p>Loading sign in…</p></div>}>
      <LoginForm />
    </Suspense>
  );
}
