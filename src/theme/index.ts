// ═══════════════════════════════════════════════════════════════
// AtysPro — theme/index.ts
// Point d'entrée unique du design system
//
// Usage :
//   import { colors, spacing, SKINS, applySkin } from '@/theme'
//   import type { Skin } from '@/theme'
// ═══════════════════════════════════════════════════════════════

// ─── TOKENS ─────────────────────────────────────────────────────
export {
  primary,
  neutral,
  danger,
  success,
  warning,
  info,
  skinAccents,
  sidebar,
  surface,
  border,
  text,
  scoreColors,
  whatsapp,
} from './tokens/colors'

export {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  textStyles,
} from './tokens/typography'

export {
  spacing,
  radius,
  sizes,
  componentPadding,
  gap,
  borderWidth,
  zIndex,
} from './tokens/spacing'

export {
  shadows,
  shadowsNative,
} from './tokens/shadows'

export {
  duration,
  easing,
  transition,
  keyframes,
  animation,
  rnAnimation,
} from './tokens/animations'

export {
  button,
  badge,
  card,
  input,
  table,
  scoreCircle,
  navItem,
  select,
  topbar,
  sidebarUser,
} from './tokens/components'

// ─── SKINS ──────────────────────────────────────────────────────
export {
  SKINS,
  METIER_TO_SKIN,
  getSkinConfig,
  applySkin,
  restoreSkin,
  getIconBoxStyle,
} from './skins/theme.config'

export type { Skin, SkinConfig } from './skins/theme.config'

// ─── CONVENIENCE — objet global pour accès rapide ───────────────
// import { theme } from '@/theme'
// theme.colors.primary[500]
// theme.spacing[4]

import * as colors from './tokens/colors'
import * as typography from './tokens/typography'
import * as _spacing from './tokens/spacing'
import * as _shadows from './tokens/shadows'
import * as _animations from './tokens/animations'
import * as components from './tokens/components'
import { SKINS as _SKINS, METIER_TO_SKIN as _M2S } from './skins/theme.config'

export const theme = {
  colors,
  typography,
  spacing: _spacing,
  shadows: _shadows,
  animations: _animations,
  components,
  skins: _SKINS,
  metierToSkin: _M2S,
} as const
