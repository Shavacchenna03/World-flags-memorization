'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from '../auth.module.css';
import { createClient } from '../../lib/supabase/client';
import { getSupabaseConfig } from '../../lib/supabase/config';
import { validateEmail } from '../../lib/supabase/validation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const { isConfigured } = getSupabaseConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailVal = validateEmail(email);
    if (!emailVal.isValid) {
      setErrorMsg(emailVal.error || 'Invalid email');
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

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        // Log for debugging but avoid leaking account existence information to unauthenticated attackers
        console.error('[World Flags] Password reset error:', error.message);
      }

      // Neutral response to avoid user enumeration
      setSubmitted(true);
      setLoading(false);
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
          <h1 className={styles.authTitle}>Reset Password</h1>
          <p className={styles.authSubtitle}>
            Enter your email to receive a secure recovery link
          </p>
        </div>

        {!isConfigured && (
          <div className={styles.alertNotice}>
            <strong>Setup Notice:</strong> Supabase credentials are not defined in <code>.env.local</code>.
          </div>
        )}

        {errorMsg && <div className={styles.alertError}>{errorMsg}</div>}

        {submitted ? (
          <div className={styles.alertSuccess}>
            <p>
              If an account is associated with <strong>{email}</strong>, a recovery email has been sent.
              Please follow the instructions in the email to set a new password.
            </p>
            <div style={{ marginTop: '1.25rem' }}>
              <Link href="/login" className={styles.submitBtn} style={{ textDecoration: 'none' }}>
                Back to Sign In →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.authForm} noValidate>
            <div className={styles.formGroup}>
              <label htmlFor="forgot-email" className={styles.formLabel}>
                Account Email
              </label>
              <input
                id="forgot-email"
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

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
              id="forgot-submit-btn"
            >
              {loading ? 'Sending recovery link…' : 'Send Recovery Link →'}
            </button>
          </form>
        )}

        <div className={styles.authFooter}>
          <div>
            Remember your password? <Link href="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
