// ═══════════════════════════════════════════════════════════════
// AtysPro — typography.ts
// ═══════════════════════════════════════════════════════════════

// ─── FONT FAMILIES ──────────────────────────────────────────────
export const fontFamily = {
  // Dashboard web + landing page
  sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  // Mobile Expo
  sansNative: 'PlusJakartaSans',
  // Code / tokens (usage interne)
  mono: "'DM Mono', 'Fira Code', monospace",
} as const

// ─── FONT WEIGHTS ───────────────────────────────────────────────
export const fontWeight = {
  regular:   400,
  medium:    500,
  semibold:  600,
  bold:      700,
  extrabold: 800,
} as const

// ─── FONT SIZES ─────────────────────────────────────────────────
// Système à 10 niveaux, compatible web (px) + RN (unitless)
export const fontSize = {
  '2xs': 9,   // labels uppercase très petits (nav badge)
  xs:    10,  // labels uppercase (kpi label, table header)
  sm:    11,  // metadata, dates, badges
  base:  12,  // texte secondaire, sous-titres
  md:    13,  // texte courant UI (table cells, nav items)
  lg:    14,  // texte principal contenu
  xl:    16,  // logo, sous-titres importants
  '2xl': 18,  // titres de section
  '3xl': 22,  // page title (topbar)
  '4xl': 28,  // grands chiffres (score fiche lead)
  '5xl': 32,  // KPI cards valeurs
  '6xl': 42,  // headline auth/landing
} as const

// ─── LINE HEIGHTS ───────────────────────────────────────────────
export const lineHeight = {
  tight:   1.1,  // headlines, grands titres
  snug:    1.25, // titres de section
  normal:  1.5,  // texte courant
  relaxed: 1.65, // corps de texte long, descriptions
  loose:   1.8,  // texte légal, footnotes
} as const

// ─── LETTER SPACING ─────────────────────────────────────────────
export const letterSpacing = {
  tighter: '-0.05em', // headlines h1
  tight:   '-0.03em', // titres de page
  snug:    '-0.02em', // sous-titres
  normal:  '0em',     // texte courant
  wide:    '0.05em',  // badges
  wider:   '0.08em',  // labels uppercase
  widest:  '0.12em',  // labels uppercase petits
} as const

// ─── STYLES PRÉDÉFINIS (combinaisons) ───────────────────────────
// Utiliser ces styles dans les composants pour la cohérence

export const textStyles = {
  // Headings
  h1: {
    fontSize: fontSize['6xl'],
    fontWeight: fontWeight.extrabold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tighter,
  },
  h2: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.extrabold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.snug,
  },
  h4: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.snug,
  },

  // Page title (topbar dashboard)
  pageTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.extrabold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },

  // KPI value
  kpiValue: {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.extrabold,
    lineHeight: 1,
    letterSpacing: letterSpacing.tighter,
  },

  // Score large (fiche lead)
  scoreLarge: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.extrabold,
    lineHeight: 1,
    letterSpacing: letterSpacing.tighter,
  },

  // Body
  bodyLg: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // UI Labels
  label: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  labelUppercase: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },
  labelUppercaseSm: {
    fontSize: fontSize['2xs'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase' as const,
  },

  // Table
  tableHeader: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase' as const,
  },
  tableCell: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
  },
  tableCellBold: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
  },

  // Nav
  navItem: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
  },
  navItemActive: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
  },

  // Badge
  badge: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase' as const,
  },
} as const
