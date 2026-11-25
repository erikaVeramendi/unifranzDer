import { AR_CONFIG } from '../config.js';
import {
  analyzeHandGesture,
  clamp,
  computePalmCenterAndTilt,
  lerp,
  lerpAngle,
} from './arHelpers.js';

let nextPersonId = 1;
let nextHandId = 1;

/**
 * Calcula el ángulo de rotación entre el punto izquierdo y derecho en pantalla
 * evitando inversiones de 180°.
 */
function orderedAngle(ax, ay, bx, by, maxAbsRad) {
  const lx = ax <= bx ? ax : bx;
  const ly = ax <= bx ? ay : by;
  const rx = ax <= bx ? bx : ax;
  const ry = ax <= bx ? by : ay;
  const angle = Math.atan2(ry - ly, Math.max(1, rx - lx));
  return clamp(angle, -maxAbsRad, maxAbsRad);
}

/**
 * Extrae y valida rostros desde FaceLandmarker (anclado en sienes 127 y 356, ojos 33 y 263, frente 10, mentón 152)
 * y deriva las proporciones anatómicas de hombros y torso a 60 FPS.
 */
export function extractValidFaces(rawFaces, toScreenX, toScreenY) {
  const results = [];

  for (let i = 0; i < rawFaces.length; i++) {
    const lm = rawFaces[i];
    if (!lm || !lm[33] || !lm[263]) continue;

    const ex1 = toScreenX(lm[33].x);
    const ey1 = toScreenY(lm[33].y);
    const ex2 = toScreenX(lm[263].x);
    const ey2 = toScreenY(lm[263].y);

    const eyeOuterDist = Math.hypot(ex1 - ex2, ey1 - ey2);
    if (eyeOuterDist < 6) continue;

    const eyeCenterX = (ex1 + ex2) / 2;
    const eyeCenterY = (ey1 + ey2) / 2;

    const rightEyeX = ex1 <= ex2 ? ex1 : ex2;
    const rightEyeY = ex1 <= ex2 ? ey1 : ey2;
    const leftEyeX = ex1 <= ex2 ? ex2 : ex1;
    const leftEyeY = ex1 <= ex2 ? ey2 : ey1;

    const noseLm = lm[1] || { x: (lm[33].x + lm[263].x) / 2, y: (lm[33].y + lm[263].y) / 2 };
    const noseX = toScreenX(noseLm.x);
    const noseY = toScreenY(noseLm.y);

    const headRoll = orderedAngle(ex1, ey1, ex2, ey2, AR_CONFIG.MAX_ROLL_RAD);
    const headYaw = clamp((noseX - eyeCenterX) / (eyeOuterDist * 0.7), -0.8, 0.8);
    const headPitch = clamp((noseY - eyeCenterY) / (eyeOuterDist * 0.9) - 0.35, -0.5, 0.5);

    const foreheadX = lm[10]
      ? toScreenX(lm[10].x)
      : eyeCenterX - Math.sin(headRoll) * eyeOuterDist * 0.65;
    const foreheadY = lm[10]
      ? toScreenY(lm[10].y)
      : eyeCenterY - Math.cos(headRoll) * eyeOuterDist * 0.65;

    const chinX = lm[152]
      ? toScreenX(lm[152].x)
      : eyeCenterX + Math.sin(headRoll) * eyeOuterDist * 1.35;
    const chinY = lm[152]
      ? toScreenY(lm[152].y)
      : eyeCenterY + Math.cos(headRoll) * eyeOuterDist * 1.35;

    const faceHeight = Math.max(
      eyeOuterDist * 1.45,
      Math.hypot(chinX - foreheadX, chinY - foreheadY)
    );

    let templeWidth = eyeOuterDist * 1.48;
    if (lm[127] && lm[356]) {
      const tx1 = toScreenX(lm[127].x);
      const ty1 = toScreenY(lm[127].y);
      const tx2 = toScreenX(lm[356].x);
      const ty2 = toScreenY(lm[356].y);
      templeWidth = Math.max(eyeOuterDist * 1.2, Math.hypot(tx2 - tx1, ty2 - ty1));
    }

    const shoulderWidth = Math.max(templeWidth * 2.35, eyeOuterDist * 3.4);
    const shoulderCenterX = eyeCenterX;
    const shoulderCenterY = chinY + faceHeight * 0.42;
    const torsoHeight = shoulderWidth * 1.35;
    const hipCenterX = shoulderCenterX;
    const hipCenterY = shoulderCenterY + torsoHeight;

    results.push({
      eyeCenterX,
      eyeCenterY,
      eyeOuterDist,
      rightEyeX,
      rightEyeY,
      leftEyeX,
      leftEyeY,
      foreheadX,
      foreheadY,
      chinX,
      chinY,
      faceHeight,
      templeWidth,
      noseX,
      noseY,
      headRoll,
      headYaw,
      headPitch,
      shoulderCenterX,
      shoulderCenterY,
      hipCenterX,
      hipCenterY,
      shoulderWidth,
      torsoHeight,
    });
  }

  return results.slice(0, AR_CONFIG.MAX_PERSONS);
}

/**
 * Actualiza el seguimiento multi-persona con lerp = 0.70 (AR_CONFIG.FAST_LERP_FACE)
 * para respuesta instantánea sin retraso.
 */
export function updateTrackedPersonsFromFaces(trackedPersons, faces, canvasWidth, now) {
  const maxTrackDist = canvasWidth * AR_CONFIG.BODY_TRACK_MAX_DIST_NORM;
  const alpha = AR_CONFIG.FAST_LERP_FACE; // 0.70 exacto

  const pairs = [];
  for (let fIdx = 0; fIdx < faces.length; fIdx++) {
    const face = faces[fIdx];
    for (let tIdx = 0; tIdx < trackedPersons.length; tIdx++) {
      const p = trackedPersons[tIdx];
      const dist = Math.hypot(face.eyeCenterX - p.vrCenterX, face.eyeCenterY - p.vrCenterY);
      if (dist <= maxTrackDist) {
        pairs.push({ fIdx, tIdx, dist });
      }
    }
  }

  pairs.sort((a, b) => a.dist - b.dist);
  const matchedFace = new Set();
  const matchedTracked = new Set();

  for (const pair of pairs) {
    if (matchedFace.has(pair.fIdx) || matchedTracked.has(pair.tIdx)) continue;
    matchedFace.add(pair.fIdx);
    matchedTracked.add(pair.tIdx);

    const person = trackedPersons[pair.tIdx];
    const face = faces[pair.fIdx];
    person.lastSeenTime = now;
    person.hasFace = true;
    person.hasVr = true;

    const targetGlassesW = Math.max(
      face.templeWidth * 1.14,
      face.eyeOuterDist * AR_CONFIG.GLASSES_WIDTH_FACTOR
    );

    person.vrCenterX = lerp(person.vrCenterX, face.eyeCenterX, alpha);
    person.vrCenterY = lerp(person.vrCenterY, face.eyeCenterY, alpha);
    person.vrWidth = lerp(person.vrWidth, targetGlassesW, alpha);
    person.vrAngle = lerpAngle(person.vrAngle, face.headRoll, alpha);

    person.foreheadX = lerp(person.foreheadX, face.foreheadX, alpha);
    person.foreheadY = lerp(person.foreheadY, face.foreheadY, alpha);
    person.chinX = lerp(person.chinX, face.chinX, alpha);
    person.chinY = lerp(person.chinY, face.chinY, alpha);
    person.faceHeight = lerp(person.faceHeight, face.faceHeight, alpha);
    person.templeWidth = lerp(person.templeWidth, face.templeWidth, alpha);
    person.rightEyeX = lerp(person.rightEyeX, face.rightEyeX, alpha);
    person.rightEyeY = lerp(person.rightEyeY, face.rightEyeY, alpha);
    person.leftEyeX = lerp(person.leftEyeX, face.leftEyeX, alpha);
    person.leftEyeY = lerp(person.leftEyeY, face.leftEyeY, alpha);
    person.headYaw = lerp(person.headYaw, face.headYaw, alpha);

    person.shoulderCenterX = lerp(person.shoulderCenterX, face.shoulderCenterX, alpha);
    person.shoulderCenterY = lerp(person.shoulderCenterY, face.shoulderCenterY, alpha);
    person.hipCenterX = lerp(person.hipCenterX, face.hipCenterX, alpha);
    person.hipCenterY = lerp(person.hipCenterY, face.hipCenterY, alpha);
    person.shoulderWidth = lerp(person.shoulderWidth, face.shoulderWidth, alpha);
    person.torsoHeight = lerp(person.torsoHeight, face.torsoHeight, alpha);
    person.shoulderAngle = lerpAngle(person.shoulderAngle, face.headRoll * 0.35, alpha);
  }

  for (let fIdx = 0; fIdx < faces.length; fIdx++) {
    if (matchedFace.has(fIdx)) continue;
    if (trackedPersons.length >= AR_CONFIG.MAX_PERSONS) break;

    const face = faces[fIdx];
    const id = nextPersonId++;
    const glassesInitW = Math.max(
      face.templeWidth * 1.14,
      face.eyeOuterDist * AR_CONFIG.GLASSES_WIDTH_FACTOR
    );

    trackedPersons.push({
      id,
      lastSeenTime: now,
      hasFace: true,
      hasVr: true,
      vrCenterX: face.eyeCenterX,
      vrCenterY: face.eyeCenterY,
      vrWidth: glassesInitW,
      vrAngle: face.headRoll,
      foreheadX: face.foreheadX,
      foreheadY: face.foreheadY,
      chinX: face.chinX,
      chinY: face.chinY,
      faceHeight: face.faceHeight,
      templeWidth: face.templeWidth,
      rightEyeX: face.rightEyeX,
      rightEyeY: face.rightEyeY,
      leftEyeX: face.leftEyeX,
      leftEyeY: face.leftEyeY,
      headYaw: face.headYaw,
      shoulderCenterX: face.shoulderCenterX,
      shoulderCenterY: face.shoulderCenterY,
      hipCenterX: face.hipCenterX,
      hipCenterY: face.hipCenterY,
      shoulderWidth: face.shoulderWidth,
      torsoHeight: face.torsoHeight,
      shoulderAngle: face.headRoll * 0.35,
    });
  }

  for (let i = trackedPersons.length - 1; i >= 0; i--) {
    if (now - trackedPersons[i].lastSeenTime > AR_CONFIG.PERSON_TIMEOUT_MS) {
      trackedPersons.splice(i, 1);
    }
  }

  trackedPersons.sort((a, b) => a.shoulderCenterX - b.shoulderCenterX);
}

/**
 * Rastrea las manos detectadas con lerp = 0.70 e incluye:
 * - Velocidad vertical hacia abajo (`vy`) e historial de estela (`trailPoints`) para el Mazo de Juez
 * - Lado anatómico en espejo (`RIGHT_HAND` vs `LEFT_HAND`)
 * - Detección de mano abierta (`isOpenHand4Fingers`) y puño cerrado (`gesture === 'FIST'`)
 */
export function updateTrackedHands(
  trackedHands,
  handLandmarksList,
  persons,
  toScreenX,
  toScreenY,
  canvasWidth,
  now
) {
  const maxHandDist = canvasWidth * AR_CONFIG.HAND_TRACK_MAX_DIST_NORM;
  const alpha = AR_CONFIG.FAST_LERP_HAND; // 0.70

  const currentHands = [];
  if (handLandmarksList && handLandmarksList.length > 0 && persons.length > 0) {
    const limit = Math.min(handLandmarksList.length, AR_CONFIG.MAX_HANDS);
    for (let i = 0; i < limit; i++) {
      const handLm = handLandmarksList[i];
      if (!handLm || handLm.length < 21) continue;

      const palm = computePalmCenterAndTilt(handLm, toScreenX, toScreenY);
      const gesture = analyzeHandGesture(handLm);

      let fingersAbovePipCount = 0;
      const tipPipPairs = [
        [8, 6],
        [12, 10],
        [16, 14],
        [20, 18],
      ];
      for (let f = 0; f < tipPipPairs.length; f++) {
        const [tipIdx, pipIdx] = tipPipPairs[f];
        if (handLm[tipIdx].y < handLm[pipIdx].y) {
          fingersAbovePipCount++;
        }
      }
      const isOpenHand4Fingers = fingersAbovePipCount >= 4 || gesture === 'OPEN_PALM';

      let ownerPerson = persons[0];
      let bestPersonDist = Infinity;
      for (let pIdx = 0; pIdx < persons.length; pIdx++) {
        const p = persons[pIdx];
        const d = Math.hypot(palm.x - p.shoulderCenterX, palm.y - p.shoulderCenterY);
        if (d < bestPersonDist) {
          bestPersonDist = d;
          ownerPerson = p;
        }
      }

      // En vista espejo: la mano derecha de la persona aparece a la derecha de su eje central (x >= shoulderCenterX),
      // y la mano izquierda aparece a la izquierda (x < shoulderCenterX).
      const anatomicalSide =
        palm.x >= ownerPerson.shoulderCenterX ? 'RIGHT_HAND' : 'LEFT_HAND';

      const wristScreenX = toScreenX(handLm[0].x);
      const wristScreenY = toScreenY(handLm[0].y);

      const fingerTips = [4, 8, 12, 16, 20].map((idx) => ({
        x: toScreenX(handLm[idx].x),
        y: toScreenY(handLm[idx].y),
      }));

      currentHands.push({
        x: palm.x,
        y: palm.y,
        wristX: wristScreenX,
        wristY: wristScreenY,
        tiltAngle: palm.tiltAngle,
        palmSpan: palm.palmSpan,
        gesture,
        isOpenHand4Fingers,
        anatomicalSide,
        fingerTips,
        ownerPersonId: ownerPerson.id,
        rawLandmarks: handLm,
      });
    }
  }

  const pairs = [];
  for (let cIdx = 0; cIdx < currentHands.length; cIdx++) {
    const c = currentHands[cIdx];
    for (let tIdx = 0; tIdx < trackedHands.length; tIdx++) {
      const t = trackedHands[tIdx];
      const dist = Math.hypot(c.x - t.x, c.y - t.y);
      if (dist <= maxHandDist) {
        pairs.push({ cIdx, tIdx, dist });
      }
    }
  }

  pairs.sort((a, b) => a.dist - b.dist);
  const matchedCur = new Set();
  const matchedTracked = new Set();

  for (const pair of pairs) {
    if (matchedCur.has(pair.cIdx) || matchedTracked.has(pair.tIdx)) continue;
    matchedCur.add(pair.cIdx);
    matchedTracked.add(pair.tIdx);

    const th = trackedHands[pair.tIdx];
    const ch = currentHands[pair.cIdx];

    const prevY = th.y;
    const newX = lerp(th.x, ch.x, alpha);
    const newY = lerp(th.y, ch.y, alpha);

    // Velocidad vertical instantánea (positiva cuando baja la mano rápido para golpear el mazo)
    const rawVy = newY - prevY;
    th.vy = lerp(th.vy || 0, rawVy, 0.65);

    th.x = newX;
    th.y = newY;
    th.wristX = lerp(th.wristX ?? ch.wristX, ch.wristX, alpha);
    th.wristY = lerp(th.wristY ?? ch.wristY, ch.wristY, alpha);
    th.tiltAngle = lerpAngle(th.tiltAngle, ch.tiltAngle, alpha);
    th.palmSpan = lerp(th.palmSpan, ch.palmSpan, alpha);
    th.gesture = ch.gesture;
    th.isOpenHand4Fingers = ch.isOpenHand4Fingers;
    th.anatomicalSide = ch.anatomicalSide;
    th.fingerTips = ch.fingerTips;
    th.ownerPersonId = ch.ownerPersonId;
    th.rawLandmarks = ch.rawLandmarks;
    th.lastSeenTime = now;
    th.isMissing = false;
    th.alpha = 1.0;

    if (!th.trailPoints) th.trailPoints = [];
    th.trailPoints.push({ x: newX, y: newY });
    if (th.trailPoints.length > 7) {
      th.trailPoints.shift();
    }
  }

  for (let cIdx = 0; cIdx < currentHands.length; cIdx++) {
    if (matchedCur.has(cIdx)) continue;
    if (trackedHands.length >= AR_CONFIG.MAX_HANDS) break;
    const ch = currentHands[cIdx];
    trackedHands.push({
      id: nextHandId++,
      x: ch.x,
      y: ch.y,
      vy: 0,
      trailPoints: [{ x: ch.x, y: ch.y }],
      wristX: ch.wristX,
      wristY: ch.wristY,
      tiltAngle: ch.tiltAngle,
      palmSpan: ch.palmSpan,
      gesture: ch.gesture,
      isOpenHand4Fingers: ch.isOpenHand4Fingers,
      anatomicalSide: ch.anatomicalSide,
      fingerTips: ch.fingerTips,
      ownerPersonId: ch.ownerPersonId,
      rawLandmarks: ch.rawLandmarks,
      lastSeenTime: now,
      isMissing: false,
      alpha: 0.75,
    });
  }

  for (let tIdx = 0; tIdx < trackedHands.length; tIdx++) {
    if (!matchedTracked.has(tIdx)) {
      trackedHands[tIdx].isMissing = true;
    }
  }
}

/**
 * Evalúa si ambas manos están abiertas al frente para desplegar el Código Jurídico Holográfico.
 */
export function evaluateTwoOpenHandsForBook(hands) {
  if (!hands || hands.length < 2) {
    return { isBookGesture: false };
  }

  const openHands = hands.filter((h) => !h.isMissing && h.alpha > 0.35 && h.isOpenHand4Fingers);
  if (openHands.length < 2) {
    return { isBookGesture: false };
  }

  return {
    isBookGesture: true,
    centerX: (openHands[0].x + openHands[1].x) / 2,
    centerY: (openHands[0].y + openHands[1].y) / 2,
  };
}

/**
 * Desvanecimiento suave cuadro a cuadro cuando una mano sale de cuadro.
 */
export function stepTrackedHandsFade(trackedHands, now) {
  const timeout = AR_CONFIG.HAND_TIMEOUT_MS;
  for (let i = trackedHands.length - 1; i >= 0; i--) {
    const h = trackedHands[i];
    if (h.isMissing) {
      const elapsed = now - h.lastSeenTime;
      if (elapsed >= timeout) {
        trackedHands.splice(i, 1);
      } else {
        h.alpha = clamp(1 - elapsed / timeout, 0, 1);
      }
    } else {
      h.alpha = Math.min(1, h.alpha + 0.25);
    }
  }
}
