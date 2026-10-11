import { describe, it, expect } from 'vitest';
import {
  THEME_PALETTES,
  ACTIVE_THEME_NAME,
  getActiveTheme,
  generateThemeCssVariables,
  ColorTokens,
} from '../src/lib/theme';

describe('Centralized Theme System', () => {
  it('returns editorial-warm as the default active theme', () => {
    expect(ACTIVE_THEME_NAME).toBe('editorial-warm');
    const active = getActiveTheme();
    expect(active.name).toBe('Editorial Warm');
  });

  it('defines all required semantic color tokens across every registered palette', () => {
    const requiredColorKeys: (keyof ColorTokens)[] = [
      'bgPrimary',
      'bgSecondary',
      'surfaceElevated',
      'surfaceHover',
      'surfaceActive',
      'textPrimary',
      'textSecondary',
      'textMuted',
      'textFaint',
      'borderSubtle',
      'borderDivider',
      'borderFocus',
      'accentPrimary',
      'accentPrimaryHover',
      'accentPrimarySubtle',
      'accentPrimaryBorder',
      'accentPrimaryContrast',
      'accentSecondary',
      'accentSecondarySubtle',
      'accentSecondaryBorder',
      'statusSuccess',
      'statusSuccessSubtle',
      'statusSuccessBorder',
      'statusError',
      'statusErrorSubtle',
      'statusErrorBorder',
      'statusWarning',
      'statusWarningSubtle',
      'heroOverlayCenter',
      'heroOverlayEdge',
      'heroBackdrop',
    ];

    const themeIds = Object.keys(THEME_PALETTES) as (keyof typeof THEME_PALETTES)[];
    expect(themeIds.length).toBeGreaterThanOrEqual(3);

    for (const id of themeIds) {
      const theme = THEME_PALETTES[id];
      expect(theme.name).toBeTruthy();
      expect(theme.description).toBeTruthy();

      for (const key of requiredColorKeys) {
        expect(theme.colors[key], `Theme ${id} missing color token: ${key}`).toBeDefined();
        expect(typeof theme.colors[key]).toBe('string');
        expect(theme.colors[key].length).toBeGreaterThan(0);
      }
    }
  });

  it('generates well-formed CSS custom properties string', () => {
    const theme = getActiveTheme();
    const cssVars = generateThemeCssVariables(theme);

    expect(cssVars).toContain('--bg-primary:');
    expect(cssVars).toContain('--accent-primary:');
    expect(cssVars).toContain('--text-primary:');
    expect(cssVars).toContain('--border-divider:');
    expect(cssVars).toContain('--hero-overlay-center:');
    expect(cssVars).toContain('--font-sans:');
    expect(cssVars).toContain('--font-serif:');
    expect(cssVars).toContain('--max-width:');
  });

  it('provides distinct palettes for experimentation', () => {
    const warm = THEME_PALETTES['editorial-warm'];
    const frost = THEME_PALETTES['nordic-frost'];
    const terracotta = THEME_PALETTES['monastic-terracotta'];

    expect(warm.colors.accentPrimary).not.toBe(frost.colors.accentPrimary);
    expect(warm.colors.accentPrimary).not.toBe(terracotta.colors.accentPrimary);
    expect(warm.colors.bgPrimary).not.toBe(frost.colors.bgPrimary);
  });
});
