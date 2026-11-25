/**
 * Sintetizador de Efectos de Sonido Jurídicos y Holográficos en Tiempo Real
 * 100% Web Audio API pura (Cero archivos MP3 externos, latencia <5ms).
 *
 * Incluye:
 *  1. playGavelStrikeSound(): Golpe contundente de Mazo de Juez sobre madera maciza (*gavel bang*).
 *  2. playScaleBalancedChime(): Destello armónico cristalino cuando la Balanza de la Justicia alcanza equilibrio.
 *  3. playHolographicBookSound(): Despliegue futurista del Código Jurídico Holográfico.
 *  4. playForensicShieldSound(): Activación del Escudo Hexagonal de Evidencia Digital ("Justicia Penal Digital").
 *  5. playTriumphantMentionChord(): Acorde triunfal sutil al finalizar el Test AR de Vocación Jurídica.
 *  6. playUiClickSound(): Feedback táctil sutil de interfaz.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.lastScaleChimeTs = 0;
    this.lastBookSoundTs = 0;
    this.lastShieldSoundTs = 0;
  }

  initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    if (this.enabled) {
      this.initContext();
    }
  }

  isEnabled() {
    return this.enabled;
  }

  /**
   * 1. SONIDO REAL Y CONTUNDENTE DE GOLPE DE MAZO DE JUEZ (Gavel Bang)
   */
  playGavelStrikeSound() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // A. Cuerpo de madera maciza (sub-impacto grave 175Hz -> 42Hz)
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(175, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(42, now + 0.19);

    bodyGain.gain.setValueAtTime(0.95, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(ctx.destination);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.25);

    // B. Resonancia de madera dura (tono percusivo 460Hz -> 128Hz)
    const woodOsc = ctx.createOscillator();
    const woodGain = ctx.createGain();
    woodOsc.type = 'sine';
    woodOsc.frequency.setValueAtTime(460, now);
    woodOsc.frequency.exponentialRampToValueAtTime(128, now + 0.085);

    woodGain.gain.setValueAtTime(0.75, now);
    woodGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    woodOsc.connect(woodGain);
    woodGain.connect(ctx.destination);
    woodOsc.start(now);
    woodOsc.stop(now + 0.12);

    // C. Crack de impacto (Burst de ruido blanco con filtro paso-banda de madera)
    const bufferSize = Math.floor(ctx.sampleRate * 0.14);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.pow(1 - i / bufferSize, 2.4);
      output[i] = (Math.random() * 2 - 1) * env;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(980, now);
    bandpass.Q.setValueAtTime(1.8, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.9, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.13);

    whiteNoise.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(now);

    // D. Reverberación corta de Sala de Audiencias
    const echoDelay = now + 0.075;
    const echoOsc = ctx.createOscillator();
    const echoGain = ctx.createGain();
    echoOsc.type = 'sine';
    echoOsc.frequency.setValueAtTime(290, echoDelay);
    echoOsc.frequency.exponentialRampToValueAtTime(85, echoDelay + 0.22);

    echoGain.gain.setValueAtTime(0.28, echoDelay);
    echoGain.gain.exponentialRampToValueAtTime(0.001, echoDelay + 0.24);

    echoOsc.connect(echoGain);
    echoGain.connect(ctx.destination);
    echoOsc.start(echoDelay);
    echoOsc.stop(echoDelay + 0.25);
  }

  /**
   * 2. DESTELLO ARMÓNICO DE EQUILIBRIO EN LA BALANZA DE LA JUSTICIA
   */
  playScaleBalancedChime() {
    if (!this.enabled) return;
    const perfNow = performance.now();
    if (perfNow - this.lastScaleChimeTs < 1800) return;
    this.lastScaleChimeTs = perfNow;

    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const start = now + idx * 0.045;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.42);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.44);
    });
  }

  /**
   * 3. EFECTO SONORO FUTURISTA DEL CÓDIGO JURÍDICO HOLOGRÁFICO
   */
  playHolographicBookSound() {
    if (!this.enabled) return;
    const perfNow = performance.now();
    if (perfNow - this.lastBookSoundTs < 2200) return;
    this.lastBookSoundTs = perfNow;

    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc2.type = 'triangle';

    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.28);

    osc2.frequency.setValueAtTime(360, now);
    osc2.frequency.exponentialRampToValueAtTime(1080, now + 0.28);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.36);
    osc2.stop(now + 0.36);
  }

  /**
   * 4. SONIDO DE DESPLIEGUE DEL ESCUDO HEXAGONAL DE EVIDENCIA DIGITAL
   */
  playForensicShieldSound() {
    if (!this.enabled) return;
    const perfNow = performance.now();
    if (perfNow - this.lastShieldSoundTs < 2200) return;
    this.lastShieldSoundTs = perfNow;

    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.16);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.32);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  /**
   * 5. ACORDE TRIUNFAL SUTIL AL FINALIZAR EL TEST AR DE MENCIÓN DE DERECHO
   */
  playTriumphantMentionChord() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Fanfarria armónica en Re Mayor (D4, F#4, A4, D5, F#5, A5)
    const chord = [293.66, 369.99, 440.0, 587.33, 739.99, 880.0];

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx < 3 ? 'triangle' : 'sine';
      const start = now + idx * 0.055;
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.16, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.78);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.82);
    });
  }

  /**
   * 6. SONIDO SUTIL DE INTERFAZ / CAMBIO DE MODO
   */
  playUiClickSound() {
    if (!this.enabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(990, now + 0.065);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }
}

export const soundEngine = new SoundEngine();
