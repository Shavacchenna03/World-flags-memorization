'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

export function Header() {
  const pathname = usePathname();
  const isLanding = pathname === '/';

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
            <Link href="/learn" className={styles.navLinkActive}>
              Workspace →
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
