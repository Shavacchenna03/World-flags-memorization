'use client';

import React, { useState } from 'react';
import styles from './FlagImage.module.css';
import { Country } from '../types/country';

export type FlagSize = 'sm' | 'md' | 'lg' | 'xl' | 'responsive';

export interface FlagImageProps {
  /**
   * Country object or minimal identifier subset.
   */
  country?: Pick<Country, 'code' | 'name' | 'flagAssetPath'> | null;

  /**
   * Directly specified asset path (e.g. '/flags/fr.svg').
   */
  flagAssetPath?: string;

  /**
   * Explicit country name for accessibility fallback.
   */
  countryName?: string;

  /**
   * ISO alpha-2 country code (e.g. 'FR').
   */
  countryCode?: string;

  /**
   * Custom accessible alternative text. Defaults to "Flag of [Country Name]".
   */
  alt?: string;

  /**
   * Display size variant. Defaults to 'md'.
   */
  size?: FlagSize;

  /**
   * Whether to display a subtle border for framing flags with white stripes/fields.
   */
  showBorder?: boolean;

  /**
   * Optional custom CSS class name for further layout positioning.
   */
  className?: string;
}

/**
 * Reusable, accessible Flag rendering component.
 *
 * Guarantees:
 * - Preserves native flag aspect ratios without distortion (object-fit: contain).
 * - Accessible aria-labels and descriptive alt text.
 * - Graceful local fallback on missing or failed assets.
 * - Never attempts remote network fallback calls.
 */
export function FlagImage({
  country,
  flagAssetPath,
  countryName,
  countryCode,
  alt,
  size = 'md',
  showBorder = true,
  className = '',
}: FlagImageProps) {
  const [loadError, setLoadError] = useState(false);

  const resolvedCode = countryCode || country?.code || '??';
  const resolvedName = countryName || country?.name || `Country (${resolvedCode})`;
  const resolvedPath = flagAssetPath || country?.flagAssetPath;
  const accessibleLabel = alt || `Flag of ${resolvedName}`;

  const sizeClass = {
    sm: styles.sizeSm,
    md: styles.sizeMd,
    lg: styles.sizeLg,
    xl: styles.sizeXl,
    responsive: styles.sizeResponsive,
  }[size] || styles.sizeMd;

  const containerClasses = [
    styles.flagContainer,
    sizeClass,
    showBorder ? styles.withBorder : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // If path is missing or failed to load, render accessible local fallback
  if (!resolvedPath || loadError) {
    return (
      <div
        className={containerClasses}
        role="img"
        aria-label={`${accessibleLabel} (image unavailable)`}
        title={`${resolvedName}: Asset unavailable`}
      >
        <div className={styles.fallbackContainer}>
          <span className={styles.fallbackCode}>{resolvedCode}</span>
          <span className={styles.fallbackNotice}>No flag</span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {/* Native img element loading bundled local SVG */}
      <img
        src={resolvedPath}
        alt={accessibleLabel}
        className={styles.flagImg}
        loading="lazy"
        onError={() => setLoadError(true)}
      />
    </div>
  );
}
