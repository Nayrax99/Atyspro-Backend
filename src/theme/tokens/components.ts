// ═══════════════════════════════════════════════════════════════
// AtysPro — components.ts
// Tokens par composant — ce fichier fait le lien entre les tokens
// bruts (colors, spacing...) et les composants UI concrets
// ═══════════════════════════════════════════════════════════════

import { neutral, primary, danger, success, warning, sidebar, surface, border, text, scoreColors } from './colors'
import { radius, spacing, sizes, borderWidth } from './spacing'
import { fontWeight, fontSize, letterSpacing } from './typography'

// ─── BUTTON ─────────────────────────────────────────────────────
export const button = {
  primary: {
    bg:          primary[500],
    bgHover:     primary[600],
    bgActive:    primary[700],
    text:        '#FFFFFF',
    borderRadius: radius.md,
    fontWeight:  fontWeight.semibold,
    fontSize:    fontSize.md,
    paddingV:    spacing[2],
    paddingH:    spacing[3.5],
    height:      sizes.btnHeightMd,
  },
  dark: {
    bg:          neutral[900],
    bgHover:     neutral[800],
    text:        '#FFFFFF',
    borderRadius: radius.md,
    fontWeight:  fontWeight.semibold,
    fontSize:    fontSize.md,
  },
  ghost: {
    bg:          surface.card,
    bgHover:     surface.input,
    text:        text.secondary,
    border:      border.subtle,
    borderWidth: borderWidth.hairline,
    borderRadius: radius.md,
    fontWeight:  fontWeight.medium,
    fontSize:    fontSize.md,
  },
  whatsapp: {
    bg:          '#25D366',
    bgHover:     '#1FB859',
    text:        '#FFFFFF',
    borderRadius: radius.md,
    fontWeight:  fontWeight.semibold,
    fontSize:    fontSize.md,
  },
  success: {
    bg:          success[500],
    bgHover:     success[600],
    text:        '#FFFFFF',
    borderRadius: radius.md,
    fontWeight:  fontWeight.semibold,
    fontSize:    fontSize.md,
  },
  sizes: {
    sm: { height: sizes.btnHeightSm, paddingH: spacing[2.5], fontSize: fontSize.base },
    md: { height: sizes.btnHeightMd, paddingH: spacing[3.5], fontSize: fontSize.md },
    lg: { height: sizes.btnHeightLg, paddingH: spacing[4],   fontSize: fontSize.lg },
  },
} as const

// ─── BADGE / STATUS ─────────────────────────────────────────────
export const badge = {
  // Statuts leads
  aTraiter: {
    // couleurs overridées par le skin accent — voir theme.config.ts
    fontWeight:   fontWeight.bold,
    fontSize:     fontSize.xs,
    letterSpacing: letterSpacing.wide,
    borderRadius: radius.xs,
    paddingV:     spacing[0.5],
    paddingH:     spacing[2],
    textTransform: 'uppercase' as const,
  },
  incomplet: {
    bg:           neutral[100],
    text:         neutral[500],
    border:       neutral[300],
    fontWeight:   fontWeight.bold,
    fontSize:     fontSize.xs,
    letterSpacing: letterSpacing.wide,
    borderRadius: radius.xs,
    paddingV:     spacing[0.5],
    paddingH:     spacing[2],
    textTransform: 'uppercase' as const,
  },
  traite: {
    bg:           success[50],
    text:         success[500],
    border:       success[100],
    fontWeight:   fontWeight.bold,
    fontSize:     fontSize.xs,
    letterSpacing: letterSpacing.wide,
    borderRadius: radius.xs,
  },
  urgent: {
    bg:           danger[50],
    text:         danger[500],
    border:       danger[100],
    fontWeight:   fontWeight.bold,
    fontSize:     fontSize.xs,
    letterSpacing: letterSpacing.wide,
    borderRadius: radius.xs,
  },
  relance: {
    bg:           warning[50],
    text:         warning[600],
    border:       warning[100],
    fontWeight:   fontWeight.semibold,
    fontSize:     fontSize.xs,
    borderRadius: radius.xs,
  },
  // Badge métier (sidebar footer)
  metier: {
    // couleurs dynamiques via skin
    fontWeight:   fontWeight.bold,
    fontSize:     fontSize.sm,
    letterSpacing: letterSpacing.normal,
    borderRadius: radius.xs,
    paddingV:     spacing[0.5] + spacing[0.5], // 4px
    paddingH:     spacing[2],
    gap:          spacing[1],
  },
  // Nav badge (chiffre rouge leads)
  nav: {
    bg:          danger[500],
    text:        '#FFFFFF',
    fontWeight:  fontWeight.bold,
    fontSize:    fontSize['2xs'],
    borderRadius: radius.full,
    paddingV:    spacing[0.5],
    paddingH:    spacing[1.5],
    minWidth:    sizes.navBadgeMinWidth,
    height:      sizes.navBadgeHeight,
  },
} as const

// ─── CARD ────────────────────────────────────────────────────────
export const card = {
  default: {
    bg:           surface.card,
    border:       border.subtle,
    borderWidth:  borderWidth.hairline,
    borderRadius: radius['2xl'],
    padding:      { v: spacing[5], h: spacing[5] },
  },
  kpi: {
    bg:           surface.card,
    border:       border.subtle,
    borderWidth:  borderWidth.hairline,
    borderRadius: radius['2xl'],
    padding:      { v: spacing[4] + spacing[0.5], h: spacing[5] },
    accentBarHeight: 3,
    accentBarWidth:  24,
    accentBarRadius: 2,
  },
  section: {
    bg:           surface.card,
    border:       border.subtle,
    borderWidth:  borderWidth.hairline,
    borderRadius: radius.xl,
    padding:      { v: spacing[5], h: spacing[6] },
  },
} as const

// ─── INPUT ───────────────────────────────────────────────────────
export const input = {
  bg:             surface.card,
  bgFocus:        '#FAFCFF',
  bgDefault:      surface.input,
  border:         border.subtle,
  borderFocus:    primary[500],
  borderHover:    border.default,
  borderWidth:    borderWidth.thin,
  borderWidthFocus: borderWidth.medium,
  borderRadius:   radius.lg,
  fontSize:       fontSize.lg,
  color:          text.primary,
  colorPlaceholder: neutral[300],
  height:         sizes.inputHeightMd,
  paddingV:       spacing[2.5],
  paddingH:       spacing[3],
  // Focus ring (box-shadow)
  focusRingWidth: 4,
  focusRingAlpha: 0.15,
} as const

// ─── TABLE ───────────────────────────────────────────────────────
export const table = {
  header: {
    bg:          surface.input,
    borderBottom: border.subtle,
    fontSize:    fontSize.xs,
    fontWeight:  fontWeight.bold,
    color:       text.disabled,
    letterSpacing: letterSpacing.wider,
    textTransform: 'uppercase' as const,
    paddingV:    spacing[2.5] - spacing[0.5],
    paddingH:    spacing[3.5],
  },
  row: {
    borderBottom: border.subtle,
    paddingV:    spacing[3] + spacing[0.5],
    paddingH:    spacing[3.5],
    bgHover:     '#F8FAFE',
    transition:  'background 0.12s ease',
  },
  footer: {
    bg:          surface.input,
    borderTop:   border.subtle,
    paddingV:    spacing[3] - spacing[0.5],
    paddingH:    spacing[4] + spacing[0.5],
  },
} as const

// ─── SCORE CIRCLE ────────────────────────────────────────────────
export const scoreCircle = {
  // Taille medium (table leads)
  md: {
    size:        sizes.scoreCircleMd,
    strokeWidth: 3,
    radius:      15,
    circumference: 94.25, // 2 * π * 15
  },
  // Taille large (fiche lead)
  lg: {
    size:        sizes.scoreCircleLg,
    strokeWidth: 4,
    radius:      20,
    circumference: 125.66, // 2 * π * 20
  },
  // Couleurs par niveau
  colors: scoreColors,
  // Seuils
  thresholds: {
    high:   70, // rouge
    medium: 40, // bleu accent
    low:    20, // ambre
    zero:   0,  // gris
  },
} as const

// ─── NAV ITEM ────────────────────────────────────────────────────
export const navItem = {
  default: {
    color:       sidebar.text,
    bg:          'transparent',
    borderRadius: radius.lg,
    paddingV:    spacing[2.5] - spacing[0.5],
    paddingH:    spacing[2.5] + spacing[0.5],
    fontSize:    fontSize.md,
    fontWeight:  fontWeight.medium,
    gap:         spacing[2.5],
    iconSize:    15,
  },
  hover: {
    color:       sidebar.textHover,
    bg:          sidebar.bgHover,
  },
  active: {
    color:       sidebar.textActive,
    // bg est overridé par le skin accent (gradient)
    fontWeight:  fontWeight.semibold,
    // Indicateur latéral gauche
    indicatorWidth:  3,
    indicatorHeight: 20,
    indicatorRadius: '0 3px 3px 0',
    indicatorOffset: -10,
  },
} as const

// ─── SELECT ──────────────────────────────────────────────────────
export const select = {
  bg:           surface.card,
  border:       border.default,
  borderRadius: radius.md,
  fontSize:     fontSize.md,
  color:        text.primary,
  paddingV:     spacing[1.5] + spacing[0.5],
  paddingH:     spacing[2.5],
  paddingRight: spacing[7], // espace pour la flèche
} as const

// ─── TOPBAR ──────────────────────────────────────────────────────
export const topbar = {
  bg:           surface.card,
  border:       border.subtle,
  height:       sizes.topbarHeight,
  paddingH:     spacing[7],
  // Pill métier
  metierPill: {
    borderRadius: radius.full,
    fontSize:    fontSize.sm,
    fontWeight:  fontWeight.bold,
    paddingV:    spacing[0.5] + spacing[0.5],
    paddingH:    spacing[2.5],
    gap:         spacing[1.5],
    iconSize:    10,
  },
  // Icon box (à côté du titre)
  iconBox: {
    size:        sizes.iconBoxSm,
    borderRadius: radius.sm,
    iconSize:    14,
  },
} as const

// ─── SIDEBAR USER BLOCK ──────────────────────────────────────────
export const sidebarUser = {
  bg:           sidebar.userBg,
  border:       sidebar.userBorder,
  borderRadius: radius.lg,
  paddingV:     spacing[2.5],
  paddingH:     spacing[3],
  nameSize:     fontSize.md,
  nameWeight:   fontWeight.semibold,
  nameColor:    '#C8D8F0',
  emailSize:    fontSize.sm,
  emailColor:   '#2D4060',
  // Badge métier
  badge: {
    marginTop:    spacing[2],
    borderRadius: radius.xs,
    paddingV:     spacing[1],
    paddingH:     spacing[2],
    fontSize:     fontSize.sm,
    fontWeight:   fontWeight.bold,
    iconSize:     11,
    gap:          spacing[1],
  },
} as const
