import React from 'react';
import styles from './MovingFlagWall.module.css';
import { Country } from '../types/country';

interface MovingFlagWallProps {
  countries: readonly Country[];
  forceMotion?: boolean;
}

export interface ColumnConfiguration {
  id: number;
  direction: 'up' | 'down';
  durationSeconds: number;
  delaySeconds: number;
  opacity: number;
}

/**
 * Centralized column animation configuration:
 * - Asynchronous durations (34s - 46s) for visible, stately, continuous editorial movement
 * - Staggered negative delays so columns start at varying offsets upon page load
 * - Alternating vertical directions (up / down) creating dynamic parallax
 * - Calibrated opacities (0.52 - 0.70) ensuring foreground text readability
 */
export const COLUMN_CONFIGURATIONS: readonly ColumnConfiguration[] = [
  { id: 0, direction: 'down', durationSeconds: 44, delaySeconds: -14, opacity: 0.55 },
  { id: 1, direction: 'up',   durationSeconds: 36, delaySeconds: -22, opacity: 0.65 },
  { id: 2, direction: 'down', durationSeconds: 40, delaySeconds: -8,  opacity: 0.68 },
  { id: 3, direction: 'up',   durationSeconds: 34, delaySeconds: -18, opacity: 0.60 },
  { id: 4, direction: 'down', durationSeconds: 46, delaySeconds: -10, opacity: 0.52 },
  { id: 5, direction: 'up',   durationSeconds: 38, delaySeconds: -24, opacity: 0.65 },
  { id: 6, direction: 'down', durationSeconds: 42, delaySeconds: -6,  opacity: 0.70 },
  { id: 7, direction: 'up',   durationSeconds: 40, delaySeconds: -16, opacity: 0.60 },
  { id: 8, direction: 'down', durationSeconds: 38, delaySeconds: -4,  opacity: 0.55 },
];

export function MovingFlagWall({ countries, forceMotion = false }: MovingFlagWallProps) {
  const columnCount = COLUMN_CONFIGURATIONS.length;

  // Deterministically partition 195 countries across configured vertical columns
  const columns: Country[][] = Array.from({ length: columnCount }, () => []);
  countries.forEach((country, index) => {
    columns[index % columnCount].push(country);
  });

  const columnResponsiveClasses = [
    styles.col0,
    styles.col1,
    styles.col2,
    styles.col3,
    styles.col4,
    styles.col5,
    styles.col6,
    styles.col7,
    styles.col8,
  ];

  return (
    <div
      className={styles.wallContainer}
      aria-hidden="true"
      data-force-motion={forceMotion ? 'true' : undefined}
    >
      <div className={styles.columnsTrack}>
        {columns.map((columnCountries, colIndex) => {
          const config = COLUMN_CONFIGURATIONS[colIndex];
          const directionClass =
            config.direction === 'up' ? styles.trackUp : styles.trackDown;
          const responsiveClass = columnResponsiveClasses[colIndex] || '';

          const colStyle = {
            '--col-duration': `${config.durationSeconds}s`,
            '--col-delay': `${config.delaySeconds}s`,
            '--col-opacity': config.opacity,
          } as React.CSSProperties;

          return (
            <div
              key={config.id}
              className={`${styles.column} ${responsiveClass}`}
              style={colStyle}
            >
              {/* Animated Track: owns the transform animation exclusively */}
              <div className={`${styles.track} ${directionClass}`}>
                {/* Sequence 1: First complete set of flags */}
                <div className={styles.sequence}>
                  {columnCountries.map((country, itemIndex) => (
                    <div key={`s1-${country.code}-${itemIndex}`} className={styles.flagItem}>
                      <img
                        src={country.flagAssetPath}
                        alt=""
                        decoding="async"
                        draggable="false"
                      />
                    </div>
                  ))}
                </div>

                {/* Sequence 2: Identical duplicate for mathematically seamless 50% translation loop */}
                <div className={styles.sequence} aria-hidden="true">
                  {columnCountries.map((country, itemIndex) => (
                    <div key={`s2-${country.code}-${itemIndex}`} className={styles.flagItem}>
                      <img
                        src={country.flagAssetPath}
                        alt=""
                        decoding="async"
                        draggable="false"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Central tonal radial darkening for maximum foreground text readability */}
      <div className={styles.centerRadialOverlay} />

      {/* Top and bottom edge vignette fade */}
      <div className={styles.edgeVignetteOverlay} />
    </div>
  );
}
