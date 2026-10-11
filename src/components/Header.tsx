'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Header.module.css';
import { createClient } from '../lib/supabase/client';
import { getSupabaseConfig } from '../lib/supabase/config';
import type { User } from '@supabase/supabase-js';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isLanding = pathname === '/';
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  const [user, setUser] = useState<User | null>(null);
  const { isConfigured } = getSupabaseConfig();

  useEffect(() => {
    if (!isConfigured) return;

    const supabase = createClient();

    // Load initial user state
    supabase.auth.getUser().then((response) => {
      setUser(response.data.user);
    });

    // Subscribe to auth state updates (login, logout, session refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: unknown, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Learner';

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href={isLanding ? '/' : '/learn'} className={styles.brand} aria-label="World Flags">
          <span className={styles.brandMark} aria-hidden="true">✦</span>
          <span>World Flags</span>
          <span className={styles.brandScope}>195 Nations</span>
        </Link>

        <nav className={styles.nav} aria-label="Main Navigation">
          {isLanding ? (
            <>
              {user ? (
                <div className={styles.authNavGroup}>
                  <span className={styles.userBadge} title={user.email}>
                    <span className={styles.userDot} aria-hidden="true" />
                    <span>{displayName}</span>
                  </span>
                  <Link href="/learn" className={styles.navLinkActive}>
                    Workspace →
                  </Link>
                </div>
              ) : (
                <div className={styles.authNavGroup}>
                  <Link href="/login" className={styles.navLink}>
                    Sign In
                  </Link>
                  <Link href="/learn" className={styles.navLinkActive}>
                    Workspace →
                  </Link>
                </div>
              )}
            </>
          ) : (
            <>
              <Link
                href="/learn"
                className={`${styles.navLink} ${pathname === '/learn' ? styles.navLinkActive : ''}`}
              >
                Dashboard
              </Link>
              <Link
                href="/learn/explorer"
                className={`${styles.navLink} ${pathname === '/learn/explorer' ? styles.navLinkActive : ''}`}
              >
                Flag Explorer
              </Link>

              {user ? (
                <div className={styles.authNavGroup}>
                  <span className={styles.userBadge} title={user.email}>
                    <span className={styles.userDot} aria-hidden="true" />
                    <span>{displayName}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className={styles.logoutBtn}
                    title="Log out of account"
                    id="header-logout-btn"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                !isAuthPage && (
                  <div className={styles.authNavGroup}>
                    <Link href="/login" className={styles.navLink}>
                      Sign In
                    </Link>
                  </div>
                )
              )}

              <Link href="/" className={`${styles.navLink} ${styles.exitLink}`} title="Back to entrance">
                Exit
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
