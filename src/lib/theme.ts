/**
 * Centralized Theme System for World Flags
 *
 * This is the SINGLE SOURCE OF TRUTH for design tokens, semantic colors, and active palettes.
 * To change or experiment with the application's visual theme:
 *   1. Change `ACTIVE_THEME_NAME` below to any registered palette name.
 *   2. Or add a new palette to `THEME_PALETTES`.
 *
 * All components across the application consume semantic CSS custom properties
 * (e.g. var(--bg-primary), var(--accent-primary), var(--border-divider)).
 */

export interface ColorTokens {
  // Surfaces & Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  surfaceElevated: string;
  surfaceHover: string;
  surfaceActive: string;

  // Typography
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textFaint: string;

  // Borders & Dividers
  borderSubtle: string;
  borderDivider: string;
  borderFocus: string;

  // Primary Accent
  accentPrimary: string;
  accentPrimaryHover: string;
  accentPrimarySubtle: string;
  accentPrimaryBorder: string;
  accentPrimaryContrast: string;

  // Secondary Accent
  accentSecondary: string;
  accentSecondarySubtle: string;
  accentSecondaryBorder: string;

  // Feedback States
  statusSuccess: string;
  statusSuccessSubtle: string;
  statusSuccessBorder: string;
  statusError: string;
  statusErrorSubtle: string;
  statusErrorBorder: string;
  statusWarning: string;
  statusWarningSubtle: string;

  // Hero Background Overlays
  heroOverlayCenter: string;
  heroOverlayEdge: string;
  heroBackdrop: string;
}

export interface TypographyTokens {
  fontSerif: string;
  fontSans: string;
  fontMono: string;
}

export interface GeometryTokens {
  radiusXs: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  shadowSubtle: string;
  shadowMedium: string;
  maxWidth: string;
}

export interface ThemeConfig {
  name: string;
  description: string;
  colors: ColorTokens;
  typography: TypographyTokens;
  geometry: GeometryTokens;
}

export const SHARED_TYPOGRAPHY: TypographyTokens = {
  fontSerif: '"Newsreader", "Charter", "Bitstream Charter", "Sitka Text", "Georgia", serif',
  fontSans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  fontMono: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace',
};

export const SHARED_GEOMETRY: GeometryTokens = {
  radiusXs: '3px',
  radiusSm: '4px',
  radiusMd: '6px',
  radiusLg: '8px',
  shadowSubtle: '0 1px 2px rgba(0, 0, 0, 0.25)',
  shadowMedium: '0 3px 10px rgba(0, 0, 0, 0.35)',
  maxWidth: '1040px',
};

export const THEME_PALETTES: Record<string, ThemeConfig> = {
  /**
   * Editorial Warm (Default)
   * Warm charcoal, natural muted olive, soft warm amber, and warm linen text.
   */
  'editorial-warm': {
    name: 'Editorial Warm',
    description: 'Literary atlas aesthetic with warm charcoal, linen text, and muted olive accents.',
    colors: {
      bgPrimary: '#171814',
      bgSecondary: '#1E1F19',
      surfaceElevated: '#25261F',
      surfaceHover: '#2B2C23',
      surfaceActive: '#32332A',

      textPrimary: '#EAE6DC',
      textSecondary: '#AAA99D',
      textMuted: '#828276',
      textFaint: '#5C5C52',

      borderSubtle: '#2D2E25',
      borderDivider: '#38392F',
      borderFocus: '#A6A77A',

      accentPrimary: '#A6A77A',
      accentPrimaryHover: '#B8B98B',
      accentPrimarySubtle: 'rgba(166, 167, 122, 0.12)',
      accentPrimaryBorder: 'rgba(166, 167, 122, 0.28)',
      accentPrimaryContrast: '#171814',

      accentSecondary: '#C5A574',
      accentSecondarySubtle: 'rgba(197, 165, 116, 0.12)',
      accentSecondaryBorder: 'rgba(197, 165, 116, 0.28)',

      statusSuccess: '#7DA383',
      statusSuccessSubtle: 'rgba(125, 163, 131, 0.14)',
      statusSuccessBorder: 'rgba(125, 163, 131, 0.35)',

      statusError: '#C26762',
      statusErrorSubtle: 'rgba(194, 103, 98, 0.14)',
      statusErrorBorder: 'rgba(194, 103, 98, 0.35)',

      statusWarning: '#C5A574',
      statusWarningSubtle: 'rgba(197, 165, 116, 0.12)',

      heroOverlayCenter: 'rgba(23, 24, 20, 0.76)',
      heroOverlayEdge: 'rgba(23, 24, 20, 0.38)',
      heroBackdrop: '#12130F',
    },
    typography: SHARED_TYPOGRAPHY,
    geometry: SHARED_GEOMETRY,
  },

  /**
   * Nordic Frost (Alternative Palette 1)
   * Deep obsidian slate, cool ice-steel accents, and crisp silver-white text.
   */
  'nordic-frost': {
    name: 'Nordic Frost',
    description: 'Crisp, quiet oceanic dark mode with cool steel accents.',
    colors: {
      bgPrimary: '#0E1116',
      bgSecondary: '#161B22',
      surfaceElevated: '#1F242C',
      surfaceHover: '#262D36',
      surfaceActive: '#2E3540',

      textPrimary: '#F0F3F6',
      textSecondary: '#A8B2C0',
      textMuted: '#6E7681',
      textFaint: '#484F58',

      borderSubtle: '#21262D',
      borderDivider: '#30363D',
      borderFocus: '#79C0FF',

      accentPrimary: '#79C0FF',
      accentPrimaryHover: '#A5D6FF',
      accentPrimarySubtle: 'rgba(121, 192, 255, 0.12)',
      accentPrimaryBorder: 'rgba(121, 192, 255, 0.28)',
      accentPrimaryContrast: '#0E1116',

      accentSecondary: '#D29922',
      accentSecondarySubtle: 'rgba(210, 153, 34, 0.12)',
      accentSecondaryBorder: 'rgba(210, 153, 34, 0.28)',

      statusSuccess: '#56D364',
      statusSuccessSubtle: 'rgba(86, 211, 100, 0.14)',
      statusSuccessBorder: 'rgba(86, 211, 100, 0.35)',

      statusError: '#F85149',
      statusErrorSubtle: 'rgba(248, 81, 73, 0.14)',
      statusErrorBorder: 'rgba(248, 81, 73, 0.35)',

      statusWarning: '#D29922',
      statusWarningSubtle: 'rgba(210, 153, 34, 0.12)',

      heroOverlayCenter: 'rgba(14, 17, 22, 0.76)',
      heroOverlayEdge: 'rgba(14, 17, 22, 0.38)',
      heroBackdrop: '#090B0E',
    },
    typography: SHARED_TYPOGRAPHY,
    geometry: SHARED_GEOMETRY,
  },

  /**
   * Monastic Terracotta (Alternative Palette 2)
   * Earth-black, warm terracotta stone, and parchment text.
   */
  'monastic-terracotta': {
    name: 'Monastic Terracotta',
    description: 'Earthy, contemplative palette with rich terracotta accents and parchment tones.',
    colors: {
      bgPrimary: '#1A1615',
      bgSecondary: '#221D1B',
      surfaceElevated: '#2B2523',
      surfaceHover: '#332D2A',
      surfaceActive: '#3C3431',

      textPrimary: '#F4ECE4',
      textSecondary: '#BDB1A8',
      textMuted: '#8C8077',
      textFaint: '#5E544D',

      borderSubtle: '#2F2724',
      borderDivider: '#3E3430',
      borderFocus: '#D47D68',

      accentPrimary: '#D47D68',
      accentPrimaryHover: '#E08E7A',
      accentPrimarySubtle: 'rgba(212, 125, 104, 0.14)',
      accentPrimaryBorder: 'rgba(212, 125, 104, 0.32)',
      accentPrimaryContrast: '#1A1615',

      accentSecondary: '#DCA265',
      accentSecondarySubtle: 'rgba(220, 162, 101, 0.14)',
      accentSecondaryBorder: 'rgba(220, 162, 101, 0.32)',

      statusSuccess: '#7E9F80',
      statusSuccessSubtle: 'rgba(126, 159, 128, 0.14)',
      statusSuccessBorder: 'rgba(126, 159, 128, 0.35)',

      statusError: '#D6655F',
      statusErrorSubtle: 'rgba(214, 101, 95, 0.14)',
      statusErrorBorder: 'rgba(214, 101, 95, 0.35)',

      statusWarning: '#DCA265',
      statusWarningSubtle: 'rgba(220, 162, 101, 0.14)',

      heroOverlayCenter: 'rgba(26, 22, 21, 0.76)',
      heroOverlayEdge: 'rgba(26, 22, 21, 0.38)',
      heroBackdrop: '#14100F',
    },
    typography: SHARED_TYPOGRAPHY,
    geometry: SHARED_GEOMETRY,
  },
};

/**
 * ACTIVE THEME SELECTION:
 * To switch the entire application's theme, change this variable name to:
 * - 'editorial-warm' (default)
 * - 'nordic-frost'
 * - 'monastic-terracotta'
 */
export const ACTIVE_THEME_NAME: keyof typeof THEME_PALETTES = 'editorial-warm';

/**
 * Returns the currently active theme configuration.
 */
export function getActiveTheme(): ThemeConfig {
  return THEME_PALETTES[ACTIVE_THEME_NAME] || THEME_PALETTES['editorial-warm'];
}

/**
 * Formats a ThemeConfig into a CSS string containing root CSS custom properties.
 * Exposes both the new semantic names and backwards-compatible aliases.
 */
export function generateThemeCssVariables(theme: ThemeConfig = getActiveTheme()): string {
  const { colors, typography, geometry } = theme;

  return `
    :root {
      /* Theme Name: ${theme.name} */
      --bg-primary: ${colors.bgPrimary};
      --bg-secondary: ${colors.bgSecondary};
      --surface-elevated: ${colors.surfaceElevated};
      --surface-hover: ${colors.surfaceHover};
      --surface-active: ${colors.surfaceActive};

      /* Backwards-compatible aliases */
      --bg-main: ${colors.bgPrimary};

      /* Typography Colors */
      --text-primary: ${colors.textPrimary};
      --text-secondary: ${colors.textSecondary};
      --text-muted: ${colors.textMuted};
      --text-faint: ${colors.textFaint};

      /* Borders & Dividers */
      --border-subtle: ${colors.borderSubtle};
      --border-divider: ${colors.borderDivider};
      --border-focus: ${colors.borderFocus};

      /* Semantic Primary Accent */
      --accent-primary: ${colors.accentPrimary};
      --accent-primary-hover: ${colors.accentPrimaryHover};
      --accent-primary-subtle: ${colors.accentPrimarySubtle};
      --accent-primary-border: ${colors.accentPrimaryBorder};
      --accent-primary-contrast: ${colors.accentPrimaryContrast};

      /* Backwards-compatible alias for existing components */
      --accent-olive: ${colors.accentPrimary};
      --accent-olive-hover: ${colors.accentPrimaryHover};
      --accent-olive-subtle: ${colors.accentPrimarySubtle};
      --accent-olive-border: ${colors.accentPrimaryBorder};

      /* Semantic Secondary Accent */
      --accent-secondary: ${colors.accentSecondary};
      --accent-secondary-subtle: ${colors.accentSecondarySubtle};
      --accent-secondary-border: ${colors.accentSecondaryBorder};
      --accent-amber: ${colors.accentSecondary};

      /* Feedback States */
      --status-success: ${colors.statusSuccess};
      --status-success-subtle: ${colors.statusSuccessSubtle};
      --status-success-border: ${colors.statusSuccessBorder};
      --status-correct: ${colors.statusSuccess};
      --status-correct-subtle: ${colors.statusSuccessSubtle};
      --status-correct-border: ${colors.statusSuccessBorder};

      --status-error: ${colors.statusError};
      --status-error-subtle: ${colors.statusErrorSubtle};
      --status-error-border: ${colors.statusErrorBorder};
      --status-incorrect: ${colors.statusError};
      --status-incorrect-subtle: ${colors.statusErrorSubtle};
      --status-incorrect-border: ${colors.statusErrorBorder};

      --status-warning: ${colors.statusWarning};
      --status-warning-subtle: ${colors.statusWarningSubtle};

      /* Hero Overlay Tokens */
      --hero-overlay-center: ${colors.heroOverlayCenter};
      --hero-overlay-edge: ${colors.heroOverlayEdge};
      --hero-backdrop: ${colors.heroBackdrop};

      /* Typography Stacks */
      --font-serif: ${typography.fontSerif};
      --font-sans: ${typography.fontSans};
      --font-mono: ${typography.fontMono};

      /* Radii & Geometry */
      --radius-xs: ${geometry.radiusXs};
      --radius-sm: ${geometry.radiusSm};
      --radius-md: ${geometry.radiusMd};
      --radius-lg: ${geometry.radiusLg};
      --shadow-subtle: ${geometry.shadowSubtle};
      --shadow-medium: ${geometry.shadowMedium};
      --max-width: ${geometry.maxWidth};
    }
  `;
}
