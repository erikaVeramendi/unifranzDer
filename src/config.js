/**
 * Configuración centralizada de ultra-baja latencia (60 FPS Zero-Lag) para:
 * "UNIFRANZ AR Mirror Experience — Derecho"
 * Evento: INAUGURACIÓN NUEVA MALLA CURRICULAR
 * Carrera Oficial: DERECHO — UNIFRANZ
 *
 * Menciones Oficiales de la Nueva Malla:
 *  - Mención 1: Legal Tech y Gobernanza Digital
 *  - Mención 2: Justicia Penal Digital
 */

export const AR_CONFIG = {
  // === 1. CÁMARA Y TRACKING DE ULTRA BAJA LATENCIA (60 FPS ZERO LAG) ===
  CAMERA_IDEAL_WIDTH: 854,
  CAMERA_IDEAL_HEIGHT: 480,
  CAMERA_IDEAL_FPS: 60,

  // === 2. SOPORTE MULTI-ROSTRO Y MANOS (SOLO CÁMARA REAL EN VIVO, SIN SEGMENTACIÓN) ===
  MAX_PERSONS: 2,
  MAX_HANDS: 4,
  FACE_DETECTION_CONFIDENCE: 0.35,
  FACE_PRESENCE_CONFIDENCE: 0.35,
  FACE_TRACKING_CONFIDENCE: 0.35,
  PERSON_TIMEOUT_MS: 450,
  HAND_TIMEOUT_MS: 260,
  BODY_TRACK_MAX_DIST_NORM: 0.28,
  HAND_TRACK_MAX_DIST_NORM: 0.25,

  // === 3. FAST LERP = 0.70 (RESPUESTA INSTANTÁNEA EN ROSTRO Y MANOS) ===
  FAST_LERP_FACE: 0.70,
  FAST_LERP_HAND: 0.70,

  // === 4. ACCESORIOS FACIALES JURÍDICOS ===
  GLASSES_WIDTH_FACTOR: 2.08,
  MAX_ROLL_RAD: 0.65,

  // === 5. SUPERPODERES INTERACTIVOS DE DERECHO ===
  GAVEL_STRIKE_VELOCITY_THRESHOLD: 13.0, // Velocidad vertical (px/frame) hacia abajo para golpear mazo
  GAVEL_COOLDOWN_MS: 1100, // Cooldown entre golpes de mazo ("¡CASO CERRADO!")
  VERDICT_DURATION_MS: 2700, // Duración del sello holográfico gigante en pantalla
  SCALE_BALANCE_THRESHOLD_RAD: 0.085, // Umbral de equilibrio para destello naranja en la Balanza
  BOOK_FADE_DURATION_MS: 300,

  // === 6. MINIJUEGO AR: "¿QUÉ MENCIÓN DE DERECHO ES TU VOCACIÓN?" ===
  QUIZ_HEAD_TILT_THRESHOLD_RAD: 0.115,
  QUIZ_FILL_DURATION_MS: 1350,
};

export const OFFICIAL_EVENT_TITLE = 'INAUGURACIÓN NUEVA MALLA CURRICULAR';
export const OFFICIAL_CAREER_SUBTITLE = 'DERECHO — UNIFRANZ';

// Perfil Profesional Oficial (Tarjeta HUD lateral discreta al detectar persona)
export const OFFICIAL_PROFESSIONAL_PROFILE = {
  title: 'PERFIL PROFESIONAL UNIFRANZ',
  text: 'Innovador y global: integra análisis jurídico, mediación de conflictos y defensa de derechos humanos con LegalTech e innovación legal.',
};

// Títulos Exactos de las 2 Menciones Oficiales de la Nueva Malla
export const OFFICIAL_MENTIONS = {
  LEGALTECH: 'Legal Tech y Gobernanza Digital',
  PENAL_DIGITAL: 'Justicia Penal Digital',
};

// Microcredenciales Oficiales de la Nueva Malla de Derecho
export const OFFICIAL_MICROCREDENTIALS = [
  'Compliance Corporativo',
  'Derecho de la Propiedad Intelectual',
  'Métodos Alternativos de Solución de Controversias',
  'Derecho de los Recursos Naturales',
  'Gestión de Impactos Ambientales',
  'Protección Jurídica de Grupos Vulnerables',
];

// Microcredenciales y áreas que emergen del Código Jurídico Holográfico abierto (🖐️🖐️ Ambas Manos Abiertas)
export const FLOATING_CODE_MICROCREDENTIALS = [
  {
    code: 'MICROCREDENCIAL I',
    title: 'Compliance Corporativo',
    subtitle: 'Legal Tech y Gobernanza Digital',
  },
  {
    code: 'MICROCREDENCIAL II',
    title: 'Propiedad Intelectual',
    subtitle: 'Derecho de la Propiedad Intelectual',
  },
  {
    code: 'INNOVACIÓN LEGAL III',
    title: 'Blockchain y Criptoactivos',
    subtitle: 'Smart Contracts & Gobernanza Digital',
  },
  {
    code: 'JUSTICIA DIGITAL IV',
    title: 'Criminología Digital',
    subtitle: 'Justicia Penal Digital & Evidencia Forense',
  },
  {
    code: 'MICROCREDENCIAL V',
    title: 'Mediación de Conflictos',
    subtitle: 'Métodos Alternativos de Solución de Controversias',
  },
];

// 3 Modos de Accesorios Faciales Jurídicos (Dibujados 100% por Código en Canvas)
export const ACCESSORY_MODES = [
  {
    id: 'HUD_GLASSES',
    label: '🕶️ Lentes HUD LegalTech',
    shortLabel: 'Lentes HUD LegalTech',
    hudGlasses: true,
    laurels: false,
    biometricScanner: false,
  },
  {
    id: 'LAURELS',
    label: '👑 Laureles Digitales de la Justicia',
    shortLabel: 'Laureles de la Justicia',
    hudGlasses: false,
    laurels: true,
    biometricScanner: false,
  },
  {
    id: 'LEGAL_LEADER',
    label: '⚖️ Modo Líder Jurídico (Ambos)',
    shortLabel: 'Modo Líder Jurídico',
    hudGlasses: true,
    laurels: true,
    biometricScanner: true,
  },
];

// 5. Órbita Jurídica (8 Badges Vectoriales Flotantes a Color representando las áreas reales de la nueva malla)
export const LEGAL_ORBIT_ITEMS = [
  {
    id: 'LegalTechGobernanza',
    name: 'LEGAL TECH',
    fullName: '⚖️ Legal Tech y Gobernanza Digital',
    badgeSubtitle: 'GOBERNANZA DIGITAL',
    tag: 'LEGALTECH',
    primaryColor: '#FF6B00',
    secondaryColor: '#FFFFFF',
    iconType: 'SCALES_TECH',
  },
  {
    id: 'JusticiaPenalDigital',
    name: 'JUSTICIA PENAL',
    fullName: '🛡️ Justicia Penal Digital',
    badgeSubtitle: 'PENAL DIGITAL',
    tag: 'PENAL_DIGITAL',
    primaryColor: '#38BDF8',
    secondaryColor: '#FFFFFF',
    iconType: 'SHIELD_PENAL',
  },
  {
    id: 'BlockchainCripto',
    name: 'BLOCKCHAIN',
    fullName: '🔗 Blockchain & Criptoactivos',
    badgeSubtitle: 'CRIPTOACTIVOS',
    tag: 'LEGALTECH',
    primaryColor: '#FFB800',
    secondaryColor: '#FFFFFF',
    iconType: 'BLOCKCHAIN',
  },
  {
    id: 'EvidenciaForense',
    name: 'FORENSE DIGITAL',
    fullName: '🔍 Evidencia y Forense Digital',
    badgeSubtitle: 'EVIDENCIA DIGITAL',
    tag: 'PENAL_DIGITAL',
    primaryColor: '#F43F5E',
    secondaryColor: '#FFFFFF',
    iconType: 'FORENSIC',
  },
  {
    id: 'ComplianceCorporativo',
    name: 'COMPLIANCE',
    fullName: '🏛️ Compliance Corporativo',
    badgeSubtitle: 'CORPORATIVO',
    tag: 'LEGALTECH',
    primaryColor: '#10B981',
    secondaryColor: '#FFFFFF',
    iconType: 'COMPLIANCE',
  },
  {
    id: 'PropiedadIntelectual',
    name: 'PROP. INTELECTUAL',
    fullName: '💡 Propiedad Intelectual',
    badgeSubtitle: 'DERECHO DE AUTOR',
    tag: 'LEGALTECH',
    primaryColor: '#A855F7',
    secondaryColor: '#FFFFFF',
    iconType: 'IP_IDEA',
  },
  {
    id: 'MediacionConflictos',
    name: 'MEDIACIÓN',
    fullName: '🤝 Mediación de Conflictos',
    badgeSubtitle: 'SOLUCIÓN CONTROVERSIAS',
    tag: 'LEGALTECH',
    primaryColor: '#FF6B00',
    secondaryColor: '#FFFFFF',
    iconType: 'MEDIATION',
  },
  {
    id: 'DerechosHumanos',
    name: 'DD.HH. & GLOBAL',
    fullName: '🌍 Derechos Humanos',
    badgeSubtitle: 'GRUPOS VULNERABLES',
    tag: 'PENAL_DIGITAL',
    primaryColor: '#00E5FF',
    secondaryColor: '#FFFFFF',
    iconType: 'HUMAN_RIGHTS',
  },
];

// 6. Minijuego Interactivo: "¿Qué Mención de Derecho es tu Vocación?"
export const DERECHO_QUIZ_QUESTIONS = [
  {
    id: 1,
    question: '¿Qué escenario te apasiona más?',
    leftOption: '🏢 Gobierno Corporativo y FinTech',
    rightOption: '🔍 Criminología y Forense Digital',
  },
  {
    id: 2,
    question: 'Tu herramienta clave en el futuro:',
    leftOption: '🔗 Blockchain y Contratos Digitales',
    rightOption: '🛡️ Evidencia Digital y Litigio Penal',
  },
  {
    id: 3,
    question: 'Tu impacto en la sociedad:',
    leftOption: '⚖️ Compliance y Regulación Global',
    rightOption: '🚨 Anticorrupción y Justicia Penal',
  },
];

export const ASSETS_PATHS = {
  logoPng: '/assets/logo-unifranz.png',
  logoSvg: '/assets/logo-unifranz.svg',
};
