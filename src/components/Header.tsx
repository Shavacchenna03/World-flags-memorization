'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

export function Header() {
  const pathname = usePathname();

  // On the minimal landing page root, show a very subtle header or logo
  const isLanding = pathname === '/';

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href={isLanding ? '/' : '/learn'} className={styles.brand} aria-label="World Flags">
          <span className={styles.logoIcon} aria-hidden="true">🌐</span>
          <span>World Flags</span>
          <span className={styles.brandBadge}>195</span>
        </Link>

        <nav className={styles.nav} aria-label="Workspace Navigation">
          {isLanding ? (
            <Link href="/learn" className={styles.navLinkActive}>
              Enter Workspace →
            </Link>
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
              <Link href="/" className={styles.navLink} title="Exit to landing page">
                Home
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
