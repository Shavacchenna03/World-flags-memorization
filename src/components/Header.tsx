'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Header.module.css';
import { VexiferLogo } from './VexiferLogo';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConfigured } = getSupabaseConfig();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

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
    setMobileMenuOpen(false);
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
        <Link
          href={isLanding ? '/' : '/learn'}
          className={styles.brand}
          aria-label="Vexifer Home"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className={styles.brandLogo} aria-hidden="true">
            <VexiferLogo size={26} />
          </span>
          <span className={styles.brandName}>Vexifer</span>
          <span className={styles.brandScope}>195 Nations</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav} aria-label="Main Navigation">
          {isLanding ? (
            <div className={styles.authNavGroup}>
              {user ? (
                <>
                  <span className={styles.userBadge} title={user.email}>
                    <span className={styles.userDot} aria-hidden="true" />
                    <span className={styles.userNameTruncate}>{displayName}</span>
                  </span>
                  <Link href="/learn" className={styles.navLinkActive}>
                    Workspace →
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className={styles.navLink}>
                    Sign In
                  </Link>
                  <Link href="/learn" className={styles.navLinkActive}>
                    Workspace →
                  </Link>
                </>
              )}
            </div>
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
                    <span className={styles.userNameTruncate}>{displayName}</span>
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

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          className={styles.mobileMenuToggle}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation-drawer"
        >
          <span
            className={`${styles.hamburgerIcon} ${mobileMenuOpen ? styles.hamburgerOpen : ''}`}
            aria-hidden="true"
          >
            <span className={styles.bar} />
            <span className={styles.bar} />
            <span className={styles.bar} />
          </span>
        </button>
      </div>

      {/* Mobile Navigation Drawer & Backdrop */}
      {mobileMenuOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        id="mobile-navigation-drawer"
        className={`${styles.mobileDrawer} ${mobileMenuOpen ? styles.mobileDrawerOpen : ''}`}
        aria-hidden={!mobileMenuOpen}
      >
        <div className={styles.mobileDrawerInner}>
          {user && (
            <div className={styles.mobileUserSection}>
              <div className={styles.mobileUserRow}>
                <span className={styles.userDot} aria-hidden="true" />
                <div className={styles.mobileUserDetails}>
                  <span className={styles.mobileUserName}>{displayName}</span>
                  {user.email && <span className={styles.mobileUserEmail}>{user.email}</span>}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className={styles.mobileLogoutBtn}
                id="mobile-header-logout-btn"
              >
                Sign Out
              </button>
            </div>
          )}

          <nav className={styles.mobileNavLinks} aria-label="Mobile Navigation Links">
            {isLanding ? (
              <>
                <Link
                  href="/learn"
                  className={`${styles.mobileNavLink} ${styles.mobilePrimaryAction}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Open Flag Workspace</span>
                  <span aria-hidden="true">→</span>
                </Link>
                {!user && (
                  <Link
                    href="/login"
                    className={styles.mobileNavLink}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>Sign In</span>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/learn"
                  className={`${styles.mobileNavLink} ${pathname === '/learn' ? styles.mobileNavLinkActive : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className={styles.mobileLinkIndicator} aria-hidden="true">
                    {pathname === '/learn' ? '●' : '○'}
                  </span>
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/learn/explorer"
                  className={`${styles.mobileNavLink} ${pathname === '/learn/explorer' ? styles.mobileNavLinkActive : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className={styles.mobileLinkIndicator} aria-hidden="true">
                    {pathname === '/learn/explorer' ? '●' : '○'}
                  </span>
                  <span>Flag Explorer</span>
                </Link>

                {!user && !isAuthPage && (
                  <Link
                    href="/login"
                    className={styles.mobileNavLink}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className={styles.mobileLinkIndicator} aria-hidden="true">○</span>
                    <span>Sign In</span>
                  </Link>
                )}

                <div className={styles.mobileDrawerDivider} />

                <Link
                  href="/"
                  className={`${styles.mobileNavLink} ${styles.mobileExitLink}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>← Exit to Entrance</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
