// ═══════════════════════════════════════════════════════════════
// AtysPro — skins/theme.config.ts
// Définitions des skins métier
// Override uniquement les tokens qui varient par métier
// ═══════════════════════════════════════════════════════════════

export type Skin = 'core' | 'electricien' | 'plombier' | 'serrurier' | 'immo' | 'admin'

export interface SkinConfig {
  // Identité
  metierLabel: string   // affiché dans le badge sidebar + topbar pill
  metierSlug:  string   // identifiant URL-safe

  // Accent color (override de primary)
  accent:       string  // --ap-primary
  accentHover:  string  // --ap-primary-hover
  accentLight:  string  // --ap-primary-light (fond badges, pills)
  accentBorder: string  // --ap-primary-border (border badges)

  // Icône métier SVG (viewBox "0 0 24 24", fill solid)
  icon: {
    path:    string     // d= du path SVG
    viewBox: string
  } | null              // null = Core (pas d'icône métier)

  // Wording adapté par métier
  wording: {
    pageSub:      string  // sous-titre page leads
    typeLabel:    string  // en-tête colonne type/délai
    kpiLeads:     string  // label KPI 1
    kpiUrgent:    string  // label KPI 2
    kpiDeltaUrgent: string
    ctaCall:      string  // bouton principal appel
    ctaTreated:   string  // bouton marquer traité
  }
}

// ─── SVG PATHS (viewBox 0 0 24 24, fill solid) ──────────────────

const ICON_PATHS = {
  // Éclair outline — Électricien
  eclair:   'M13 2L4.5 13.5H11L9 22L19.5 10H13L15 2H13Z',

  // Goutte d'eau — Plombier
  goutte:   'M12 3C12 3 5 10.5 5 15a7 7 0 0014 0C19 10.5 12 3 12 3Z',

  // Cadenas fermé — Serrurier
  cadenas:  'M8 11V8a4 4 0 018 0v3H5a1 1 0 00-1 1v8a2 2 0 002 2h12a2 2 0 002-2v-8a1 1 0 00-1-1H8z',

  // Maison — Agent immobilier
  maison:   'M12 3L2 12h3v9h6v-5h2v5h6v-9h3L12 3z',
} as const

// ─── SKINS ──────────────────────────────────────────────────────

export const SKINS: Record<Skin, SkinConfig> = {

  // ── Core — défaut (aucun métier ou métier non couvert) ────────
  core: {
    metierLabel:  '',
    metierSlug:   'core',
    accent:       '#1A56DB',
    accentHover:  '#1648C0',
    accentLight:  '#EBF2FF',
    accentBorder: '#BFDBFE',
    icon: null,
    wording: {
      pageSub:         "Vos prospects qualifiés par l'assistant vocal",
      typeLabel:       'Type / Délai',
      kpiLeads:        'Leads reçus',
      kpiUrgent:       'Haute priorité',
      kpiDeltaUrgent:  'Action requise',
      ctaCall:         'Appeler',
      ctaTreated:      'Marquer comme traité',
    },
  },

  // ── Électricien ───────────────────────────────────────────────
  electricien: {
    metierLabel:  'Électricien',
    metierSlug:   'electricien',
    accent:       '#EA6C00',
    accentHover:  '#D16200',
    accentLight:  '#FFF4E6',
    accentBorder: '#FFD8A8',
    icon: {
      path:    ICON_PATHS.eclair,
      viewBox: '0 0 24 24',
    },
    wording: {
      pageSub:         "Vos demandes d'intervention qualifiées",
      typeLabel:       'Intervention / Urgence',
      kpiLeads:        'Demandes reçues',
      kpiUrgent:       'Urgences',
      kpiDeltaUrgent:  'Rappel immédiat',
      ctaCall:         'Rappeler le client',
      ctaTreated:      'Intervention traitée',
    },
  },

  // ── Plombier ──────────────────────────────────────────────────
  plombier: {
    metierLabel:  'Plombier',
    metierSlug:   'plombier',
    accent:       '#2563EB',
    accentHover:  '#1D4ED8',
    accentLight:  '#EFF6FF',
    accentBorder: '#BFDBFE',
    icon: {
      path:    ICON_PATHS.goutte,
      viewBox: '0 0 24 24',
    },
    wording: {
      pageSub:         "Vos demandes d'intervention qualifiées",
      typeLabel:       'Intervention / Urgence',
      kpiLeads:        'Demandes reçues',
      kpiUrgent:       'Urgences',
      kpiDeltaUrgent:  'Rappel immédiat',
      ctaCall:         'Rappeler le client',
      ctaTreated:      'Intervention traitée',
    },
  },

  // ── Serrurier ─────────────────────────────────────────────────
  serrurier: {
    metierLabel:  'Serrurier',
    metierSlug:   'serrurier',
    accent:       '#475569',
    accentHover:  '#334155',
    accentLight:  '#F1F5F9',
    accentBorder: '#CBD5E1',
    icon: {
      path:    ICON_PATHS.cadenas,
      viewBox: '0 0 24 24',
    },
    wording: {
      pageSub:         "Vos demandes d'intervention qualifiées",
      typeLabel:       'Intervention / Urgence',
      kpiLeads:        'Demandes reçues',
      kpiUrgent:       'Urgences',
      kpiDeltaUrgent:  'Rappel immédiat',
      ctaCall:         'Rappeler le client',
      ctaTreated:      'Intervention traitée',
    },
  },

  // ── Agent immobilier ──────────────────────────────────────────
  immo: {
    metierLabel:  'Agent immobilier',
    metierSlug:   'immo',
    accent:       '#0D9488',
    accentHover:  '#0A7A70',
    accentLight:  '#F0FDFA',
    accentBorder: '#99F6E4',
    icon: {
      path:    ICON_PATHS.maison,
      viewBox: '0 0 24 24',
    },
    wording: {
      pageSub:         "Vos contacts qualifiés par l'assistant vocal",
      typeLabel:       'Type de bien / Projet',
      kpiLeads:        'Contacts reçus',
      kpiUrgent:       'Prospects chauds',
      kpiDeltaUrgent:  'À recontacter',
      ctaCall:         'Contacter le prospect',
      ctaTreated:      'Contact traité',
    },
  },

  // ── Admin ─────────────────────────────────────────────────────
  admin: {
    metierLabel:  'Admin',
    metierSlug:   'admin',
    accent:       '#1A56DB',
    accentHover:  '#1648C0',
    accentLight:  '#EBF2FF',
    accentBorder: '#BFDBFE',
    icon: null,
    wording: {
      pageSub:         "Vue d'ensemble de la plateforme",
      typeLabel:       'Type / Délai',
      kpiLeads:        'Leads reçus',
      kpiUrgent:       'Haute priorité',
      kpiDeltaUrgent:  'Action requise',
      ctaCall:         'Appeler',
      ctaTreated:      'Marquer comme traité',
    },
  },
}

// ─── MAPPING MÉTIER → SKIN ──────────────────────────────────────
// Utilisé à l'onboarding : profile.metier → skin appliqué

export const METIER_TO_SKIN: Record<string, Skin> = {
  // Artisans — skins dédiés
  electricien:  'electricien',
  plombier:     'plombier',
  serrurier:    'serrurier',

  // Artisans — core en attendant leur skin
  chauffagiste: 'core',
  menuisier:    'core',
  peintre:      'core',
  carreleur:    'core',
  macon:        'core',
  paysagiste:   'core',

  // Immo
  immo:         'immo',
  agent_immo:   'immo',
  promoteur:    'immo',

  // Autres
  avocat:       'core',
  comptable:    'core',
  kine:         'core',
  coach:        'core',
  autre:        'core',
  admin:        'admin',
} as const

// ─── UTILS ──────────────────────────────────────────────────────

/** Récupère la config skin depuis un slug métier */
export function getSkinConfig(metier: string): SkinConfig {
  const skinKey = METIER_TO_SKIN[metier] ?? 'core'
  return SKINS[skinKey]
}

/**
 * Applique un skin sur le document web (CSS variables)
 * À appeler après login ou changement de profil
 */
export function applySkin(skin: Skin): void {
  const config = SKINS[skin]
  const root = document.documentElement.style

  root.setProperty('--ap-primary',        config.accent)
  root.setProperty('--ap-primary-hover',  config.accentHover)
  root.setProperty('--ap-primary-light',  config.accentLight)
  root.setProperty('--ap-primary-border', config.accentBorder)

  localStorage.setItem('atyspro-skin', skin)
}

/** Restaure le skin sauvegardé au chargement de l'app */
export function restoreSkin(): void {
  const saved = localStorage.getItem('atyspro-skin') as Skin | null
  if (saved && SKINS[saved]) applySkin(saved)
}

/**
 * Retourne les props de style pour l'icon box métier
 * Compatible web (style object) et React Native
 */
export function getIconBoxStyle(skin: Skin, size = 24) {
  const { accent } = SKINS[skin]
  const r = parseInt(accent.slice(1, 3), 16)
  const g = parseInt(accent.slice(3, 5), 16)
  const b = parseInt(accent.slice(5, 7), 16)

  return {
    backgroundColor: `rgba(${r},${g},${b},0.14)`,
    borderColor:     `rgba(${r},${g},${b},0.28)`,
    borderWidth:     1,
    width:  size,
    height: size,
  }
}
