// ═══════════════════════════════════════════════════════════════
// AtysPro — colors.ts
// Toutes les valeurs de couleur brutes du design system
// Ne pas modifier ces valeurs — utiliser les skins pour les overrides
// ═══════════════════════════════════════════════════════════════

// ─── PRIMARY (Bleu électrique — couleur de marque) ─────────────
export const primary = {
  50:  '#EBF2FF',
  100: '#BFDBFE',
  200: '#93C5FD',
  300: '#60A5FA',
  400: '#3B82F6',
  500: '#1A56DB', // ← PRIMARY DEFAULT
  600: '#1648C0',
  700: '#1239A0',
  800: '#0D1B38', // ← NAVY (sidebar)
  900: '#080F1F',
} as const

// ─── NEUTRALS (Gris système) ────────────────────────────────────
export const neutral = {
  0:   '#FFFFFF',
  50:  '#F7F8FA', // fond app
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#0F172A', // texte principal
} as const

// ─── SEMANTIC ───────────────────────────────────────────────────

export const danger = {
  50:  '#FEF2F2',
  100: '#FECACA',
  200: '#FCA5A5',
  400: '#F87171',
  500: '#DC2626', // ← DEFAULT
  600: '#B91C1C',
  700: '#991B1B',
} as const

export const success = {
  50:  '#F0FDF4',
  100: '#BBF7D0',
  200: '#6EE7B7',
  400: '#34D399',
  500: '#16A34A', // ← DEFAULT
  600: '#15803D',
  700: '#166534',
} as const

export const warning = {
  50:  '#FFFBEB',
  100: '#FDE68A',
  200: '#FCD34D',
  400: '#FBBF24',
  500: '#D97706', // ← DEFAULT
  600: '#B45309',
  700: '#92400E',
} as const

export const info = {
  50:  '#EFF6FF',
  100: '#BFDBFE',
  500: '#1A56DB',
} as const

// ─── SKIN ACCENTS (couleurs métier) ────────────────────────────

export const skinAccents = {
  // Core — bleu électrique AtysPro
  core: {
    500: '#1A56DB',
    600: '#1648C0',
    light: '#EBF2FF',
    border: '#BFDBFE',
  },
  // Électricien — orange ambre
  electricien: {
    500: '#EA6C00',
    600: '#D16200',
    light: '#FFF4E6',
    border: '#FFD8A8',
  },
  // Plombier — bleu eau
  plombier: {
    500: '#2563EB',
    600: '#1D4ED8',
    light: '#EFF6FF',
    border: '#BFDBFE',
  },
  // Serrurier — ardoise acier
  serrurier: {
    500: '#475569',
    600: '#334155',
    light: '#F1F5F9',
    border: '#CBD5E1',
  },
  // Agent immobilier — teal premium
  immo: {
    500: '#0D9488',
    600: '#0A7A70',
    light: '#F0FDFA',
    border: '#99F6E4',
  },
} as const

// ─── SIDEBAR ────────────────────────────────────────────────────
export const sidebar = {
  bg:          '#0D1B38',
  bgHover:     'rgba(255,255,255,0.04)',
  border:      'rgba(255,255,255,0.06)',
  text:        '#3D5A80',
  textHover:   '#8BA0C0',
  textActive:  '#FFFFFF',
  userBg:      'rgba(255,255,255,0.03)',
  userBorder:  'rgba(255,255,255,0.06)',
} as const

// ─── SURFACE ────────────────────────────────────────────────────
export const surface = {
  app:     '#F0F2F7', // fond général
  page:    '#F7F8FA', // fond page légèrement plus clair
  card:    '#FFFFFF', // cards
  input:   '#F3F4F6', // input background
  overlay: 'rgba(15,23,42,0.5)',
} as const

// ─── BORDER ─────────────────────────────────────────────────────
export const border = {
  subtle:   '#E5E7EB', // border par défaut
  default:  '#D1D5DB', // border légèrement visible
  strong:   '#9CA3AF', // border focus/hover
  focus:    '#1A56DB', // focus ring color
} as const

// ─── TEXT ────────────────────────────────────────────────────────
export const text = {
  primary:   '#0F172A', // texte principal
  secondary: '#4B5563', // texte secondaire
  tertiary:  '#6B7280', // texte muted
  disabled:  '#9CA3AF', // texte désactivé
  inverse:   '#FFFFFF', // texte sur fond sombre
  link:      '#1A56DB', // liens
} as const

// ─── SCORE COLORS (dégradé selon le score /100) ─────────────────
export const scoreColors = {
  high:   '#DC2626', // 70-100 — urgent/critique
  medium: '#1A56DB', // 40-69  — normal
  low:    '#D97706', // 20-39  — faible
  zero:   '#D1D5DB', // 0-19   — vide/inconnu
} as const

// ─── WHATSAPP (couleur native) ───────────────────────────────────
export const whatsapp = {
  500: '#25D366',
  600: '#1FB859',
} as const
