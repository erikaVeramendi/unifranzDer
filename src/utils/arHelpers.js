/**
 * Renderizadores Procedurales 100% en Canvas (60 FPS Zero-Lag) para:
 * "UNIFRANZ AR Mirror Experience — Derecho"
 *
 * Reglas de Rendimiento Estrictas (Sección 8):
 *  - Prohibido usar ctx.shadowBlur dentro del loop de animación.
 *  - Doble trazo neón brillante (strokeNeonPath) y sprites pre-renderizados en OffscreenCanvas.
 *  - Solo Cámara Real en Vivo con viñeta oscura sutil en los bordes.
 */

import {
  AR_CONFIG,
  LEGAL_ORBIT_ITEMS,
  FLOATING_CODE_MICROCREDENTIALS,
  OFFICIAL_MENTIONS,
} from '../config.js';

export const lerp = (start, end, factor) => start + (end - start) * factor;

export const lerpAngle = (a, b, t) => {
  const diff = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  return a + diff * t;
};

export const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

/**
 * Doble trazo neón ultra rápido SIN ctx.shadowBlur para mantener 60 FPS estables.
 */
function strokeNeonPath(
  ctx,
  coreColor = '#FF6B00',
  glowRgba = 'rgba(255, 107, 0, 0.34)',
  coreWidth = 2,
  glowWidth = 6
) {
  ctx.strokeStyle = glowRgba;
  ctx.lineWidth = glowWidth;
  ctx.stroke();
  ctx.strokeStyle = coreColor;
  ctx.lineWidth = coreWidth;
  ctx.stroke();
}

// ============================================================================
// 1. SPRITES PRE-CACHEADOS EN OFFSCREENCANVAS (HALOS Y 8 BADGES DE ÓRBITA JURÍDICA)
// ============================================================================
const legalSpriteCache = new Map();
let cachedOrangeGlowSprite = null;
let cachedWhiteCoreSprite = null;
let cachedGoldGlowSprite = null;

function createOffscreen(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(w, h);
  }
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function getPreRenderedGlowSprite(type = 'ORANGE') {
  if (type === 'ORANGE' && cachedOrangeGlowSprite) return cachedOrangeGlowSprite;
  if (type === 'WHITE' && cachedWhiteCoreSprite) return cachedWhiteCoreSprite;
  if (type === 'GOLD' && cachedGoldGlowSprite) return cachedGoldGlowSprite;

  const S = 128;
  const half = S / 2;
  const sprite = createOffscreen(S, S);
  const sctx = sprite.getContext('2d');
  const grad = sctx.createRadialGradient(half, half, 4, half, half, half);

  if (type === 'WHITE') {
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.32, 'rgba(255, 140, 0, 0.65)');
    grad.addColorStop(0.68, 'rgba(255, 107, 0, 0.25)');
    grad.addColorStop(1, 'rgba(255, 107, 0, 0)');
    cachedWhiteCoreSprite = sprite;
  } else if (type === 'GOLD') {
    grad.addColorStop(0, 'rgba(255, 215, 0, 0.9)');
    grad.addColorStop(0.4, 'rgba(255, 107, 0, 0.45)');
    grad.addColorStop(1, 'rgba(255, 107, 0, 0)');
    cachedGoldGlowSprite = sprite;
  } else {
    grad.addColorStop(0, 'rgba(255, 107, 0, 0.7)');
    grad.addColorStop(0.5, 'rgba(255, 107, 0, 0.24)');
    grad.addColorStop(1, 'rgba(255, 107, 0, 0)');
    cachedOrangeGlowSprite = sprite;
  }

  sctx.fillStyle = grad;
  sctx.beginPath();
  sctx.arc(half, half, half, 0, Math.PI * 2);
  sctx.fill();
  return sprite;
}

/**
 * Dibuja los 8 íconos vectoriales a color de las áreas reales de la nueva malla (Sección 5).
 */
function drawLegalPillarVectorIcon(ctx, item) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (item.iconType) {
    case 'SCALES_TECH': {
      // ⚖️ Legal Tech y Gobernanza Digital: Balanza con nodos de circuito
      ctx.strokeStyle = '#FF6B00';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(0, 10);
      ctx.moveTo(-8, 10);
      ctx.lineTo(8, 10);
      ctx.moveTo(-13, -7);
      ctx.lineTo(13, -7);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      [-13, 13].forEach((px) => {
        ctx.beginPath();
        ctx.arc(px, 2, 4.5, 0, Math.PI, false);
        ctx.fill();
      });

      ctx.fillStyle = '#FF6B00';
      ctx.beginPath();
      ctx.arc(0, -14, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'SHIELD_PENAL': {
      // 🛡️ Justicia Penal Digital: Escudo ciber-penal con balanza/candado
      ctx.fillStyle = 'rgba(56, 189, 248, 0.24)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(13, -10);
      ctx.lineTo(10, 5);
      ctx.lineTo(0, 13);
      ctx.lineTo(-10, 5);
      ctx.lineTo(-13, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-4.5, -2, 9, 7.5);
      ctx.strokeStyle = '#FF6B00';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, -2, 3, Math.PI, 0);
      ctx.stroke();
      break;
    }
    case 'BLOCKCHAIN': {
      // 🔗 Blockchain & Criptoactivos: Bloques hexagonales encadenados
      ctx.strokeStyle = '#FFB800';
      ctx.fillStyle = 'rgba(255, 184, 0, 0.22)';
      ctx.lineWidth = 2;
      [-7, 7].forEach((cx, idx) => {
        const cy = idx === 0 ? -4 : 4;
        ctx.beginPath();
        ctx.roundRect(cx - 6, cy - 6, 12, 12, 3);
        ctx.fill();
        ctx.stroke();
      });
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-2, -1);
      ctx.lineTo(2, 1);
      ctx.stroke();
      break;
    }
    case 'FORENSIC': {
      // 🔍 Evidencia y Forense Digital: Lupa forense con huella/retícula digital
      ctx.strokeStyle = '#F43F5E';
      ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(-3, -3, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(4, 4);
      ctx.lineTo(12, 12);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-7, -3);
      ctx.lineTo(1, -3);
      ctx.moveTo(-3, -7);
      ctx.lineTo(-3, 1);
      ctx.stroke();
      break;
    }
    case 'COMPLIANCE': {
      // 🏛️ Compliance Corporativo: Frontón clásico institucional
      ctx.fillStyle = '#10B981';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-14, -7);
      ctx.lineTo(0, -15);
      ctx.lineTo(14, -7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      [-9, -1.5, 6].forEach((cx) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(cx, -5, 3, 13);
      });

      ctx.fillStyle = '#10B981';
      ctx.fillRect(-14, 8, 28, 3.5);
      break;
    }
    case 'IP_IDEA': {
      // 💡 Propiedad Intelectual: Bombilla / Nodos de patente e innovación
      ctx.fillStyle = 'rgba(168, 85, 247, 0.26)';
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, -4, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-4.5, 6, 9, 5);
      ctx.strokeStyle = '#FF6B00';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(0, -1);
      ctx.moveTo(-3.5, -4.5);
      ctx.lineTo(3.5, -4.5);
      ctx.stroke();
      break;
    }
    case 'MEDIATION': {
      // 🤝 Mediación de Conflictos: Anillos entrelazados de consenso
      ctx.strokeStyle = '#FF6B00';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(-5, 0, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(5, 0, 8, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'HUMAN_RIGHTS':
    default: {
      // 🌍 Derechos Humanos: Globo con meridianos de protección global
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -1, 13, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, -1, 6.5, 13, 0, 0, Math.PI * 2);
      ctx.moveTo(-13, -1);
      ctx.lineTo(13, -1);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

/**
 * Pre-renderiza un badge hexagonal jurídico en OffscreenCanvas (128x128 px).
 * En el loop de 60 FPS solo se invoca ctx.drawImage(sprite, ...).
 */
export function getLegalBadgeSprite(item) {
  if (legalSpriteCache.has(item.id)) {
    return legalSpriteCache.get(item.id);
  }

  const S = 128;
  const half = S / 2;
  const sprite = createOffscreen(S, S);
  const sctx = sprite.getContext('2d');

  // Halo suave pre-renderizado una sola vez
  const halo = sctx.createRadialGradient(half, half, 14, half, half, half);
  halo.addColorStop(0, `${item.primaryColor}58`);
  halo.addColorStop(0.65, `${item.primaryColor}22`);
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sctx.fillStyle = halo;
  sctx.beginPath();
  sctx.arc(half, half, half, 0, Math.PI * 2);
  sctx.fill();

  // Hexágono oscuro #0A0A0A con borde del color del pilar
  const R = 49;
  sctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const hx = half + Math.cos(a) * R;
    const hy = half + Math.sin(a) * R;
    if (i === 0) sctx.moveTo(hx, hy);
    else sctx.lineTo(hx, hy);
  }
  sctx.closePath();
  sctx.fillStyle = 'rgba(10, 10, 10, 0.92)';
  sctx.fill();

  sctx.strokeStyle = item.primaryColor;
  sctx.lineWidth = 2.6;
  sctx.stroke();

  // Ícono vectorial jurídico arriba
  sctx.save();
  sctx.translate(half, half - 11);
  drawLegalPillarVectorIcon(sctx, item);
  sctx.restore();

  // Subtítulo del área / microcredencial
  sctx.fillStyle = item.primaryColor;
  sctx.font = '800 7px "Orbitron", monospace';
  sctx.textAlign = 'center';
  sctx.textBaseline = 'middle';
  sctx.fillText(item.badgeSubtitle || 'DERECHO UNIFRANZ', half, half + 11);

  // Nombre principal del badge
  sctx.fillStyle = '#FFFFFF';
  sctx.font = '900 8.5px "Orbitron", sans-serif';
  sctx.fillText(item.name, half, half + 23);

  legalSpriteCache.set(item.id, sprite);
  return sprite;
}

export function prewarmLegalBadgeSprites() {
  getPreRenderedGlowSprite('ORANGE');
  getPreRenderedGlowSprite('WHITE');
  getPreRenderedGlowSprite('GOLD');
  LEGAL_ORBIT_ITEMS.forEach((item) => getLegalBadgeSprite(item));
}

// ============================================================================
// 2. ÓRBITA JURÍDICA ALREDEDOR DE LA SILUETA (SIN TAPAR EL ROSTRO)
// ============================================================================
export function drawLegalPillarsOrbit(ctx, person, activeMentionKey = null, time = 0) {
  if (!person) return;

  let orbitPool = LEGAL_ORBIT_ITEMS;
  if (activeMentionKey === 'LEGALTECH') {
    orbitPool = LEGAL_ORBIT_ITEMS.filter(
      (i) => i.tag === 'LEGALTECH' || i.id === 'JusticiaPenalDigital'
    );
  } else if (activeMentionKey === 'PENAL_DIGITAL') {
    orbitPool = LEGAL_ORBIT_ITEMS.filter(
      (i) => i.tag === 'PENAL_DIGITAL' || i.id === 'LegalTechGobernanza' || i.id === 'ComplianceCorporativo'
    );
  }

  const count = orbitPool.length;
  const cx = person.shoulderCenterX;
  const cy = person.shoulderCenterY + person.torsoHeight * 0.05;
  const rx = Math.max(168, person.shoulderWidth * 1.24);
  const ry = Math.max(76, person.torsoHeight * 0.36);
  const baseSize = clamp(person.shoulderWidth * 0.36, 64, 98);

  const nodes = [];
  for (let i = 0; i < count; i++) {
    const angle = time * 0.0008 + (i * Math.PI * 2) / count;
    const depth = Math.sin(angle);
    const ix = cx + Math.cos(angle) * rx;
    const iy = cy + Math.sin(angle) * ry * 0.55 + Math.cos(angle * 2) * 10;
    const scale = 0.74 + (depth + 1) * 0.21;
    const alpha = clamp(0.48 + (depth + 1) * 0.27, 0.4, 0.98);
    nodes.push({ item: orbitPool[i], ix, iy, depth, scale, alpha });
  }

  nodes.sort((a, b) => a.depth - b.depth);

  // Anillo elíptico sutil de órbita jurídica
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 107, 0, 0.18)';
  ctx.lineWidth = 1.4;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry * 0.55, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const sprite = getLegalBadgeSprite(n.item);
    const drawSize = baseSize * n.scale;

    ctx.save();
    ctx.globalAlpha = n.alpha;
    ctx.drawImage(sprite, n.ix - drawSize / 2, n.iy - drawSize / 2, drawSize, drawSize);
    ctx.restore();
  }
}

// ============================================================================
// 3. ACCESORIOS FACIALES JURÍDICOS (DIBUJADOS 100% POR CÓDIGO EN CANVAS)
// ============================================================================

/**
 * 3.1. LENTES HUD LEGALTECH (Por defecto)
 * Lentes ejecutivos/futuristas de marco fino en negro mate y bordes naranja neón (#FF6B00)
 * con telemetría legal sutil reflejada en los cristales ("LEX • IUS • LEGALTECH • UNIFRANZ").
 */
export function drawLegalTechHudGlasses(
  ctx,
  centerX,
  centerY,
  width,
  rollAngle = 0,
  yaw = 0,
  time = 0
) {
  const W = Math.max(88, width * 0.96);
  const H = W * 0.34;
  const hw = W / 2;
  const hh = H / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rollAngle);

  const yawShift = clamp(yaw || 0, -0.6, 0.6) * W * 0.05;
  const lensW = W * 0.42;
  const lensH = H * 0.88;
  const bridgeW = W * 0.09;

  // Patillas laterales ejecutivas hacia las sienes
  ctx.strokeStyle = '#0A0A0A';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(-hw * 0.96, -hh * 0.25);
  ctx.lineTo(-hw * 1.08, hh * 0.1);
  ctx.moveTo(hw * 0.96, -hh * 0.25);
  ctx.lineTo(hw * 1.08, hh * 0.1);
  ctx.stroke();

  // Acento naranja neón en las bisagras de las sienes
  ctx.fillStyle = '#FF6B00';
  ctx.fillRect(-hw * 1.01, -hh * 0.32, W * 0.055, H * 0.18);
  ctx.fillRect(hw * 0.955, -hh * 0.32, W * 0.055, H * 0.18);

  const traceExecutiveLens = (side) => {
    const cx = side * (bridgeW * 0.5 + lensW * 0.5) + yawShift * 0.3;
    const left = cx - lensW * 0.5;
    const right = cx + lensW * 0.5;
    const top = -lensH * 0.48;
    const bottom = lensH * 0.52;
    const r = lensH * 0.24;

    ctx.beginPath();
    ctx.roundRect(left, top, lensW, bottom - top, [r * 0.8, r * 0.8, r * 1.3, r * 1.3]);
    return { cx, left, right, top, bottom };
  };

  [-1, 1].forEach((side) => {
    const { cx, left, top, bottom } = traceExecutiveLens(side);

    // Cristal translúcido oscuro
    ctx.fillStyle = 'rgba(10, 10, 10, 0.52)';
    ctx.fill();

    // Telemetría legal reflejada en los cristales: "LEX • IUS • LEGALTECH • UNIFRANZ"
    ctx.save();
    ctx.clip();

    const sweep = ((time * 0.0006 + (side === 1 ? 0.3 : 0)) % 1.8) - 0.9;
    const sx = cx + sweep * lensW;
    ctx.fillStyle = 'rgba(255, 107, 0, 0.16)';
    ctx.beginPath();
    ctx.moveTo(sx - lensW * 0.18, top);
    ctx.lineTo(sx + lensW * 0.04, top);
    ctx.lineTo(sx - lensW * 0.1, bottom);
    ctx.lineTo(sx - lensW * 0.32, bottom);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 107, 0, 0.32)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left + 8, top + lensH * 0.25);
    ctx.lineTo(left + lensW - 8, top + lensH * 0.25);
    ctx.stroke();

    const fontSize = clamp(Math.round(lensH * 0.17), 7, 11);
    ctx.font = `800 ${fontSize}px "Orbitron", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(255, 107, 0, 0.9)';
    const hudTextTop = side < 0 ? 'LEX • IUS' : 'LEGALTECH';
    ctx.fillText(hudTextTop, cx, top + lensH * 0.38);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    const hudTextBottom = side < 0 ? 'LEGALTECH' : 'UNIFRANZ';
    ctx.fillText(hudTextBottom, cx, top + lensH * 0.72);

    ctx.restore();

    // Marco fino negro mate + bordes naranja neón (#FF6B00)
    traceExecutiveLens(side);
    ctx.strokeStyle = 'rgba(255, 107, 0, 0.38)';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.strokeStyle = '#0A0A0A';
    ctx.lineWidth = 3.2;
    ctx.stroke();

    ctx.strokeStyle = '#FF6B00';
    ctx.lineWidth = 1.7;
    ctx.stroke();
  });

  // Puente nasal doble ejecutivo
  ctx.strokeStyle = '#0A0A0A';
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.moveTo(-bridgeW * 0.55 + yawShift * 0.3, -lensH * 0.15);
  ctx.quadraticCurveTo(
    yawShift * 0.3,
    -lensH * 0.32,
    bridgeW * 0.55 + yawShift * 0.3,
    -lensH * 0.15
  );
  ctx.stroke();

  ctx.strokeStyle = '#FF6B00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-bridgeW * 0.65 + yawShift * 0.3, -lensH * 0.36);
  ctx.lineTo(bridgeW * 0.65 + yawShift * 0.3, -lensH * 0.36);
  ctx.stroke();

  ctx.restore();
}

/**
 * 3.2. LAURELES DIGITALES DE LA JUSTICIA
 * Corona de laureles geométricos minimalistas en blanco brillante y naranja neón
 * flotando sutilmente sobre la frente y sienes, simbolizando el liderazgo jurídico global.
 */
export function drawDigitalJusticeLaurels(ctx, person, time = 0) {
  if (!person) return;

  const cx = person.foreheadX ?? person.vrCenterX;
  const cy =
    (person.foreheadY ?? person.vrCenterY - person.vrWidth * 0.32) - person.vrWidth * 0.04;
  const crownRx = Math.max(62, person.vrWidth * 0.54);
  const crownRy = Math.max(26, person.vrWidth * 0.22);
  const floatOffset = Math.sin(time * 0.003) * 3.5;

  ctx.save();
  ctx.translate(cx, cy + floatOffset);
  ctx.rotate(person.vrAngle || 0);

  const leafPairs = 7;
  [-1, 1].forEach((side) => {
    ctx.strokeStyle = 'rgba(255, 107, 0, 0.72)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= leafPairs; i++) {
      const t = i / leafPairs;
      const angle = (1 - t) * 1.38 + 0.16;
      const lx = side * Math.sin(angle) * crownRx;
      const ly = -Math.cos(angle) * crownRy + (1 - t) * crownRy * 0.65;
      if (i === 0) ctx.moveTo(lx, ly);
      else ctx.lineTo(lx, ly);
    }
    ctx.stroke();

    for (let i = 0; i < leafPairs; i++) {
      const t = i / (leafPairs - 1);
      const angle = (1 - t) * 1.32 + 0.22;
      const lx = side * Math.sin(angle) * crownRx;
      const ly = -Math.cos(angle) * crownRy + (1 - t) * crownRy * 0.62;

      const leafLen = clamp(person.vrWidth * 0.095, 12, 24) * (1 - t * 0.28);
      const leafW = leafLen * 0.36;
      const pulse = 0.85 + Math.sin(time * 0.004 + i * 0.7) * 0.15;

      [-0.38, 0.32].forEach((leafTilt, subIdx) => {
        const isWhite = (i + subIdx) % 2 === 0;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(side * (-0.85 + t * 0.55 + leafTilt));

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(side * leafW, -leafLen * 0.45);
        ctx.lineTo(0, -leafLen);
        ctx.lineTo(-side * leafW * 0.6, -leafLen * 0.45);
        ctx.closePath();

        ctx.fillStyle = isWhite
          ? `rgba(255, 255, 255, ${0.88 * pulse})`
          : `rgba(255, 107, 0, ${0.86 * pulse})`;
        ctx.fill();

        ctx.strokeStyle = isWhite ? '#FF6B00' : '#FFFFFF';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();
      });
    }
  });

  // Emblema central superior en la frente
  const crestY = -crownRy * 0.95;
  ctx.fillStyle = '#0A0A0A';
  ctx.strokeStyle = '#FF6B00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, crestY - 12);
  ctx.lineTo(12, crestY);
  ctx.lineTo(0, crestY + 12);
  ctx.lineTo(-12, crestY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 9px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('IUS', 0, crestY + 0.5);

  ctx.restore();
}

/**
 * 3.3. ESCÁNER FACIAL BIOMÉTRICO EN NARANJA (Modo Líder Jurídico)
 */
export function drawBiometricLegalScanner(ctx, person, time = 0) {
  if (!person) return;

  const cx = person.vrCenterX;
  const cy = person.vrCenterY + person.faceHeight * 0.08;
  const rx = person.templeWidth * 0.58;
  const ry = person.faceHeight * 0.62;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(person.vrAngle || 0);

  const bw = rx * 0.95;
  const bh = ry * 0.85;
  const corner = 18;
  ctx.strokeStyle = '#FF6B00';
  ctx.lineWidth = 2;

  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(sx * bw, sy * (bh - corner));
    ctx.lineTo(sx * bw, sy * bh);
    ctx.lineTo(sx * (bw - corner), sy * bh);
    ctx.stroke();
  });

  ctx.strokeStyle = 'rgba(255, 107, 0, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(-bw * 0.8, 0);
  ctx.lineTo(0, bh * 0.85);
  ctx.lineTo(bw * 0.8, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  const scanY = Math.sin(time * 0.0032) * (bh * 0.78);
  ctx.strokeStyle = 'rgba(255, 107, 0, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-bw * 0.88, scanY);
  ctx.lineTo(bw * 0.88, scanY);
  ctx.stroke();

  ctx.fillStyle = '#FF6B00';
  ctx.font = '800 9px "Orbitron", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ID: LÍDER JURÍDICO UNIFRANZ', bw + 10, -bh * 0.45);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(
    `LEX-SCORE: ${Math.round(97 + Math.sin(time * 0.004) * 2.5)}%`,
    bw + 10,
    -bh * 0.45 + 14
  );
  ctx.fillStyle = 'rgba(255, 107, 0, 0.9)';
  ctx.fillText('NUEVA MALLA DERECHO', bw + 10, -bh * 0.45 + 28);

  ctx.restore();
}

// ============================================================================
// 4. SUPERPODERES INTERACTIVOS DE DERECHO CON MANOS (60 FPS)
// ============================================================================

/**
 * 4.1. MAZO DE JUEZ INTERACTIVO + SONIDO DE GOLPE (`✊ Puño Cerrado Derecho`)
 * Mazo de Juez holográfico 3D en madera oscura/negra con aros metálicos en naranja neón y blanco.
 */
export function drawHolographicJudgeGavel(
  ctx,
  x,
  y,
  size = 110,
  tiltAngle = 0,
  time = 0,
  downwardVelocity = 0,
  trailPoints = [],
  opacity = 1
) {
  if (opacity <= 0.02) return;

  ctx.save();
  ctx.globalAlpha = opacity;

  // Estela de energía naranja cuando el mazo baja rápido
  if (trailPoints && trailPoints.length > 1) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < trailPoints.length - 1; i++) {
      const p0 = trailPoints[i];
      const p1 = trailPoints[i + 1];
      const t = (i + 1) / trailPoints.length;
      ctx.strokeStyle = `rgba(255, 107, 0, ${t * 0.65})`;
      ctx.lineWidth = t * 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y - size * 0.45);
      ctx.lineTo(p1.x, p1.y - size * 0.45);
      ctx.stroke();
    }
    ctx.restore();
  }

  const glowSprite = getPreRenderedGlowSprite('ORANGE');
  const glowSize = size * 2.2;
  ctx.drawImage(glowSprite, x - glowSize / 2, y - size * 0.4 - glowSize / 2, glowSize, glowSize);

  ctx.translate(x, y);
  const strikeAngleBoost = clamp(downwardVelocity * 0.028, -0.25, 0.75);
  ctx.rotate(tiltAngle - 0.35 + strikeAngleBoost);

  const handleLen = size * 1.15;
  const handleW = Math.max(10, size * 0.13);
  const headW = size * 0.92;
  const headH = size * 0.44;
  const headY = -handleLen * 0.72;

  if (downwardVelocity > 5) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 107, 0, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, handleLen * 0.28, headW * 0.6, headH * 0.25, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Mango en madera oscura/negra (#14110F) con borde naranja neón
  ctx.fillStyle = '#14110F';
  ctx.strokeStyle = '#FF6B00';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(-handleW / 2, headY + headH * 0.3, handleW, handleLen, handleW * 0.45);
  ctx.fill();
  ctx.stroke();

  [-0.1, 0.08, 0.24].forEach((offsetRatio, idx) => {
    const ry = offsetRatio * handleLen;
    ctx.fillStyle = idx % 2 === 0 ? '#FF6B00' : '#FFFFFF';
    ctx.fillRect(-handleW * 0.58, ry, handleW * 1.16, 4);
  });

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FF6B00';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, headY + headH * 0.3 + handleLen, handleW * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cabeza Cilíndrica 3D del Mazo (Madera negra con aros metálicos en naranja neón y blanco)
  ctx.save();
  ctx.translate(0, headY);

  ctx.fillStyle = '#0D0B0A';
  ctx.beginPath();
  ctx.roundRect(-headW / 2, -headH / 2, headW, headH, 10);
  ctx.fill();
  strokeNeonPath(ctx, '#FF6B00', 'rgba(255, 107, 0, 0.45)', 2.4, 6);

  const bandW = headW * 0.085;
  [-headW * 0.34, headW * 0.255].forEach((bx) => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(bx, -headH / 2 + 1.5, bandW, headH - 3);
    ctx.fillStyle = '#FF6B00';
    ctx.fillRect(bx + bandW * 0.25, -headH / 2 + 1.5, bandW * 0.5, headH - 3);
  });

  ctx.fillStyle = '#FF6B00';
  ctx.beginPath();
  ctx.arc(0, 0, headH * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0A0A0A';
  ctx.font = `900 ${Math.max(8, Math.round(headH * 0.22))}px "Orbitron", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LEX', 0, 0.5);

  [-1, 1].forEach((side) => {
    const capX = side * (headW * 0.5 + 3);
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FF6B00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(
      side < 0 ? capX - 5 : capX - 1,
      -headH * 0.44,
      6,
      headH * 0.88,
      3
    );
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
  ctx.restore();

  // Etiqueta flotante
  ctx.save();
  ctx.globalAlpha = opacity;
  const badgeW = 295;
  const badgeH = 32;
  const by = y + 54;
  ctx.fillStyle = 'rgba(10, 10, 10, 0.92)';
  ctx.beginPath();
  ctx.roundRect(x - badgeW / 2, by - badgeH / 2, badgeW, badgeH, 16);
  ctx.fill();
  strokeNeonPath(ctx, '#FF6B00', 'rgba(255, 107, 0, 0.38)', 1.8, 4.5);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 10.5px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔨 BAJA EL PUÑO: ¡CERRAR CASO!', x, by);
  ctx.restore();
}

/**
 * 4.1B. SELLO GIGANTE HOLOGRÁFICO EN PANTALLA AL GOLPEAR EL MAZO:
 * "⚖️ ¡CASO CERRADO! — VEREDICTO: INNOVACIÓN JURÍDICA"
 */
export function drawVerdictHologramStamp(ctx, verdictState, W, H, now) {
  if (!verdictState || !verdictState.active) return;

  const elapsed = now - verdictState.startTime;
  if (elapsed > AR_CONFIG.VERDICT_DURATION_MS) {
    verdictState.active = false;
    return;
  }

  const introT = clamp(elapsed / 180, 0, 1);
  const outroT =
    elapsed > AR_CONFIG.VERDICT_DURATION_MS - 420
      ? clamp((AR_CONFIG.VERDICT_DURATION_MS - elapsed) / 420, 0, 1)
      : 1;
  const scale = (1.35 - 0.35 * introT) * (0.98 + Math.sin(elapsed * 0.015) * 0.02);
  const alpha = introT * outroT;

  const cx = W * 0.5;
  const cy = H * 0.46;
  const stampW = clamp(W * 0.74, 340, 780);
  const stampH = 152;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.rotate(-0.045);

  const glowSprite = getPreRenderedGlowSprite('ORANGE');
  ctx.drawImage(glowSprite, -stampW * 0.55, -stampH * 1.1, stampW * 1.1, stampH * 2.2);

  ctx.fillStyle = 'rgba(10, 10, 10, 0.94)';
  ctx.beginPath();
  ctx.roundRect(-stampW / 2, -stampH / 2, stampW, stampH, 20);
  ctx.fill();
  strokeNeonPath(ctx, '#FF6B00', 'rgba(255, 107, 0, 0.55)', 4, 12);

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 6]);
  ctx.beginPath();
  ctx.roundRect(-stampW / 2 + 10, -stampH / 2 + 10, stampW - 20, stampH - 20, 14);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#FF6B00';
  ctx.beginPath();
  ctx.roundRect(-stampW * 0.36, -stampH / 2 - 14, stampW * 0.72, 28, 14);
  ctx.fill();

  ctx.fillStyle = '#0A0A0A';
  ctx.font = '900 11px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TRIBUNAL SUPREMO DE INNOVACIÓN • DERECHO UNIFRANZ', 0, -stampH / 2);

  const mainFontSize = clamp(Math.round(stampW * 0.048), 18, 34);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${mainFontSize}px "Orbitron", sans-serif`;
  ctx.fillText('⚖️ ¡CASO CERRADO!', 0, -14);

  const subFontSize = clamp(Math.round(stampW * 0.028), 12, 21);
  ctx.fillStyle = '#FF6B00';
  ctx.font = `800 ${subFontSize}px "Orbitron", sans-serif`;
  ctx.fillText('VEREDICTO: INNOVACIÓN JURÍDICA', 0, 32);

  ctx.restore();
}

/**
 * 4.2. BALANZA DE LA JUSTICIA DINÁMICA + MENCIÓN 1 (`🖐️ Mano Izquierda Abierta`)
 * Balanza de la Justicia holográfica en blanco brillante y naranja neón cuyos platillos
 * se inclinan en tiempo real según el movimiento de la mano, proyectando junto a ella
 * el título oficial: "Legal Tech y Gobernanza Digital".
 */
export function drawDynamicScalesOfJustice(
  ctx,
  x,
  y,
  radius = 75,
  handTiltAngle = 0,
  time = 0,
  opacity = 1,
  onBalancedCallback = null
) {
  if (opacity <= 0.02) return;

  const R = Math.max(58, radius);
  const isBalanced = Math.abs(handTiltAngle) <= AR_CONFIG.SCALE_BALANCE_THRESHOLD_RAD;

  if (isBalanced && onBalancedCallback) {
    onBalancedCallback();
  }

  ctx.save();
  ctx.globalAlpha = opacity;

  const glowSprite = getPreRenderedGlowSprite(isBalanced ? 'GOLD' : 'ORANGE');
  const glowDiam = R * (isBalanced ? 3.2 : 2.3);
  ctx.drawImage(glowSprite, x - glowDiam / 2, y - R * 0.35 - glowDiam / 2, glowDiam, glowDiam);

  ctx.translate(x, y - R * 0.25);

  if (isBalanced) {
    const pulseR = R * (1.1 + Math.sin(time * 0.014) * 0.12);
    ctx.strokeStyle = 'rgba(255, 184, 0, 0.88)';
    ctx.lineWidth = 2.6;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.arc(0, -R * 0.15, pulseR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const pillarTopY = -R * 0.85;
  const pillarBottomY = R * 0.55;

  // Base escalonada
  ctx.fillStyle = '#0A0A0A';
  ctx.strokeStyle = '#FF6B00';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.roundRect(-R * 0.46, pillarBottomY, R * 0.92, 12, 6);
  ctx.fill();
  ctx.stroke();

  // Columna central luminosa
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, pillarBottomY);
  ctx.lineTo(0, pillarTopY);
  ctx.stroke();

  ctx.strokeStyle = '#FF6B00';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, pillarBottomY);
  ctx.lineTo(0, pillarTopY);
  ctx.stroke();

  // Travesaño inclinado en tiempo real según handTiltAngle
  const beamHalfSpan = R * 0.88;
  const beamAngle = clamp(handTiltAngle * 1.25, -0.58, 0.58);

  const leftPivotX = Math.cos(beamAngle) * -beamHalfSpan;
  const leftPivotY = pillarTopY + Math.sin(beamAngle) * -beamHalfSpan;
  const rightPivotX = Math.cos(beamAngle) * beamHalfSpan;
  const rightPivotY = pillarTopY + Math.sin(beamAngle) * beamHalfSpan;

  ctx.beginPath();
  ctx.moveTo(leftPivotX, leftPivotY);
  ctx.lineTo(0, pillarTopY - 6);
  ctx.lineTo(rightPivotX, rightPivotY);
  strokeNeonPath(
    ctx,
    isBalanced ? '#FFFFFF' : '#FF6B00',
    'rgba(255, 107, 0, 0.45)',
    3.2,
    8
  );

  ctx.fillStyle = isBalanced ? '#FFB800' : '#FF6B00';
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, pillarTopY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Los 2 Platillos Suspendidos
  const chainLen = R * 0.68;
  const panRadius = R * 0.36;
  const swingDamp = Math.sin(time * 0.008) * 2.2;

  [
    { px: leftPivotX, py: leftPivotY, label: 'LEX' },
    { px: rightPivotX, py: rightPivotY, label: 'TECH' },
  ].forEach((side) => {
    const panCenterX = side.px + swingDamp;
    const panCenterY = side.py + chainLen;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(side.px, side.py);
    ctx.lineTo(panCenterX - panRadius * 0.85, panCenterY);
    ctx.moveTo(side.px, side.py);
    ctx.lineTo(panCenterX, panCenterY);
    ctx.moveTo(side.px, side.py);
    ctx.lineTo(panCenterX + panRadius * 0.85, panCenterY);
    ctx.stroke();

    ctx.fillStyle = isBalanced ? 'rgba(255, 184, 0, 0.35)' : 'rgba(255, 107, 0, 0.25)';
    ctx.beginPath();
    ctx.arc(panCenterX, panCenterY, panRadius, 0, Math.PI, false);
    ctx.closePath();
    ctx.fill();
    strokeNeonPath(
      ctx,
      isBalanced ? '#FFFFFF' : '#FF6B00',
      'rgba(255, 107, 0, 0.42)',
      2.2,
      5.5
    );

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 9px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(side.label, panCenterX, panCenterY - 8);
  });

  ctx.restore();

  // Proyección junto a la Balanza del título oficial de la Mención 1:
  // "Legal Tech y Gobernanza Digital"
  ctx.save();
  ctx.globalAlpha = opacity;
  const bw = 345;
  const bh = 46;
  const by = y + R * 0.62;

  ctx.fillStyle = 'rgba(10, 10, 10, 0.94)';
  ctx.beginPath();
  ctx.roundRect(x - bw / 2, by - bh / 2, bw, bh, 18);
  ctx.fill();
  strokeNeonPath(
    ctx,
    isBalanced ? '#FFB800' : '#FF6B00',
    'rgba(255, 107, 0, 0.45)',
    2.2,
    6
  );

  ctx.fillStyle = '#FF6B00';
  ctx.font = '800 8.5px "Orbitron", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('⚖️ MENCIÓN OFICIAL 1 • DERECHO UNIFRANZ', x, by - 9);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 12.5px "Orbitron", sans-serif';
  ctx.fillText(OFFICIAL_MENTIONS.LEGALTECH, x, by + 9);
  ctx.restore();
}

/**
 * 4.3. ESCUDO FORENSE & CIBERJUSTICIA + MENCIÓN 2 (`🖐️ Mano Derecha Abierta`)
 * Despliega un Escudo Hexagonal de Evidencia Digital en naranja y blanco
 * proyectando el título oficial: "Justicia Penal Digital".
 */
export function drawForensicDigitalShield(
  ctx,
  x,
  y,
  radius = 85,
  time = 0,
  opacity = 1
) {
  if (opacity <= 0.02) return;

  const R = Math.max(66, radius);
  const pulse = 1 + Math.sin(time * 0.008) * 0.04;
  const outerR = R * pulse;

  ctx.save();
  ctx.globalAlpha = opacity;

  const glowSprite = getPreRenderedGlowSprite('ORANGE');
  const glowDiam = outerR * 2.5;
  ctx.drawImage(glowSprite, x - glowDiam / 2, y - glowDiam / 2, glowDiam, glowDiam);

  ctx.translate(x, y);

  const traceHexagon = (rad) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const hx = Math.cos(a) * rad;
      const hy = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
  };

  // Hexágono Exterior Giratorio en Naranja Neón (#FF6B00)
  ctx.save();
  ctx.rotate(time * 0.0022);
  traceHexagon(outerR);
  ctx.fillStyle = 'rgba(255, 107, 0, 0.18)';
  ctx.fill();
  strokeNeonPath(ctx, '#FF6B00', 'rgba(255, 107, 0, 0.45)', 3, 7);

  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(Math.cos(a) * outerR, Math.sin(a) * outerR, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Segundo Hexágono Contra-Giratorio en Blanco Puro (#FFFFFF)
  ctx.save();
  ctx.rotate(-time * 0.0026);
  traceHexagon(outerR * 0.78);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Núcleo Hexagonal Forense con Retícula de Evidencia Digital
  traceHexagon(outerR * 0.52);
  ctx.fillStyle = 'rgba(10, 10, 10, 0.92)';
  ctx.fill();
  ctx.strokeStyle = '#FF6B00';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Ícono de Lupa Forense + Candado de Evidencia Digital en el centro
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(-3, -3, outerR * 0.18, 0, Math.PI * 2);
  ctx.moveTo(outerR * 0.1, outerR * 0.1);
  ctx.lineTo(outerR * 0.24, outerR * 0.24);
  ctx.stroke();

  ctx.strokeStyle = '#FF6B00';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-3 - outerR * 0.1, -3);
  ctx.lineTo(-3 + outerR * 0.1, -3);
  ctx.moveTo(-3, -3 - outerR * 0.1);
  ctx.lineTo(-3, -3 + outerR * 0.1);
  ctx.stroke();

  ctx.restore();

  // Proyección del título oficial de la Mención 2:
  // "Justicia Penal Digital"
  ctx.save();
  ctx.globalAlpha = opacity;
  const bannerW = 325;
  const bannerH = 46;
  const bannerY = y + outerR + 28;

  ctx.fillStyle = 'rgba(10, 10, 10, 0.94)';
  ctx.beginPath();
  ctx.roundRect(x - bannerW / 2, bannerY - bannerH / 2, bannerW, bannerH, 18);
  ctx.fill();
  strokeNeonPath(ctx, '#FF6B00', 'rgba(255, 107, 0, 0.48)', 2.2, 6);

  ctx.fillStyle = '#FF6B00';
  ctx.font = '800 8.5px "Orbitron", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('🛡️ MENCIÓN OFICIAL 2 • EVIDENCIA DIGITAL', x, bannerY - 9);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 13px "Orbitron", sans-serif';
  ctx.fillText(OFFICIAL_MENTIONS.PENAL_DIGITAL, x, bannerY + 9);
  ctx.restore();
}

/**
 * 4.4. CÓDIGO JURÍDICO HOLOGRÁFICO EN EL AIRE (`🖐️🖐️ Ambas Manos Abiertas`)
 * Despliega entre ambas manos un Código Legal Holográfico abierto con páginas
 * translúcidas en naranja y blanco de donde emergen las microcredenciales oficiales:
 * (`Compliance Corporativo`, `Propiedad Intelectual`, `Blockchain y Criptoactivos`,
 *  `Criminología Digital`, `Mediación de Conflictos`).
 */
export function drawFloatingLegalCodeBook(
  ctx,
  centerX,
  centerY,
  width,
  time = 0,
  opacity = 1
) {
  if (opacity <= 0.02) return;

  const W = clamp(width, 320, 560);
  const H = W * 0.44;
  const hw = W / 2;
  const hh = H / 2;
  const floatY = Math.sin(time * 0.0032) * 5;

  ctx.save();
  ctx.globalAlpha = opacity;

  const glowSprite = getPreRenderedGlowSprite('WHITE');
  ctx.drawImage(
    glowSprite,
    centerX - W * 0.7,
    centerY + floatY - H * 1.1,
    W * 1.4,
    H * 2.2
  );

  // A. Microcredenciales Oficiales que emergen del Código Legal abierto
  const numItems = FLOATING_CODE_MICROCREDENTIALS.length;
  const activeIdx = Math.floor(time * 0.00075) % numItems;

  FLOATING_CODE_MICROCREDENTIALS.forEach((mc, idx) => {
    const normPos = (idx - (numItems - 1) / 2) / ((numItems - 1) / 2);
    const cardX = centerX + normPos * (W * 0.47);
    const cardY =
      centerY +
      floatY -
      hh * 0.55 -
      36 -
      Math.cos(normPos * 1.1) * 44 -
      Math.sin(time * 0.003 + idx) * 6;

    const isHighlighted = idx === activeIdx;
    const cardW = isHighlighted ? 196 : 172;
    const cardH = isHighlighted ? 44 : 36;

    ctx.strokeStyle = isHighlighted
      ? 'rgba(255, 107, 0, 0.75)'
      : 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = isHighlighted ? 2 : 1.1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX + normPos * (W * 0.16), centerY + floatY - hh * 0.15);
    ctx.lineTo(cardX, cardY + cardH / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = isHighlighted
      ? 'rgba(16, 12, 8, 0.95)'
      : 'rgba(10, 10, 10, 0.88)';
    ctx.beginPath();
    ctx.roundRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 10);
    ctx.fill();
    strokeNeonPath(
      ctx,
      isHighlighted ? '#FF6B00' : '#FFFFFF',
      'rgba(255, 107, 0, 0.35)',
      isHighlighted ? 2.2 : 1.3,
      isHighlighted ? 5.5 : 3
    );

    ctx.fillStyle = '#FF6B00';
    ctx.font = '800 7.5px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(mc.code, cardX, cardY - 6);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 ${isHighlighted ? 11 : 9.6}px "Space Grotesk", sans-serif`;
    ctx.fillText(mc.title, cardX, cardY + 9);
  });

  // B. Dibujar el Libro / Código Jurídico Holográfico Abierto
  ctx.save();
  ctx.translate(centerX, centerY + floatY);

  const spineTopY = -hh * 0.28;
  const spineBottomY = hh * 0.65;
  const pageSpreadX = hw * 0.92;
  const pageArchY = -hh * 0.52;

  ctx.fillStyle = 'rgba(10, 10, 10, 0.92)';
  ctx.beginPath();
  ctx.moveTo(0, spineTopY + 6);
  ctx.quadraticCurveTo(-pageSpreadX * 0.5, pageArchY - 6, -pageSpreadX - 8, spineTopY - 8);
  ctx.lineTo(-pageSpreadX - 14, spineBottomY + 8);
  ctx.quadraticCurveTo(-pageSpreadX * 0.5, spineBottomY - 12, 0, spineBottomY + 12);
  ctx.quadraticCurveTo(pageSpreadX * 0.5, spineBottomY - 12, pageSpreadX + 14, spineBottomY + 8);
  ctx.lineTo(pageSpreadX + 8, spineTopY - 8);
  ctx.quadraticCurveTo(pageSpreadX * 0.5, pageArchY - 6, 0, spineTopY + 6);
  ctx.closePath();
  ctx.fill();
  strokeNeonPath(ctx, '#FF6B00', 'rgba(255, 107, 0, 0.45)', 2.6, 7);

  for (let layer = 0; layer < 3; layer++) {
    const inset = layer * 6;
    const archLift = layer * 4;

    ctx.fillStyle =
      layer === 2 ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 107, 0, 0.12)';
    ctx.strokeStyle = layer === 2 ? '#FFFFFF' : '#FF6B00';
    ctx.lineWidth = layer === 2 ? 2 : 1.2;

    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.moveTo(0, spineTopY - archLift);
      ctx.quadraticCurveTo(
        side * (pageSpreadX * 0.48),
        pageArchY - archLift,
        side * (pageSpreadX - inset),
        spineTopY - 12 - archLift
      );
      ctx.lineTo(side * (pageSpreadX - inset + 4), spineBottomY - 4 - archLift);
      ctx.quadraticCurveTo(
        side * (pageSpreadX * 0.48),
        spineBottomY - 22 - archLift,
        0,
        spineBottomY - archLift
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }

  ctx.strokeStyle = '#FF6B00';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, spineTopY - 8);
  ctx.lineTo(0, spineBottomY);
  ctx.stroke();

  ctx.font = '700 8.5px "Orbitron", monospace';
  ctx.textAlign = 'center';

  // Página Izquierda (Mención 1)
  ctx.fillStyle = '#FF6B00';
  ctx.fillText('LEGAL TECH & GOBERNANZA', -pageSpreadX * 0.5, spineTopY + 4);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText('• COMPLIANCE CORPORATIVO', -pageSpreadX * 0.5, spineTopY + 22);
  ctx.fillText('• PROPIEDAD INTELECTUAL', -pageSpreadX * 0.5, spineTopY + 38);
  ctx.fillText('• BLOCKCHAIN & CRIPTO', -pageSpreadX * 0.5, spineTopY + 54);

  // Página Derecha (Mención 2)
  ctx.fillStyle = '#FF6B00';
  ctx.fillText('JUSTICIA PENAL DIGITAL', pageSpreadX * 0.5, spineTopY + 4);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText('• CRIMINOLOGÍA DIGITAL', pageSpreadX * 0.5, spineTopY + 22);
  ctx.fillText('• MEDIACIÓN DE CONFLICTOS', pageSpreadX * 0.5, spineTopY + 38);
  ctx.fillText('• GRUPOS VULNERABLES', pageSpreadX * 0.5, spineTopY + 54);

  const bannerW = W * 0.86;
  const bannerH = 32;
  const bannerY = spineBottomY + 24;
  ctx.fillStyle = 'rgba(10, 10, 10, 0.94)';
  ctx.beginPath();
  ctx.roundRect(-bannerW / 2, bannerY - bannerH / 2, bannerW, bannerH, 16);
  ctx.fill();
  strokeNeonPath(ctx, '#FF6B00', 'rgba(255, 107, 0, 0.42)', 1.8, 4.5);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 10.5px "Orbitron", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `📖 CÓDIGO JURÍDICO & MICROCREDENCIALES • ${FLOATING_CODE_MICROCREDENTIALS[activeIdx].title.toUpperCase()}`,
    0,
    bannerY
  );

  ctx.restore();
  ctx.restore();
}

// ============================================================================
// 6. MINIJUEGO INTERACTIVO: "¿QUÉ MENCIÓN DE DERECHO ES TU VOCACIÓN?"
// ============================================================================
export function drawHeadTiltQuizHUD(
  ctx,
  person,
  questionObj,
  questionIdx,
  totalQuestions,
  tiltChoice,
  fillProgress,
  W,
  H
) {
  if (!person || !questionObj) return;

  const headTopY =
    (person.foreheadY ?? person.vrCenterY - person.vrWidth * 0.4) -
    (person.faceHeight || person.vrWidth * 0.85) * 0.55;

  const panelW = clamp(W * 0.54, 370, 640);
  const panelH = 140;
  const cx = clamp(
    person.vrCenterX || person.shoulderCenterX,
    panelW / 2 + 16,
    W - panelW / 2 - 16
  );
  const cy = clamp(headTopY - panelH * 0.65, 88, H * 0.42);

  ctx.save();

  ctx.strokeStyle = 'rgba(255, 107, 0, 0.75)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(person.vrCenterX || cx, headTopY + 18);
  ctx.lineTo(cx, cy + panelH);
  ctx.stroke();
  ctx.setLineDash([]);

  const left = cx - panelW / 2;
  const top = cy;
  ctx.fillStyle = 'rgba(10, 10, 10, 0.94)';
  ctx.beginPath();
  ctx.roundRect(left, top, panelW, panelH, 16);
  ctx.fill();
  strokeNeonPath(ctx, '#FF6B00', 'rgba(255, 107, 0, 0.38)', 2.2, 6);

  ctx.fillStyle = '#FF6B00';
  ctx.beginPath();
  ctx.roundRect(left, top, panelW, 28, [16, 16, 0, 0]);
  ctx.fill();

  ctx.fillStyle = '#0A0A0A';
  ctx.font = '900 10.5px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `🎮 TEST AR: ¿QUÉ MENCIÓN DE DERECHO ERES? (${questionIdx + 1}/${totalQuestions}) • INCLINA TU CABEZA ⬅️ ➡️`,
    cx,
    top + 18
  );

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 14.5px "Orbitron", sans-serif';
  ctx.fillText(questionObj.question.toUpperCase(), cx, top + 52);

  const optW = (panelW - 36) / 2;
  const optH = 58;
  const optY = top + 66;
  const leftOptX = left + 12;
  const rightOptX = left + 24 + optW;

  const drawOptionBox = (bx, label, sideKey, arrowText) => {
    const isSelected = tiltChoice === sideKey;
    const progress = isSelected ? clamp(fillProgress, 0, 1) : 0;

    ctx.save();
    ctx.fillStyle = isSelected ? 'rgba(255, 107, 0, 0.24)' : 'rgba(255, 255, 255, 0.06)';
    ctx.strokeStyle = isSelected ? '#FFFFFF' : 'rgba(255, 107, 0, 0.55)';
    ctx.lineWidth = isSelected ? 2.4 : 1.4;
    ctx.beginPath();
    ctx.roundRect(bx, optY, optW, optH, 10);
    ctx.fill();

    if (progress > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(bx, optY, optW, optH, 10);
      ctx.clip();
      ctx.fillStyle = 'rgba(255, 107, 0, 0.85)';
      ctx.fillRect(bx, optY, optW * progress, optH);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.roundRect(bx, optY, optW, optH, 10);
    ctx.stroke();

    ctx.fillStyle = isSelected ? '#FFFFFF' : '#FF6B00';
    ctx.font = '800 9px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(arrowText, bx + optW / 2, optY + 18);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 11px "Space Grotesk", sans-serif';
    ctx.fillText(label, bx + optW / 2, optY + 40);

    ctx.restore();
  };

  drawOptionBox(leftOptX, questionObj.leftOption, 'LEFT', '⬅️ INCLINA A LA IZQUIERDA');
  drawOptionBox(rightOptX, questionObj.rightOption, 'RIGHT', 'INCLINA A LA DERECHA ➡️');

  ctx.restore();
}

/**
 * Muestra un badge oficial sobre el hombro del estudiante con el título exacto de su mención ganadora:
 * "MENCIÓN: LEGAL TECH Y GOBERNANZA DIGITAL" o "MENCIÓN: JUSTICIA PENAL DIGITAL".
 */
export function drawQuizResultEffects(ctx, person, winnerKey, W, H) {
  if (!person || !winnerKey) return;

  const exactText =
    winnerKey === 'LEGALTECH'
      ? 'MENCIÓN: LEGAL TECH Y GOBERNANZA DIGITAL'
      : 'MENCIÓN: JUSTICIA PENAL DIGITAL';

  const badgeW = 450;
  const badgeH = 44;
  // Ubicado directamente sobre el hombro / parte superior del estudiante
  const bx = clamp(person.shoulderCenterX - badgeW / 2, 16, W - badgeW - 16);
  const by = clamp(
    person.shoulderCenterY - person.shoulderWidth * 0.28,
    92,
    H - 180
  );

  ctx.save();
  ctx.fillStyle = 'rgba(10, 10, 10, 0.94)';
  ctx.beginPath();
  ctx.roundRect(bx, by, badgeW, badgeH, 22);
  ctx.fill();
  strokeNeonPath(ctx, '#FF6B00', 'rgba(255, 107, 0, 0.48)', 2.5, 6.5);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 12.5px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`⚖️ ${exactText}`, bx + badgeW / 2, by + badgeH / 2);
  ctx.restore();
}

export function drawSynergyConnectionBeam(ctx, x1, y1, x2, y2, time = 0) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  ctx.strokeStyle = 'rgba(255, 107, 0, 0.85)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const bx = lerp(x1, x2, t);
    const by =
      lerp(y1, y2, t) + Math.sin(t * Math.PI * 5 + time * 0.014) * 12 * Math.sin(t * Math.PI);
    if (i === 0) ctx.moveTo(bx, by);
    else ctx.lineTo(bx, by);
  }
  ctx.stroke();

  ctx.globalCompositeOperation = 'source-over';
  const badgeW = 340;
  const badgeH = 34;
  ctx.fillStyle = 'rgba(10, 10, 10, 0.92)';
  ctx.strokeStyle = '#FF6B00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(midX - badgeW / 2, midY - badgeH / 2, badgeW, badgeH, 17);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 11px "Orbitron", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚖️ CONEXIÓN JURÍDICA • DERECHO UNIFRANZ', midX, midY);

  ctx.restore();
}

// ============================================================================
// 7. UTILIDADES MATEMÁTICAS DE MANO Y GESTOS
// ============================================================================
export function computePalmCenterAndTilt(handLm, toScreenX, toScreenY) {
  const indices = [0, 5, 9, 13, 17];
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < indices.length; i++) {
    const idx = indices[i];
    sumX += toScreenX(handLm[idx].x);
    sumY += toScreenY(handLm[idx].y);
  }
  const cx = sumX / indices.length;
  const cy = sumY / indices.length;

  const p5x = toScreenX(handLm[5].x);
  const p5y = toScreenY(handLm[5].y);
  const p17x = toScreenX(handLm[17].x);
  const p17y = toScreenY(handLm[17].y);

  const wristX = toScreenX(handLm[0].x);
  const middleX = toScreenX(handLm[9].x);
  const palmSpan = Math.hypot(p17x - p5x, p17y - p5y);

  const knuckleTilt = Math.atan2(p17y - p5y, Math.abs(p17x - p5x) + 1);
  const lateralLean = clamp((middleX - wristX) / (palmSpan + 20), -0.65, 0.65);
  const tiltAngle = clamp(lateralLean * 0.7 + knuckleTilt * 0.35, -0.6, 0.6);

  return { x: cx, y: cy, tiltAngle, palmSpan };
}

export function analyzeHandGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;

  const wrist = landmarks[0];
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  const indexExt = dist(landmarks[8], wrist) > dist(landmarks[6], wrist) * 1.15;
  const middleExt = dist(landmarks[12], wrist) > dist(landmarks[10], wrist) * 1.15;
  const ringExt = dist(landmarks[16], wrist) > dist(landmarks[14], wrist) * 1.14;
  const pinkyExt = dist(landmarks[20], wrist) > dist(landmarks[18], wrist) * 1.14;

  const indexUp = indexExt && landmarks[8].y < landmarks[6].y;
  const middleUp = middleExt && landmarks[12].y < landmarks[10].y;
  const ringUp = ringExt && landmarks[16].y < landmarks[14].y;
  const pinkyUp = pinkyExt && landmarks[20].y < landmarks[18].y;

  const indexFolded = dist(landmarks[8], wrist) < dist(landmarks[6], wrist) * 1.13;
  const middleFolded = dist(landmarks[12], wrist) < dist(landmarks[10], wrist) * 1.13;
  const ringFolded = dist(landmarks[16], wrist) < dist(landmarks[14], wrist) * 1.13;
  const pinkyFolded = dist(landmarks[20], wrist) < dist(landmarks[18], wrist) * 1.13;

  if (indexFolded && middleFolded && ringFolded && pinkyFolded) {
    return 'FIST';
  }

  if (indexUp && pinkyUp && middleFolded && ringFolded) {
    return 'ROCK';
  }

  if (indexUp && middleUp && ringUp && pinkyUp) {
    return 'OPEN_PALM';
  }

  return 'RAISED_PALM';
}
