// ═══════════════════════════════════════════════════════════════
// AtysPro — animations.ts
// Transitions, durées, easings, keyframes
// ═══════════════════════════════════════════════════════════════

// ─── DURÉES ─────────────────────────────────────────────────────
export const duration = {
  instant:  50,   // feedback immédiat (press state)
  fast:     100,  // micro-interactions (hover bg)
  normal:   150,  // transitions standard (couleur, opacity)
  medium:   200,  // transitions composants (slide, scale)
  slow:     300,  // transitions de page, skin switch
  slower:   500,  // animations d'entrée (slide-up cards)
  lazy:     800,  // score circle fill animation
} as const

// ─── EASINGS ────────────────────────────────────────────────────
export const easing = {
  // Standard
  linear:     'linear',
  easeIn:     'cubic-bezier(0.4, 0, 1, 1)',
  easeOut:    'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut:  'cubic-bezier(0.4, 0, 0.2, 1)',

  // Ressort léger (hover lift, boutons)
  spring:     'cubic-bezier(0.34, 1.56, 0.64, 1)',

  // Smooth (skin switch, color transitions)
  smooth:     'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
} as const

// ─── TRANSITIONS PRÉDÉFINIES (web) ──────────────────────────────
export const transition = {
  // Couleurs (skin switch — tous les éléments colorés)
  color:     `color ${duration.slow}ms ${easing.smooth}, background-color ${duration.slow}ms ${easing.smooth}, border-color ${duration.slow}ms ${easing.smooth}`,

  // Hover standard
  hover:     `background ${duration.fast}ms ${easing.easeOut}, opacity ${duration.fast}ms ${easing.easeOut}`,

  // Élévation (hover lift sur cards)
  elevation: `box-shadow ${duration.medium}ms ${easing.easeOut}, transform ${duration.medium}ms ${easing.easeOut}`,

  // Transform (boutons, nav items)
  transform: `transform ${duration.normal}ms ${easing.spring}`,

  // Input focus
  focus:     `border-color ${duration.normal}ms ${easing.easeOut}, box-shadow ${duration.normal}ms ${easing.easeOut}`,

  // All (skin switch global)
  all:       `all ${duration.slow}ms ${easing.smooth}`,

  // Score circle
  score:     `stroke-dashoffset ${duration.lazy}ms ${easing.easeInOut}`,
} as const

// ─── KEYFRAMES CSS (web) ────────────────────────────────────────
// À injecter dans le CSS global ou un <style> tag

export const keyframes = {
  // Entrée des cards (page load)
  slideUp: `
    @keyframes ap-slide-up {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `,

  // Entrée des rows de table
  rowIn: `
    @keyframes ap-row-in {
      from { opacity: 0; transform: translateX(-6px); }
      to   { opacity: 1; transform: translateX(0); }
    }
  `,

  // Fade simple
  fadeIn: `
    @keyframes ap-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  `,

  // Entrée depuis le haut (left panel auth)
  fadeDown: `
    @keyframes ap-fade-down {
      from { opacity: 0; transform: translateY(-12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `,

  // Entrée depuis le bas (form auth)
  fadeUp: `
    @keyframes ap-fade-up {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `,

  // Pulsation badge urgence
  pulseBadge: `
    @keyframes ap-pulse-badge {
      0%, 100% { box-shadow: 0 1px 4px rgba(220,38,38,0.5); }
      50%       { box-shadow: 0 1px 8px rgba(220,38,38,0.8); }
    }
  `,

  // Pulsation dot (eyebrow auth)
  pulseDot: `
    @keyframes ap-pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.6; transform: scale(0.8); }
    }
  `,

  // Spinner loading (bouton submit auth)
  spin: `
    @keyframes ap-spin {
      to { transform: translateY(-50%) rotate(360deg); }
    }
  `,

  // Grille drift (auth background)
  gridDrift: `
    @keyframes ap-grid-drift {
      from { transform: translate(0, 0); }
      to   { transform: translate(48px, 48px); }
    }
  `,

  // Orbs flottants (auth background)
  orbFloat: `
    @keyframes ap-orb-float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33%       { transform: translate(20px, -20px) scale(1.05); }
      66%       { transform: translate(-10px, 15px) scale(0.97); }
    }
  `,
} as const

// ─── ANIMATIONS PRÉDÉFINIES ──────────────────────────────────────
// format: `keyframe-name duration easing delay fill-mode`

export const animation = {
  // Page load — cards KPI (stagger via nth-child delay)
  slideUpFast:   `ap-slide-up ${duration.slower}ms ${easing.easeOut} both`,
  slideUpCard1:  `ap-slide-up ${duration.slower}ms ${easing.easeOut} 50ms both`,
  slideUpCard2:  `ap-slide-up ${duration.slower}ms ${easing.easeOut} 100ms both`,
  slideUpCard3:  `ap-slide-up ${duration.slower}ms ${easing.easeOut} 150ms both`,
  slideUpCard4:  `ap-slide-up ${duration.slower}ms ${easing.easeOut} 200ms both`,
  slideUpTable:  `ap-slide-up ${duration.slower}ms ${easing.easeOut} 250ms both`,

  // Rows table
  rowIn1: `ap-row-in 350ms ${easing.easeOut} 300ms both`,
  rowIn2: `ap-row-in 350ms ${easing.easeOut} 360ms both`,
  rowIn3: `ap-row-in 350ms ${easing.easeOut} 420ms both`,
  rowIn4: `ap-row-in 350ms ${easing.easeOut} 480ms both`,
  rowIn5: `ap-row-in 350ms ${easing.easeOut} 540ms both`,
  rowIn6: `ap-row-in 350ms ${easing.easeOut} 600ms both`,

  // Auth
  fadeDown:  `ap-fade-down ${duration.slower}ms ${easing.easeOut} both`,
  fadeUp:    `ap-fade-up ${duration.slower}ms ${easing.easeOut} 150ms both`,
  fadeIn:    `ap-fade-in ${duration.slower}ms ${easing.easeOut} both`,

  // Looping
  pulseBadge: `ap-pulse-badge 2s ${easing.easeInOut} infinite`,
  pulseDot:   `ap-pulse-dot 2s ${easing.easeInOut} infinite`,
  spin:       `ap-spin 0.7s linear infinite`,
  gridDrift:  `ap-grid-drift 20s linear infinite`,
  orbFloat1:  `ap-orb-float 8s ${easing.easeInOut} infinite`,
  orbFloat2:  `ap-orb-float 11s ${easing.easeInOut} infinite reverse`,
  orbFloat3:  `ap-orb-float 7s ${easing.easeInOut} 2s infinite`,
} as const

// ─── REACT NATIVE ────────────────────────────────────────────────
// RN utilise Animated API — on exporte les configs de base

export const rnAnimation = {
  // Durées identiques
  duration,
  easing,

  // Configs spring pour Animated.spring
  springConfig: {
    gentle: { tension: 120, friction: 14 },
    bouncy: { tension: 180, friction: 12 },
    stiff:  { tension: 300, friction: 20 },
  },

  // Configs timing pour Animated.timing
  timingConfig: {
    fast:   { duration: duration.fast,   useNativeDriver: true },
    normal: { duration: duration.normal, useNativeDriver: true },
    slow:   { duration: duration.slow,   useNativeDriver: true },
  },
} as const
