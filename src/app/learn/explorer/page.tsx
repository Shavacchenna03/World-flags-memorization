import React from 'react';
import Link from 'next/link';
import { getAllCountries } from '../../../lib/countries';
import { FlagExplorer } from '../../../components/FlagExplorer';

export const metadata = {
  title: 'Flag Explorer — World Flags',
  description: 'Searchable country registry and reference library of all 195 sovereign state flags.',
};

export default function ExplorerPage() {
  const allCountries = getAllCountries();

  return (
    <div className="container" style={{ padding: '2.5rem 0 5rem' }}>
      <div style={{ marginBottom: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        <Link href="/learn" style={{ color: 'var(--brand-primary)' }}>
          ← Dashboard
        </Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span>Flag Explorer</span>
      </div>

      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Flag Explorer
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Reference library of all 195 sovereign countries with native SVG vector flags and ISO metadata.
        </p>
      </header>

      <FlagExplorer countries={allCountries} />
    </div>
  );
}
