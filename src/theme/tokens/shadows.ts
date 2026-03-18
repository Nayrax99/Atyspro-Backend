// ═══════════════════════════════════════════════════════════════
// AtysPro — shadows.ts
// Système d'élévation à 5 niveaux
// Compatible web (box-shadow string) + React Native (shadow props)
// ═══════════════════════════════════════════════════════════════

// ─── WEB (box-shadow strings) ───────────────────────────────────
export const shadows = {
  // Niveau 0 — pas d'ombre (défaut cards, inputs)
  none: 'none',

  // Niveau 1 — ombre très subtile (cards au repos)
  xs: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',

  // Niveau 2 — ombre légère (cards au hover)
  sm: '0 2px 8px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.04)',

  // Niveau 3 — ombre moyenne (dropdowns, popovers)
  md: '0 4px 16px rgba(15,23,42,0.10), 0 8px 32px rgba(15,23,42,0.06)',

  // Niveau 4 — ombre forte (modals, auth card)
  lg: '0 8px 32px rgba(15,23,42,0.14), 0 16px 64px rgba(15,23,42,0.08)',

  // Niveau 5 — ombre très forte (app shell en démo)
  xl: '0 24px 80px rgba(0,0,0,0.5)',

  // Focus rings (par couleur)
  focusDefault:     '0 0 0 3px rgba(26,86,219,0.15)',
  focusElectricien: '0 0 0 3px rgba(234,108,0,0.15)',
  focusPlombier:    '0 0 0 3px rgba(37,99,235,0.15)',
  focusSerrurier:   '0 0 0 3px rgba(71,85,105,0.15)',
  focusImmo:        '0 0 0 3px rgba(13,148,136,0.15)',

  // Logo icon glow (sidebar)
  logoGlow:    '0 0 0 4px rgba(26,86,219,0.18)',
  logoGlowHover: '0 0 0 6px rgba(26,86,219,0.22)',

  // Nav item active
  navActive: '0 2px 8px rgba(26,86,219,0.35)',

  // Bouton primary
  btnPrimary:      '0 2px 8px rgba(26,86,219,0.3)',
  btnPrimaryHover: '0 4px 16px rgba(26,86,219,0.4)',

  // Score badge (pulsation)
  scoreBadge: '0 1px 4px rgba(220,38,38,0.5)',
  scoreBadgeActive: '0 1px 8px rgba(220,38,38,0.8)',
} as const

// ─── REACT NATIVE (shadow props) ────────────────────────────────
// React Native ne supporte pas box-shadow — on utilise les props natifs
// + elevation pour Android

export const shadowsNative = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  xs: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },

  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },

  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },

  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 16,
  },
} as const
