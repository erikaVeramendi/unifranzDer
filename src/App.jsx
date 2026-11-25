import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  FilesetResolver,
  FaceLandmarker,
  HandLandmarker,
} from '@mediapipe/tasks-vision';
import {
  AR_CONFIG,
  ACCESSORY_MODES,
  LEGAL_ORBIT_ITEMS,
  OFFICIAL_EVENT_TITLE,
  OFFICIAL_CAREER_SUBTITLE,
  OFFICIAL_PROFESSIONAL_PROFILE,
  OFFICIAL_MENTIONS,
  DERECHO_QUIZ_QUESTIONS,
} from './config';
import {
  clamp,
  prewarmLegalBadgeSprites,
  getLegalBadgeSprite,
  drawLegalPillarsOrbit,
  drawLegalTechHudGlasses,
  drawDigitalJusticeLaurels,
  drawBiometricLegalScanner,
  drawHolographicJudgeGavel,
  drawVerdictHologramStamp,
  drawDynamicScalesOfJustice,
  drawForensicDigitalShield,
  drawFloatingLegalCodeBook,
  drawHeadTiltQuizHUD,
  drawQuizResultEffects,
  drawSynergyConnectionBeam,
} from './utils/arHelpers';
import {
  extractValidFaces,
  updateTrackedPersonsFromFaces,
  updateTrackedHands,
  evaluateTwoOpenHandsForBook,
  stepTrackedHandsFade,
} from './utils/personTracker';
import { soundEngine } from './utils/soundEffects';
import LoadingScreen from './components/LoadingScreen';
import UnifranzLogo from './components/UnifranzLogo';
import {
  Scale,
  Glasses,
  Crown,
  Sparkles,
  Users,
  Gavel,
  BookOpen,
  Shield,
  Volume2,
  VolumeX,
  Gamepad2,
  Zap,
  Award,
} from 'lucide-react';

export default function App() {
  // === 1. Estado del Espejo Interactivo 100% en Vivo (Solo Cámara Real, Sin Fondo Negro ni Fotos/QR) ===
  const [accessoryModeIdx, setAccessoryModeIdx] = useState(0); // 0: Lentes HUD LegalTech (por defecto) | 1: Laureles | 2: Modo Líder Jurídico (Ambos)
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const [activeMentionKey, setActiveMentionKey] = useState(null); // null | 'LEGALTECH' | 'PENAL_DIGITAL'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [personDetected, setPersonDetected] = useState(false);

  // Selector opcional de Superpoder Manual / Demo para probar cualquiera de los 4 superpoderes con un clic o por gesto
  const [manualPowerOverride, setManualPowerOverride] = useState(null); // null | 'GAVEL' | 'SCALES' | 'FORENSIC_SHIELD' | 'CODE_BOOK'

  // Controles de Modo Simulación
  const [simTwoPersons, setSimTwoPersons] = useState(false);
  const [simHandMode, setSimHandMode] = useState('GAVEL'); // 'GAVEL' | 'SCALES' | 'FORENSIC_SHIELD' | 'CODE_BOOK'

  // === 6. Minijuego Interactivo: "¿Qué Mención de Derecho es tu Vocación?" ===
  const [quizUiState, setQuizUiState] = useState({
    active: false,
    winner: null, // null | 'LEGALTECH' | 'PENAL_DIGITAL'
  });

  // Estados de carga
  const [loadingProgress, setLoadingProgress] = useState(10);
  const [loadingStatus, setLoadingStatus] = useState(
    'Inicializando motor neuronal MediaPipe GPU...'
  );
  const [cameraError, setCameraError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);

  // Banner superior de notificación de superpoder / veredicto
  const [gestureBanner, setGestureBanner] = useState(null);

  // Refs de DOM y Canvas
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const fpsSpanRef = useRef(null);
  const peopleSpanRef = useRef(null);

  // Espejo del estado en Ref para lectura instantánea dentro de requestAnimationFrame (60 FPS)
  const stateRef = useRef({
    accessoryModeIdx: 0,
    orbitEnabled: true,
    activeMentionKey: null,
    manualPowerOverride: null,
    isSimulationMode: false,
    simTwoPersons: false,
    simHandMode: 'GAVEL',
  });

  useEffect(() => {
    stateRef.current.accessoryModeIdx = accessoryModeIdx;
    stateRef.current.orbitEnabled = orbitEnabled;
    stateRef.current.activeMentionKey = activeMentionKey;
    stateRef.current.manualPowerOverride = manualPowerOverride;
    stateRef.current.isSimulationMode = isSimulationMode;
    stateRef.current.simTwoPersons = simTwoPersons;
    stateRef.current.simHandMode = simHandMode;
  }, [
    accessoryModeIdx,
    orbitEnabled,
    activeMentionKey,
    manualPowerOverride,
    isSimulationMode,
    simTwoPersons,
    simHandMode,
  ]);

  useEffect(() => {
    soundEngine.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Estado del Test AR en Ref
  const quizRef = useRef({
    active: false,
    questionIdx: 0,
    tiltSide: null,
    holdMs: 0,
    lastFrameTs: 0,
    legalTechVotes: 0,
    penalDigitalVotes: 0,
    winner: null,
    simTiltOverride: 0,
  });

  // Modelos MediaPipe Tasks Vision (Solo FaceLandmarker y HandLandmarker en GPU para 60 FPS puros)
  const landmarkersRef = useRef({
    face: null,
    hand: null,
  });

  // Estado de seguimiento a 60 FPS en Ref
  const trackingRef = useRef({
    trackedPersons: [],
    trackedHands: [],
    bookAlpha: 0,
    lastBookSeenTs: 0,
    lastGavelStrikeTs: 0,
    verdictStamp: {
      active: false,
      startTime: 0,
    },
    legalParticles: [],
    shockwaves: [],
  });

  useEffect(() => {
    prewarmLegalBadgeSprites();
  }, []);

  // Soporte de flechas Izquierda/Derecha para responder el Test AR
  useEffect(() => {
    const onKeyDown = (e) => {
      if (quizRef.current.active) {
        if (e.key === 'ArrowLeft') quizRef.current.simTiltOverride = -0.28;
        if (e.key === 'ArrowRight') quizRef.current.simTiltOverride = 0.28;
      }
    };
    const onKeyUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        quizRef.current.simTiltOverride = 0;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const showBanner = useCallback((label) => {
    if (!label) return;
    setGestureBanner(label);
    setTimeout(() => setGestureBanner(null), 2600);
  }, []);

  const triggerEnergyShockwave = useCallback(
    (normX = 0.5, normY = 0.45, label = '') => {
      trackingRef.current.shockwaves.push({
        x: normX,
        y: normY,
        radius: 14,
        maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.76,
        alpha: 0.98,
      });
      if (label) showBanner(label);
    },
    [showBanner]
  );

  const spawnLegalParticles = useCallback(
    (originX, originY, count = 8, isRadialExplosion = false) => {
      const list = trackingRef.current.legalParticles;
      if (list.length > 48) return;

      for (let i = 0; i < count; i++) {
        const item = LEGAL_ORBIT_ITEMS[Math.floor(Math.random() * LEGAL_ORBIT_ITEMS.length)];
        const angle = isRadialExplosion
          ? (i / count) * Math.PI * 2 + Math.random() * 0.3
          : -Math.PI / 2 + (Math.random() - 0.5) * 1.45;
        const speed = isRadialExplosion ? 4.5 + Math.random() * 8 : 3.2 + Math.random() * 5.2;

        list.push({
          item,
          x: originX + (Math.random() - 0.5) * 20,
          y: originY + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 48 + Math.random() * 20,
          alpha: 1,
        });
      }
    },
    []
  );

  /**
   * Acción de "Cerrar Caso" (Bajar el puño derecho rápido):
   *  - Reproduce el sonido contundente de un golpe de mazo de juez (*gavel bang*)
   *  - Genera una onda expansiva circular
   *  - Proyecta el sello gigante holográfico en pantalla: "⚖️ ¡CASO CERRADO! — VEREDICTO: INNOVACIÓN JURÍDICA"
   */
  const triggerGavelStrikeVerdict = useCallback(
    (strikeX, strikeY, W, H, now = performance.now()) => {
      const tState = trackingRef.current;
      if (now - tState.lastGavelStrikeTs < AR_CONFIG.GAVEL_COOLDOWN_MS) return;
      tState.lastGavelStrikeTs = now;

      soundEngine.playGavelStrikeSound();

      tState.verdictStamp = {
        active: true,
        startTime: now,
      };

      const normX = clamp(strikeX / (W || window.innerWidth), 0.15, 0.85);
      const normY = clamp(strikeY / (H || window.innerHeight), 0.15, 0.85);

      triggerEnergyShockwave(
        normX,
        normY,
        '⚖️ ¡CASO CERRADO! — VEREDICTO: INNOVACIÓN JURÍDICA'
      );
      spawnLegalParticles(strikeX, strikeY, 14, true);
    },
    [triggerEnergyShockwave, spawnLegalParticles]
  );

  // Inicializar cámara 854x480 @ 60fps y modelos MediaPipe GPU (Sin ImageSegmenter para máxima fluidez)
  const initExperience = useCallback(async (useSimulation = false) => {
    setCameraError(null);
    setLoadingProgress(25);
    setLoadingStatus('Pre-renderizando badges de la Nueva Malla de Derecho en OffscreenCanvas...');
    prewarmLegalBadgeSprites();

    setLoadingProgress(45);
    setLoadingStatus('Iniciando cámara en vivo 854x480 @ 60 FPS...');

    if (!useSimulation) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: AR_CONFIG.CAMERA_IDEAL_WIDTH },
            height: { ideal: AR_CONFIG.CAMERA_IDEAL_HEIGHT },
            frameRate: { ideal: AR_CONFIG.CAMERA_IDEAL_FPS },
            facingMode: 'user',
          },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        setCameraError(
          'No se detectó una cámara disponible o el permiso fue denegado. Puedes reintentar o activar el Modo Simulación Holográfica.'
        );
        return;
      }
    } else {
      setIsSimulationMode(true);
    }

    setLoadingProgress(70);
    setLoadingStatus('Cargando MediaPipe FaceLandmarker & HandLandmarker (GPU)...');

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/wasm'
      );

      setLoadingProgress(85);
      const [faceLandmarker, handLandmarker] = await Promise.all([
        FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: AR_CONFIG.MAX_PERSONS,
          minFaceDetectionConfidence: AR_CONFIG.FACE_DETECTION_CONFIDENCE,
          minFacePresenceConfidence: AR_CONFIG.FACE_PRESENCE_CONFIDENCE,
          minTrackingConfidence: AR_CONFIG.FACE_TRACKING_CONFIDENCE,
          outputFaceBlendshapes: false,
        }),
        HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: AR_CONFIG.MAX_HANDS,
        }),
      ]);

      landmarkersRef.current = {
        face: faceLandmarker,
        hand: handLandmarker,
      };
    } catch (visionErr) {
      console.warn('Error inicializando MediaPipe:', visionErr);
    }

    setLoadingProgress(100);
    setLoadingStatus(`¡${OFFICIAL_CAREER_SUBTITLE} • 60 FPS Listo!`);
    setTimeout(() => setIsReady(true), 160);
  }, []);

  useEffect(() => {
    initExperience(false);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [initExperience]);

  // Iniciar el Minijuego Interactivo: "¿Qué Mención de Derecho es tu Vocación?"
  const startDerechoQuiz = useCallback(() => {
    soundEngine.playUiClickSound();
    quizRef.current = {
      active: true,
      questionIdx: 0,
      tiltSide: null,
      holdMs: 0,
      lastFrameTs: performance.now(),
      legalTechVotes: 0,
      penalDigitalVotes: 0,
      winner: null,
      simTiltOverride: 0,
    };
    setQuizUiState({ active: true, winner: null });
    triggerEnergyShockwave(
      0.5,
      0.32,
      '🎮 TEST AR: INCLINA TU CABEZA A IZQUIERDA O DERECHA'
    );
  }, [triggerEnergyShockwave]);

  // ============================================================================
  // BUCLE PRINCIPAL DE RENDERIZADO A 60 FPS (SOLO CÁMARA REAL EN VIVO + HOLOGRAMAS)
  // ============================================================================
  useEffect(() => {
    if (!isReady) return;

    let lastFpsUpdate = performance.now();
    let frameCounter = 0;
    let lastVideoTime = -1;
    let lastDetectTs = 0;

    const renderLoop = (now) => {
      rafRef.current = requestAnimationFrame(renderLoop);

      frameCounter++;
      const fpsElapsed = now - lastFpsUpdate;
      if (fpsElapsed >= 500) {
        const realFps = Math.round((frameCounter * 1000) / fpsElapsed);
        if (fpsSpanRef.current) {
          fpsSpanRef.current.textContent = `${realFps} FPS`;
        }
        const pCount = trackingRef.current.trackedPersons.length;
        if (peopleSpanRef.current) {
          peopleSpanRef.current.textContent = `${pCount}`;
        }
        setPersonDetected(pCount > 0);
        frameCounter = 0;
        lastFpsUpdate = now;
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!canvas) return;

      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const H = canvas.height;
      const tState = trackingRef.current;
      const {
        accessoryModeIdx: accIdx,
        orbitEnabled: showOrbit,
        activeMentionKey: currentMention,
        manualPowerOverride: powerOverride,
        isSimulationMode: sim,
        simTwoPersons: sim2P,
        simHandMode: sHandMode,
      } = stateRef.current;

      const currentAccessory = ACCESSORY_MODES[accIdx] || ACCESSORY_MODES[0];

      let drawX = 0;
      let drawY = 0;
      let drawW = W;
      let drawH = H;
      const vW = video?.videoWidth || 854;
      const vH = video?.videoHeight || 480;

      if (!sim && video && video.readyState >= 2) {
        const vRatio = vW / vH;
        const cRatio = W / H;

        if (vRatio > cRatio) {
          drawH = H;
          drawW = H * vRatio;
          drawX = (W - drawW) / 2;
        } else {
          drawW = W;
          drawH = W / vRatio;
          drawY = (H - drawH) / 2;
        }
      }

      const toScreenX = (normX) => drawX + (1 - normX) * drawW;
      const toScreenY = (normY) => drawY + normY * drawH;

      // === 1. CÁMARA REAL EN VIVO (100VW X 100VH EN MODO ESPEJO) + DETECCIÓN GPU ===
      if (!sim && video && video.readyState >= 2) {
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;

          let ts = Math.max(lastDetectTs + 1, Math.round(now));
          lastDetectTs = ts;

          try {
            let rawFaces = [];
            if (landmarkersRef.current.face) {
              const fRes = landmarkersRef.current.face.detectForVideo(video, ts);
              if (fRes?.faceLandmarks) rawFaces = fRes.faceLandmarks;
            }
            const validFaces = extractValidFaces(rawFaces, toScreenX, toScreenY);
            updateTrackedPersonsFromFaces(tState.trackedPersons, validFaces, W, now);

            if (landmarkersRef.current.hand) {
              ts += 1;
              lastDetectTs = ts;
              const handRes = landmarkersRef.current.hand.detectForVideo(video, ts);
              updateTrackedHands(
                tState.trackedHands,
                handRes?.landmarks || [],
                tState.trackedPersons,
                toScreenX,
                toScreenY,
                W,
                now
              );
            }
          } catch (e) {
            // Continuar en el siguiente frame
          }
        }

        stepTrackedHandsFade(tState.trackedHands, now);

        // Dibujar el feed de la cámara real en modo espejo ocupando toda la pantalla
        ctx.save();
        ctx.translate(W, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, W - drawX - drawW, drawY, drawW, drawH);
        ctx.restore();
      } else if (sim) {
        // === MODO SIMULACIÓN HOLOGRÁFICA A 60 FPS (CUANDO NO HAY CÁMARA FÍSICA) ===
        ctx.fillStyle = '#0D0C0B';
        ctx.fillRect(0, 0, W, H);

        // Sutil retícula ambiental en modo simulación
        ctx.strokeStyle = 'rgba(255, 107, 0, 0.12)';
        ctx.lineWidth = 1;
        const step = 64;
        ctx.beginPath();
        for (let gx = 0; gx < W; gx += step) {
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, H);
        }
        for (let gy = 0; gy < H; gy += step) {
          ctx.moveTo(0, gy);
          ctx.lineTo(W, gy);
        }
        ctx.stroke();

        const breath = Math.sin(now * 0.0025) * 0.008;
        const sway = Math.sin(now * 0.0014) * 0.014;
        const centers = sim2P ? [0.68, 0.32] : [0.5];

        const simQuizTilt = quizRef.current.active
          ? quizRef.current.simTiltOverride !== 0
            ? quizRef.current.simTiltOverride
            : Math.sin(now * 0.0018) * 0.25
          : 0;

        const simFaces = centers.map((cx, idx) => {
          const f = [];
          const s = sway * (idx === 0 ? 1 : -1);
          f[33] = { x: cx + 0.042 + s, y: 0.26 + breath - simQuizTilt * 0.06, z: 0 };
          f[263] = { x: cx - 0.042 + s, y: 0.26 - breath * 0.4 + simQuizTilt * 0.06, z: 0 };
          f[1] = { x: cx + s, y: 0.29 + breath, z: 0 };
          f[10] = { x: cx + s - simQuizTilt * 0.03, y: 0.19 + breath, z: 0 };
          f[152] = { x: cx + s + simQuizTilt * 0.03, y: 0.37 + breath, z: 0 };
          f[127] = { x: cx + 0.065 + s, y: 0.26 + breath - simQuizTilt * 0.06, z: 0 };
          f[356] = { x: cx - 0.065 + s, y: 0.26 + breath + simQuizTilt * 0.06, z: 0 };
          return f;
        });

        const validFaces = extractValidFaces(simFaces, toScreenX, toScreenY);
        updateTrackedPersonsFromFaces(tState.trackedPersons, validFaces, W, now);

        const c0 = centers[0];
        const makeSimHand = (hx, hy, isFist = false, tiltShift = 0) => {
          const arr = Array.from({ length: 21 }, () => ({ x: hx, y: hy, z: 0 }));
          arr[0] = { x: hx - tiltShift * 0.04, y: hy + 0.05, z: 0 };
          arr[5] = { x: hx - 0.025, y: hy - tiltShift * 0.02, z: 0 };
          arr[9] = { x: hx, y: hy, z: 0 };
          arr[13] = { x: hx + 0.015, y: hy + tiltShift * 0.01, z: 0 };
          arr[17] = { x: hx + 0.03, y: hy + tiltShift * 0.02, z: 0 };

          if (isFist) {
            [8, 6, 12, 10, 16, 14, 20, 18].forEach((k) => {
              arr[k] = { x: hx, y: hy + 0.018, z: 0 };
            });
          } else {
            arr[6] = { x: hx - 0.025, y: hy - 0.03, z: 0 };
            arr[8] = { x: hx - 0.025, y: hy - 0.08, z: 0 };
            arr[10] = { x: hx, y: hy - 0.03, z: 0 };
            arr[12] = { x: hx, y: hy - 0.085, z: 0 };
            arr[14] = { x: hx + 0.015, y: hy - 0.03, z: 0 };
            arr[16] = { x: hx + 0.015, y: hy - 0.08, z: 0 };
            arr[18] = { x: hx + 0.03, y: hy - 0.03, z: 0 };
            arr[20] = { x: hx + 0.03, y: hy - 0.075, z: 0 };
          }
          return arr;
        };

        let simHandsList = [];
        if (sHandMode === 'GAVEL') {
          // ✊ Puño Cerrado Derecho (normX < c0 aparece a la derecha de la pantalla)
          const cycle = (now % 2600) / 2600;
          const strikeDrop =
            cycle > 0.72 && cycle < 0.84
              ? Math.sin(((cycle - 0.72) / 0.12) * Math.PI) * 0.18
              : 0;
          simHandsList = [makeSimHand(c0 - 0.17, 0.45 + strikeDrop, true, 0)];
        } else if (sHandMode === 'SCALES') {
          // 🖐️ Mano Izquierda Abierta (normX > c0 aparece a la izquierda de la pantalla)
          const scaleTilt = Math.sin(now * 0.0022) * 0.35;
          simHandsList = [makeSimHand(c0 + 0.17, 0.48 + breath, false, scaleTilt)];
        } else if (sHandMode === 'FORENSIC_SHIELD') {
          // 🖐️ Mano Derecha Abierta (normX < c0 aparece a la derecha de la pantalla)
          simHandsList = [makeSimHand(c0 - 0.17, 0.48 + breath, false, 0)];
        } else if (sHandMode === 'CODE_BOOK') {
          // 🖐️🖐️ Ambas Manos Abiertas al frente
          simHandsList = [
            makeSimHand(c0 + 0.16, 0.52 + breath, false, 0),
            makeSimHand(c0 - 0.16, 0.52 - breath, false, 0),
          ];
        }

        updateTrackedHands(
          tState.trackedHands,
          simHandsList,
          tState.trackedPersons,
          toScreenX,
          toScreenY,
          W,
          now
        );
        stepTrackedHandsFade(tState.trackedHands, now);
      } else {
        ctx.fillStyle = '#0A0A0A';
        ctx.fillRect(0, 0, W, H);
      }

      const persons = tState.trackedPersons;
      const effectiveMention = currentMention || quizRef.current.winner;

      // === 2. CAPA AR FACIAL & ÓRBITA JURÍDICA ===
      for (let idx = 0; idx < persons.length; idx++) {
        const person = persons[idx];

        // 5) Órbita Jurídica alrededor de la silueta (sin tapar el rostro)
        if (showOrbit) {
          drawLegalPillarsOrbit(ctx, person, effectiveMention, now + idx * 600);
        }

        // 3.3) Escáner facial biométrico en naranja (Modo Líder Jurídico)
        if (currentAccessory.biometricScanner && person.hasVr) {
          drawBiometricLegalScanner(ctx, person, now);
        }

        // 3.1) Lentes HUD LegalTech (Por defecto y en Modo Líder Jurídico)
        if (currentAccessory.hudGlasses && person.hasVr) {
          drawLegalTechHudGlasses(
            ctx,
            person.vrCenterX,
            person.vrCenterY,
            person.vrWidth,
            person.vrAngle,
            person.headYaw || 0,
            now
          );
        }

        // 3.2) Laureles Digitales de la Justicia
        if (currentAccessory.laurels && person.hasVr) {
          drawDigitalJusticeLaurels(ctx, person, now);
        }

        // Badge oficial sobre el hombro con la mención ganadora
        if (idx === 0 && effectiveMention) {
          drawQuizResultEffects(ctx, person, effectiveMention, W, H);
        }
      }

      // === 3. MINIJUEGO INTERACTIVO: "¿QUÉ MENCIÓN DE DERECHO ES TU VOCACIÓN?" ===
      if (quizRef.current.active && persons.length > 0) {
        const player = persons[0];
        const qState = quizRef.current;
        const dt = Math.min(100, Math.max(8, now - (qState.lastFrameTs || now)));
        qState.lastFrameTs = now;

        const currentQuestion = DERECHO_QUIZ_QUESTIONS[qState.questionIdx];
        if (currentQuestion) {
          const roll =
            qState.simTiltOverride !== 0
              ? qState.simTiltOverride
              : player.vrAngle || player.shoulderAngle * 1.4;
          const threshold = AR_CONFIG.QUIZ_HEAD_TILT_THRESHOLD_RAD;

          let detectedChoice = null;
          if (roll < -threshold) {
            detectedChoice = 'LEFT';
          } else if (roll > threshold) {
            detectedChoice = 'RIGHT';
          }

          if (detectedChoice && detectedChoice === qState.tiltSide) {
            qState.holdMs += dt;
          } else if (detectedChoice) {
            qState.tiltSide = detectedChoice;
            qState.holdMs = dt;
          } else {
            qState.holdMs = Math.max(0, qState.holdMs - dt * 1.5);
            if (qState.holdMs === 0) qState.tiltSide = null;
          }

          const fillProgress = clamp(qState.holdMs / AR_CONFIG.QUIZ_FILL_DURATION_MS, 0, 1);

          drawHeadTiltQuizHUD(
            ctx,
            player,
            currentQuestion,
            qState.questionIdx,
            DERECHO_QUIZ_QUESTIONS.length,
            qState.tiltSide,
            fillProgress,
            W,
            H
          );

          if (fillProgress >= 1) {
            soundEngine.playUiClickSound();
            if (qState.tiltSide === 'LEFT') {
              qState.legalTechVotes += 1;
            } else {
              qState.penalDigitalVotes += 1;
            }

            qState.holdMs = 0;
            qState.tiltSide = null;
            qState.questionIdx += 1;

            if (qState.questionIdx < DERECHO_QUIZ_QUESTIONS.length) {
              triggerEnergyShockwave(
                player.vrCenterX / W,
                player.vrCenterY / H,
                `⚖️ DILEMA ${qState.questionIdx}/3 REGISTRADO`
              );
            } else {
              const winnerKey =
                qState.legalTechVotes >= qState.penalDigitalVotes
                  ? 'LEGALTECH'
                  : 'PENAL_DIGITAL';
              const officialTitle =
                winnerKey === 'LEGALTECH'
                  ? OFFICIAL_MENTIONS.LEGALTECH
                  : OFFICIAL_MENTIONS.PENAL_DIGITAL;

              qState.active = false;
              qState.winner = winnerKey;

              // Equipar automáticamente Laureles Digitales + Lentes LegalTech (Modo Líder Jurídico)
              setAccessoryModeIdx(2);
              setActiveMentionKey(winnerKey);
              setQuizUiState({ active: false, winner: winnerKey });

              // Acorde triunfal sutil
              soundEngine.playTriumphantMentionChord();
              spawnLegalParticles(player.shoulderCenterX, player.shoulderCenterY, 16, true);
              triggerEnergyShockwave(
                player.shoulderCenterX / W,
                player.shoulderCenterY / H,
                `🏆 MENCIÓN: ${officialTitle.toUpperCase()}`
              );
            }
          }
        }
      }

      // === 4. CONEXIÓN JURÍDICA MULTI-PERSONA ===
      if (persons.length >= 2) {
        for (let i = 0; i < persons.length - 1; i++) {
          const p1 = persons[i];
          const p2 = persons[i + 1];
          const distBetween = Math.hypot(
            p2.shoulderCenterX - p1.shoulderCenterX,
            p2.shoulderCenterY - p1.shoulderCenterY
          );
          if (distBetween < W * 0.72) {
            drawSynergyConnectionBeam(
              ctx,
              p1.shoulderCenterX,
              p1.shoulderCenterY + p1.torsoHeight * 0.15,
              p2.shoulderCenterX,
              p2.shoulderCenterY + p2.torsoHeight * 0.15,
              now
            );
          }
        }
      }

      // === 5. LOS 4 SUPERPODERES INTERACTIVOS DE DERECHO CON MANOS + SONIDO WEB AUDIO ===
      const trackedHands = tState.trackedHands;
      const handsByPersonId = new Map();

      for (let i = 0; i < trackedHands.length; i++) {
        const hand = trackedHands[i];
        if (hand.alpha <= 0.02) continue;

        if (!handsByPersonId.has(hand.ownerPersonId)) {
          handsByPersonId.set(hand.ownerPersonId, []);
        }
        handsByPersonId.get(hand.ownerPersonId).push(hand);

        // Nodos articulares naranjas en la mano detectada
        if (!hand.isMissing && hand.rawLandmarks) {
          ctx.save();
          ctx.globalAlpha = hand.alpha;
          ctx.fillStyle = '#FF6B00';
          const keyPts = [0, 5, 9, 13, 17, 4, 8, 12, 16, 20];
          for (let k = 0; k < keyPts.length; k++) {
            const pt = hand.rawLandmarks[keyPts[k]];
            ctx.beginPath();
            ctx.arc(toScreenX(pt.x), toScreenY(pt.y), 3, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      let anyBookActive = powerOverride === 'CODE_BOOK';

      handsByPersonId.forEach((hands, ownerId) => {
        const person = persons.find((p) => p.id === ownerId) || persons[0];
        if (!person) return;

        // SUPERPODER 4: 🖐️🖐️ AMBAS MANOS ABIERTAS -> CÓDIGO JURÍDICO HOLOGRÁFICO EN EL AIRE + MICROCREDENCIALES
        const bookEval = evaluateTwoOpenHandsForBook(hands);
        if (bookEval.isBookGesture || powerOverride === 'CODE_BOOK') {
          anyBookActive = true;
          tState.lastBookSeenTs = now;
          if (tState.bookAlpha < 0.2) {
            soundEngine.playHolographicBookSound();
          }
          tState.bookAlpha = Math.min(1, tState.bookAlpha + 0.22);

          drawFloatingLegalCodeBook(
            ctx,
            bookEval.isBookGesture ? bookEval.centerX : person.shoulderCenterX,
            bookEval.isBookGesture
              ? bookEval.centerY + 10
              : person.shoulderCenterY + person.torsoHeight * 0.34,
            Math.max(330, person.shoulderWidth * 1.38),
            now,
            tState.bookAlpha
          );
          return;
        }

        // SUPERPODERES DE UNA MANO:
        // 1) ✊ PUÑO CERRADO DERECHO -> MAZO DE JUEZ INTERACTIVO 3D + GOLPE "¡CASO CERRADO!"
        // 2) 🖐️ MANO IZQUIERDA ABIERTA -> BALANZA DE LA JUSTICIA DINÁMICA + MENCIÓN 1 ("Legal Tech y Gobernanza Digital")
        // 3) 🖐️ MANO DERECHA ABIERTA -> ESCUDO FORENSE & CIBERJUSTICIA + MENCIÓN 2 ("Justicia Penal Digital")
        hands.forEach((h) => {
          const isRightHand = h.anatomicalSide === 'RIGHT_HAND';
          const isFist = h.gesture === 'FIST';

          if (isFist || powerOverride === 'GAVEL') {
            const gavelSize = Math.max(96, person.shoulderWidth * 0.42);
            drawHolographicJudgeGavel(
              ctx,
              h.x,
              h.y,
              gavelSize,
              h.tiltAngle,
              now,
              h.vy || 0,
              h.trailPoints || [],
              h.alpha
            );

            // Detectar acción de "Cerrar Caso" (Bajar el puño rápido)
            if ((h.vy || 0) >= AR_CONFIG.GAVEL_STRIKE_VELOCITY_THRESHOLD) {
              triggerGavelStrikeVerdict(h.x, h.y, W, H, now);
            }
          } else if (h.isOpenHand4Fingers || h.gesture === 'OPEN_PALM') {
            if (!isRightHand || powerOverride === 'SCALES') {
              // 🖐️ Mano Izquierda Abierta: Balanza de la Justicia Dinámica + Mención 1 ("Legal Tech y Gobernanza Digital")
              const scaleRadius = Math.max(66, person.shoulderWidth * 0.31);
              drawDynamicScalesOfJustice(
                ctx,
                h.x,
                h.y - 26,
                scaleRadius,
                h.tiltAngle,
                now,
                h.alpha,
                () => {
                  soundEngine.playScaleBalancedChime();
                }
              );
            } else {
              // 🖐️ Mano Derecha Abierta: Escudo Hexagonal de Evidencia Digital + Mención 2 ("Justicia Penal Digital")
              soundEngine.playForensicShieldSound();
              const shieldRadius = Math.max(66, person.shoulderWidth * 0.31);
              drawForensicDigitalShield(ctx, h.x, h.y - 20, shieldRadius, now, h.alpha);
            }
          }
        });
      });

      // Vista previa si el usuario activa un superpoder con clic en la tarjeta de gestos sin manos frente a cámara
      if (powerOverride && persons.length > 0 && trackedHands.length === 0) {
        const p0 = persons[0];
        const cx = p0.shoulderCenterX;
        const cy = p0.shoulderCenterY + p0.torsoHeight * 0.28;

        if (powerOverride === 'GAVEL') {
          const demoDrop = Math.sin(now * 0.008) * 18;
          drawHolographicJudgeGavel(
            ctx,
            cx + p0.shoulderWidth * 0.35,
            cy + demoDrop,
            Math.max(98, p0.shoulderWidth * 0.42),
            0.15,
            now,
            Math.cos(now * 0.008) * 14,
            [],
            1
          );
        } else if (powerOverride === 'SCALES') {
          const demoTilt = Math.sin(now * 0.0025) * 0.28;
          drawDynamicScalesOfJustice(
            ctx,
            cx - p0.shoulderWidth * 0.35,
            cy,
            Math.max(68, p0.shoulderWidth * 0.32),
            demoTilt,
            now,
            1,
            () => soundEngine.playScaleBalancedChime()
          );
        } else if (powerOverride === 'FORENSIC_SHIELD') {
          drawForensicDigitalShield(
            ctx,
            cx + p0.shoulderWidth * 0.35,
            cy,
            Math.max(68, p0.shoulderWidth * 0.32),
            now,
            1
          );
        } else if (powerOverride === 'CODE_BOOK') {
          tState.lastBookSeenTs = now;
          tState.bookAlpha = 1;
          drawFloatingLegalCodeBook(
            ctx,
            cx,
            cy + 20,
            Math.max(330, p0.shoulderWidth * 1.38),
            now,
            1
          );
        }
      }

      if (!anyBookActive && tState.bookAlpha > 0) {
        const elapsed = now - tState.lastBookSeenTs;
        tState.bookAlpha = clamp(1 - elapsed / AR_CONFIG.BOOK_FADE_DURATION_MS, 0, 1);
      }

      // === 6. PARTÍCULAS DE BADGES JURÍDICOS ===
      if (tState.legalParticles.length > 0) {
        for (let i = tState.legalParticles.length - 1; i >= 0; i--) {
          const lp = tState.legalParticles[i];
          lp.x += lp.vx;
          lp.y += lp.vy;
          lp.vy -= 0.035;
          lp.alpha -= 0.016;

          if (lp.alpha <= 0.03 || lp.x < -80 || lp.x > W + 80 || lp.y < -80 || lp.y > H + 80) {
            tState.legalParticles.splice(i, 1);
            continue;
          }

          const sprite = getLegalBadgeSprite(lp.item);
          ctx.save();
          ctx.globalAlpha = lp.alpha;
          ctx.drawImage(sprite, lp.x - lp.size / 2, lp.y - lp.size / 2, lp.size, lp.size);
          ctx.restore();
        }
      }

      // === 7. ONDAS EXPANSIVAS CIRCULARES NARANJA NEÓN ===
      for (let i = tState.shockwaves.length - 1; i >= 0; i--) {
        const sw = tState.shockwaves[i];
        sw.radius += 26;
        sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(255, 107, 0, ${sw.alpha})`;
        ctx.lineWidth = 6 * sw.alpha + 1.5;
        ctx.beginPath();
        ctx.arc(sw.x * W, sw.y * H, sw.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${sw.alpha * 0.7})`;
        ctx.lineWidth = 2.5 * sw.alpha;
        ctx.beginPath();
        ctx.arc(sw.x * W, sw.y * H, sw.radius * 0.78, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        if (sw.alpha <= 0.03) {
          tState.shockwaves.splice(i, 1);
        }
      }

      // === 8. SELLO GIGANTE HOLOGRÁFICO EN PANTALLA ("⚖️ ¡CASO CERRADO! — VEREDICTO: INNOVACIÓN JURÍDICA") ===
      drawVerdictHologramStamp(ctx, tState.verdictStamp, W, H, now);
    };

    rafRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isReady, triggerEnergyShockwave, spawnLegalParticles, triggerGavelStrikeVerdict]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A0A0A] select-none">
      <video ref={videoRef} playsInline muted className="hidden" />

      {!isReady && (
        <LoadingScreen
          progress={loadingProgress}
          statusText={loadingStatus}
          error={cameraError}
          onRetry={() => initExperience(false)}
          onStartDemo={() => initExperience(true)}
        />
      )}

      {/* Feed de Cámara Real en Vivo + Hologramas AR (100vw x 100vh) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />

      {/* Viñeta oscura sutil en los bordes (GPU-composited) para que los hologramas naranjas y blancos resalten con total claridad */}
      <div
        className="pointer-events-none fixed inset-0 z-10 border-2 border-[#FF6B00]/55"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(10,10,10,0) 58%, rgba(10,10,10,0.46) 86%, rgba(10,10,10,0.78) 100%)',
        }}
      />

      {/* ==================================================================== */}
      {/* 1. HEADER OFICIAL: Logo + "INAUGURACIÓN NUEVA MALLA CURRICULAR" + "DERECHO — UNIFRANZ" */}
      {/* ==================================================================== */}
      <header className="fixed top-0 inset-x-0 z-20 p-3 md:px-6 md:py-4 flex items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto glass-panel px-4 py-2.5 rounded-2xl flex items-center gap-3.5 border border-[#FF6B00]/60">
          <UnifranzLogo className="h-8 md:h-10" />
          <div className="flex flex-col border-l border-white/15 pl-3.5">
            <span className="font-display font-extrabold text-[10px] md:text-[11px] text-[#FF6B00] tracking-widest uppercase">
              {OFFICIAL_EVENT_TITLE}
            </span>
            <span className="font-display font-black text-xs md:text-base text-white tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#FF6B00]" />
              {OFFICIAL_CAREER_SUBTITLE}
            </span>
          </div>
        </div>

        {gestureBanner && (
          <div className="hidden 2xl:flex items-center gap-2 px-4 py-2 rounded-full glass-panel-bright text-[#FF6B00] font-display font-bold text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4" />
            <span>{gestureBanner}</span>
          </div>
        )}

        <div className="pointer-events-auto flex items-center gap-2">
          {/* 6. Botón Destacado del Minijuego Interactivo: "🎮 TEST AR: ¿QUÉ MENCIÓN DE DERECHO ERES?" */}
          <button
            onClick={startDerechoQuiz}
            className={`px-3.5 py-2 rounded-2xl font-display font-extrabold text-[11px] tracking-wider uppercase flex items-center gap-1.5 border transition ${
              quizUiState.active
                ? 'bg-white text-black border-[#FF6B00] animate-pulse'
                : 'bg-gradient-to-r from-[#FF6B00] to-[#FF5500] text-black border-white/30 hover:scale-105'
            }`}
            title="Iniciar Test AR controlado 100% inclinando la cabeza a izquierda o derecha"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>🎮 TEST AR: ¿QUÉ MENCIÓN DE DERECHO ERES?</span>
          </button>

          {/* Botón para disparar Golpe de Mazo ("¡CASO CERRADO!") */}
          <button
            onClick={() =>
              triggerGavelStrikeVerdict(
                window.innerWidth * 0.5,
                window.innerHeight * 0.46,
                window.innerWidth,
                window.innerHeight,
                performance.now()
              )
            }
            className="glass-panel hover:border-[#FF6B00] px-3 py-2 rounded-2xl font-display font-bold text-[11px] tracking-wider uppercase flex items-center gap-1.5 text-white transition"
            title="Golpear Mazo de Juez con sonido real y sello holográfico (o baja rápido el puño derecho)"
          >
            <Gavel className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span className="hidden lg:inline">¡Cerrar Caso!</span>
          </button>

          {/* Botón Discreto de Sonido ON/OFF (Web Audio API) */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              soundEngine.setEnabled(next);
              if (next) soundEngine.playUiClickSound();
              showBanner(next ? '🔊 SONIDO WEB AUDIO API ACTIVADO' : '🔇 SONIDO SILENCIADO');
            }}
            aria-pressed={soundEnabled}
            className={`px-3 py-2 rounded-2xl font-display font-bold text-[11px] tracking-wider uppercase flex items-center gap-1.5 border transition ${
              soundEnabled
                ? 'glass-panel text-[#FF6B00] border-[#FF6B00]/70 hover:bg-[#FF6B00]/15'
                : 'bg-black/70 text-white/50 border-white/15 hover:text-white'
            }`}
            title="Activar / Desactivar Sonidos Sintetizados (Web Audio API)"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#FF6B00]" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {soundEnabled ? '🔊 Sonido ON' : '🔇 Sonido OFF'}
            </span>
          </button>

          {isSimulationMode && (
            <>
              <button
                onClick={() =>
                  setSimHandMode((prev) =>
                    prev === 'GAVEL'
                      ? 'SCALES'
                      : prev === 'SCALES'
                      ? 'FORENSIC_SHIELD'
                      : prev === 'FORENSIC_SHIELD'
                      ? 'CODE_BOOK'
                      : 'GAVEL'
                  )
                }
                className="px-3 py-2 rounded-2xl font-display font-bold text-[11px] tracking-wider uppercase flex items-center gap-1.5 border glass-panel text-[#FF6B00] border-[#FF6B00]/60"
                title="Alternar gestos en Simulación (GAVEL -> SCALES -> FORENSIC_SHIELD -> CODE_BOOK)"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Sim: {simHandMode}</span>
              </button>

              <button
                onClick={() => setSimTwoPersons((prev) => !prev)}
                className={`px-3 py-2 rounded-2xl font-display font-bold text-[11px] tracking-wider uppercase flex items-center gap-1.5 border transition ${
                  simTwoPersons
                    ? 'bg-[#FF6B00] text-black border-[#FF6B00]'
                    : 'glass-panel text-[#FF6B00] border-[#FF6B00]/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{simTwoPersons ? '2P' : '1P'}</span>
              </button>
            </>
          )}

          {/* Indicador de Personas y 60 FPS en Tiempo Real */}
          <div className="glass-panel px-3.5 py-2 rounded-2xl flex items-center gap-2.5 text-xs font-tech">
            <span
              className="flex items-center gap-1 text-white/80 font-semibold"
              title="Personas detectadas"
            >
              <Users className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span ref={peopleSpanRef}>0</span>
            </span>
            <span className="h-3.5 w-[1px] bg-white/20" />
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
              <span
                ref={fpsSpanRef}
                className="font-display font-bold text-[11px] tracking-wider text-[#FF6B00]"
              >
                -- FPS
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. PERFIL PROFESIONAL (Tarjeta HUD lateral discreta al detectar persona) */}
      {/* ==================================================================== */}
      {personDetected && (
        <aside className="fixed left-4 top-24 z-20 max-w-xs pointer-events-none hidden md:block">
          <div className="glass-panel rounded-2xl p-3.5 border-l-4 border-l-[#FF6B00] border border-[#FF6B00]/45">
            <div className="flex items-center gap-2 mb-1.5">
              <Award className="w-4 h-4 text-[#FF6B00] shrink-0" />
              <h2 className="font-display font-extrabold text-[11px] tracking-wider text-[#FF6B00] uppercase">
                {OFFICIAL_PROFESSIONAL_PROFILE.title}
              </h2>
            </div>
            <p className="text-xs text-white/90 font-sans leading-relaxed">
              &ldquo;{OFFICIAL_PROFESSIONAL_PROFILE.text}&rdquo;
            </p>
            <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-col gap-1 text-[10px] font-tech">
              <span className="text-[#FF6B00] font-bold uppercase tracking-wider">
                Menciones Oficiales 2026:
              </span>
              <span className="text-white/85">• {OFFICIAL_MENTIONS.LEGALTECH}</span>
              <span className="text-white/85">• {OFFICIAL_MENTIONS.PENAL_DIGITAL}</span>
            </div>
          </div>
        </aside>
      )}

      {/* ==================================================================== */}
      {/* 7. BARRA INFERIOR Y GUÍA CLARA DE GESTOS (En la esquina inferior derecha) */}
      {/* ==================================================================== */}
      <footer className="fixed bottom-0 inset-x-0 z-20 p-3 md:p-4 flex flex-col items-center pointer-events-none">
        <div className="pointer-events-auto max-w-[1480px] w-full glass-panel rounded-3xl p-3 md:px-5 md:py-3 flex flex-col xl:flex-row items-center justify-between gap-3">
          {/* Izquierda: Selector de los 3 Accesorios Faciales Jurídicos + Órbita Jurídica */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 bg-black/55 p-1.5 rounded-2xl border border-white/10">
            {ACCESSORY_MODES.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => {
                  setAccessoryModeIdx(idx);
                  soundEngine.playUiClickSound();
                  showBanner(`ACCESORIO ACTIVO: ${m.label.toUpperCase()}`);
                }}
                aria-pressed={accessoryModeIdx === idx}
                className={`px-3 py-2 rounded-xl font-display font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 transition-colors border ${
                  accessoryModeIdx === idx
                    ? 'bg-[#FF6B00] text-black border-[#FF6B00]'
                    : 'bg-white/5 border-white/10 text-white/75 hover:text-white'
                }`}
              >
                {m.id === 'HUD_GLASSES' && <Glasses className="w-4 h-4" />}
                {m.id === 'LAURELS' && <Crown className="w-4 h-4" />}
                {m.id === 'LEGAL_LEADER' && <Scale className="w-4 h-4" />}
                <span>{m.shortLabel}</span>
              </button>
            ))}

            <button
              onClick={() =>
                setOrbitEnabled((prev) => {
                  const next = !prev;
                  soundEngine.playUiClickSound();
                  showBanner(next ? '✨ ÓRBITA JURÍDICA ACTIVADA' : 'ÓRBITA JURÍDICA OCULTA');
                  return next;
                })
              }
              aria-pressed={orbitEnabled}
              className={`px-3 py-2 rounded-xl font-display font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 transition-colors border ${
                orbitEnabled
                  ? 'bg-[#FF6B00]/25 border-[#FF6B00] text-[#FF6B00]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
              title="Activar/Desactivar Órbita Jurídica de Badges de la Nueva Malla"
            >
              <Sparkles className="w-4 h-4" />
              <span>Órbita Jurídica</span>
            </button>

            {/* Filtro rápido de Mención Oficial */}
            <button
              onClick={() => {
                soundEngine.playUiClickSound();
                setActiveMentionKey((prev) =>
                  prev === null
                    ? 'LEGALTECH'
                    : prev === 'LEGALTECH'
                    ? 'PENAL_DIGITAL'
                    : null
                );
              }}
              className="px-3 py-2 rounded-xl font-display font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 bg-white/5 border border-white/15 text-white hover:border-[#FF6B00] transition"
              title="Filtrar Mención Oficial en pantalla"
            >
              <Scale className="w-3.5 h-3.5 text-[#FF6B00]" />
              <span>
                {activeMentionKey === 'LEGALTECH'
                  ? OFFICIAL_MENTIONS.LEGALTECH
                  : activeMentionKey === 'PENAL_DIGITAL'
                  ? OFFICIAL_MENTIONS.PENAL_DIGITAL
                  : 'Ambas Menciones'}
              </span>
            </button>
          </div>

          {/* Esquina Inferior Derecha: Tarjeta Clara y Visible con los 4 Controles por Gestos Exactos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 bg-black/75 px-4 py-2.5 rounded-2xl border border-[#FF6B00]/55 text-[11px] font-tech text-white/95">
            <button
              onClick={() => {
                setManualPowerOverride((p) => (p === 'GAVEL' ? null : 'GAVEL'));
                soundEngine.playUiClickSound();
              }}
              className={`flex items-center gap-1.5 text-left px-1.5 py-0.5 rounded-lg transition ${
                manualPowerOverride === 'GAVEL'
                  ? 'bg-[#FF6B00] text-black font-bold'
                  : 'hover:bg-white/10'
              }`}
            >
              <Gavel className="w-3.5 h-3.5 shrink-0 text-[#FF6B00]" />
              <strong className={manualPowerOverride === 'GAVEL' ? 'text-black' : 'text-[#FF6B00]'}>
                ✊ Puño Derecho (Bajar):
              </strong>
              <span className="truncate">Mazo de Juez + ¡Caso Cerrado!</span>
            </button>

            <button
              onClick={() => {
                setManualPowerOverride((p) => (p === 'SCALES' ? null : 'SCALES'));
                soundEngine.playUiClickSound();
              }}
              className={`flex items-center gap-1.5 text-left px-1.5 py-0.5 rounded-lg transition ${
                manualPowerOverride === 'SCALES'
                  ? 'bg-[#FF6B00] text-black font-bold'
                  : 'hover:bg-white/10'
              }`}
            >
              <Scale className="w-3.5 h-3.5 shrink-0 text-[#FF6B00]" />
              <strong className={manualPowerOverride === 'SCALES' ? 'text-black' : 'text-[#FF6B00]'}>
                🖐️ Izq. Abierta:
              </strong>
              <span className="truncate">Balanza + {OFFICIAL_MENTIONS.LEGALTECH}</span>
            </button>

            <button
              onClick={() => {
                setManualPowerOverride((p) =>
                  p === 'FORENSIC_SHIELD' ? null : 'FORENSIC_SHIELD'
                );
                soundEngine.playForensicShieldSound();
              }}
              className={`flex items-center gap-1.5 text-left px-1.5 py-0.5 rounded-lg transition ${
                manualPowerOverride === 'FORENSIC_SHIELD'
                  ? 'bg-[#FF6B00] text-black font-bold'
                  : 'hover:bg-white/10'
              }`}
            >
              <Shield className="w-3.5 h-3.5 shrink-0 text-[#FF6B00]" />
              <strong
                className={
                  manualPowerOverride === 'FORENSIC_SHIELD' ? 'text-black' : 'text-[#FF6B00]'
                }
              >
                🖐️ Der. Abierta:
              </strong>
              <span className="truncate">Escudo + {OFFICIAL_MENTIONS.PENAL_DIGITAL}</span>
            </button>

            <button
              onClick={() => {
                setManualPowerOverride((p) => (p === 'CODE_BOOK' ? null : 'CODE_BOOK'));
                soundEngine.playHolographicBookSound();
              }}
              className={`flex items-center gap-1.5 text-left px-1.5 py-0.5 rounded-lg transition ${
                manualPowerOverride === 'CODE_BOOK'
                  ? 'bg-[#FF6B00] text-black font-bold'
                  : 'hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0 text-[#FF6B00]" />
              <strong
                className={manualPowerOverride === 'CODE_BOOK' ? 'text-black' : 'text-[#FF6B00]'}
              >
                🖐️🖐️ Ambas Abiertas:
              </strong>
              <span className="truncate">Código Jurídico y Microcredenciales</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
