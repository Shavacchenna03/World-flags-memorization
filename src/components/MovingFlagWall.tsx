import React from 'react';
import styles from './MovingFlagWall.module.css';
import { Country } from '../types/country';

interface MovingFlagWallProps {
  countries: readonly Country[];
}

const COLUMN_COUNT = 9;

export function MovingFlagWall({ countries }: MovingFlagWallProps) {
  // Deterministically partition 195 countries across 9 vertical columns
  const columns: Country[][] = Array.from({ length: COLUMN_COUNT }, () => []);

  countries.forEach((country, index) => {
    columns[index % COLUMN_COUNT].push(country);
  });

  const columnClassNames = [
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
    <div className={styles.wallContainer} aria-hidden="true">
      <div className={styles.columnsTrack}>
        {columns.map((columnCountries, colIndex) => {
          // Triplicate items to guarantee continuous viewport coverage without top/bottom gaps
          const loopItems = [...columnCountries, ...columnCountries, ...columnCountries];
          const colClass = columnClassNames[colIndex] || '';

          return (
            <div key={colIndex} className={`${styles.column} ${colClass}`}>
              <div className={styles.columnInner}>
                {loopItems.map((country, itemIndex) => (
                  <div key={`${country.code}-${itemIndex}`} className={styles.flagItem}>
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
