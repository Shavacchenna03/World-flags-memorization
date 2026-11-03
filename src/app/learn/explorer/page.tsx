import React from 'react';
import Link from 'next/link';
import { getAllCountries } from '../../../lib/countries';
import { FlagExplorer } from '../../../components/FlagExplorer';

export const metadata = {
  title: 'Flag Explorer — Vexifer',
  description: 'Searchable country registry and reference library of all 195 sovereign state flags.',
};

export default function ExplorerPage() {
  const allCountries = getAllCountries();

  return (
    <div
      className="container"
      style={{
        paddingTop: 'clamp(1.5rem, 4vh, 2.5rem)',
        paddingBottom: 'clamp(3rem, 6vh, 5rem)',
      }}
    >
      <div style={{ marginBottom: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <Link href="/learn" style={{ color: 'var(--text-secondary)', minHeight: '32px', display: 'inline-flex', alignItems: 'center' }}>
          ← Dashboard
        </Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span>Flag Explorer</span>
      </div>

      <header
        style={{
          marginBottom: '1.75rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-divider)',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
            fontWeight: 500,
            color: 'var(--text-primary)',
            letterSpacing: '-0.015em',
            lineHeight: 1.2,
          }}
        >
          Flag Explorer
        </h1>
        <p style={{ fontSize: 'clamp(0.8125rem, 2vw, 0.875rem)', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
          Reference library of all 195 sovereign countries with native SVG vector flags and ISO metadata.
        </p>
      </header>

      <FlagExplorer countries={allCountries} />
    </div>
  );
}
