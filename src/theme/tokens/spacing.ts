// ═══════════════════════════════════════════════════════════════
// AtysPro — spacing.ts
// Espacements, border-radius, dimensions fixes
// ═══════════════════════════════════════════════════════════════

// ─── SPACING SCALE ──────────────────────────────────────────────
// Base 4px — tous les espacements sont multiples de 4
export const spacing = {
  0:    0,
  0.5:  2,
  1:    4,
  1.5:  6,
  2:    8,
  2.5:  10,
  3:    12,
  3.5:  14,
  4:    16,
  5:    20,
  6:    24,
  7:    28,
  8:    32,
  10:   40,
  12:   48,
  14:   56,
  16:   64,
  20:   80,
  24:   96,
} as const

// ─── BORDER RADIUS ──────────────────────────────────────────────
export const radius = {
  none:  0,
  xs:    4,   // badges, pills internes
  sm:    6,   // petits éléments (nav badge, icon box sm)
  md:    8,   // inputs, boutons secondaires, nav items
  lg:    10,  // cards secondaires, topbar elements
  xl:    12,  // cards principales
  '2xl': 14,  // app shell, table card
  '3xl': 16,  // modal, auth card
  full:  9999, // pills, badges ronds
} as const

// ─── DIMENSIONS FIXES ───────────────────────────────────────────
export const sizes = {
  // Sidebar
  sidebarWidth:      220,
  sidebarWidthMobile: 0, // hidden sur mobile

  // Topbar
  topbarHeight:      64,

  // Icônes métier (icon box)
  iconBoxXs:  20,  // dans table, topbar pill
  iconBoxSm:  24,  // dans topbar title row
  iconBoxMd:  32,  // sidebar logo, feature icons
  iconBoxLg:  38,  // feature icons auth
  iconBoxXl:  44,  // grandes icônes

  // Score circle
  scoreCircleSm: 28, // dans sidebar, mobile
  scoreCircleMd: 36, // dans table leads
  scoreCircleLg: 48, // dans fiche lead mobile

  // Logo icon
  logoIconSm: 27,  // mobile header
  logoIconMd: 32,  // sidebar dashboard
  logoIconLg: 36,  // auth panneau gauche

  // Boutons
  btnHeightSm: 28,
  btnHeightMd: 36,
  btnHeightLg: 44,

  // Inputs
  inputHeightSm: 32,
  inputHeightMd: 38,
  inputHeightLg: 44,

  // Nav badge (chiffre rouge)
  navBadgeHeight: 18,
  navBadgeMinWidth: 20,
} as const

// ─── PADDING PAR COMPOSANT ──────────────────────────────────────
export const componentPadding = {
  // Cards
  cardSm:    { vertical: 12, horizontal: 14 },
  cardMd:    { vertical: 16, horizontal: 20 },
  cardLg:    { vertical: 20, horizontal: 24 },

  // Boutons
  btnSm:     { vertical: 5,  horizontal: 10 },
  btnMd:     { vertical: 8,  horizontal: 14 },
  btnLg:     { vertical: 11, horizontal: 18 },

  // Inputs
  inputMd:   { vertical: 9,  horizontal: 12 },
  inputLg:   { vertical: 11, horizontal: 14 },

  // Badges
  badgeSm:   { vertical: 2,  horizontal: 7  },
  badgeMd:   { vertical: 3,  horizontal: 9  },

  // Table cells
  tableCell: { vertical: 13, horizontal: 14 },
  tableHeader:{ vertical: 9, horizontal: 14 },

  // Toolbar (search + filters row)
  toolbar:   { vertical: 14, horizontal: 18 },

  // Page content
  pageContent: { vertical: 22, horizontal: 28 },

  // Sidebar nav item
  navItem:   { vertical: 9,  horizontal: 11 },

  // Sidebar sections
  sidebarTop:    { vertical: 22, horizontal: 18 },
  sidebarFooter: { vertical: 14, horizontal: 14 },

  // Auth panels
  authPanel: { vertical: 44, horizontal: 52 },
  authForm:  { vertical: 48, horizontal: 48 },
} as const

// ─── GAPS (flex/grid gap) ───────────────────────────────────────
export const gap = {
  xs:  4,
  sm:  6,
  md:  8,
  lg:  10,
  xl:  12,
  '2xl': 14,
  '3xl': 16,
  '4xl': 20,
  '5xl': 24,
} as const

// ─── BORDER WIDTHS ──────────────────────────────────────────────
export const borderWidth = {
  hairline: 0.5, // borders UI subtiles (cards, inputs par défaut)
  thin:     1,   // borders normales, focus rings
  medium:   1.5, // inputs focus, featured card
  thick:    2,   // indicateurs actifs, accent bars
  heavy:    3,   // score circles stroke-width
} as const

// ─── Z-INDEX ────────────────────────────────────────────────────
export const zIndex = {
  base:    0,
  raised:  10,
  dropdown: 100,
  sticky:  200,
  overlay: 300,
  modal:   400,
  toast:   500,
} as const
