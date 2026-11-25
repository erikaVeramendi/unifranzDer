import React from 'react';
import UnifranzLogo from './UnifranzLogo';
import { Cpu, Camera, Scale, ShieldCheck, Gavel } from 'lucide-react';
import { OFFICIAL_EVENT_TITLE, OFFICIAL_CAREER_SUBTITLE } from '../config';

export default function LoadingScreen({ progress, statusText, error, onRetry, onStartDemo }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 overflow-hidden crt-grid-overlay">
      <div className="relative z-10 max-w-lg w-full glass-panel-bright rounded-3xl p-8 md:p-10 flex flex-col items-center text-center border border-[#FF6B00]/60">
        {/* Corner Cyber Accents */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-[#FF6B00]" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-[#FF6B00]" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-[#FF6B00]" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-[#FF6B00]" />

        <div className="mb-5 animate-float-slow">
          <UnifranzLogo className="h-16" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FF6B00]/15 border border-[#FF6B00]/40 text-[#FF6B00] font-tech text-xs tracking-widest uppercase mb-3">
          <Scale className="w-3.5 h-3.5" />
          {OFFICIAL_EVENT_TITLE}
        </div>

        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-white tracking-wide mb-1">
          {OFFICIAL_CAREER_SUBTITLE}
        </h1>
        <p className="font-display font-bold text-xs text-[#FF6B00] tracking-widest uppercase mb-3">
          UNIFRANZ AR MIRROR EXPERIENCE
        </p>
        <p className="text-sm text-white/70 max-w-md mb-7 leading-relaxed">
          Espejo Interactivo en Vivo a <span className="text-white font-medium">60 FPS</span> con Lentes HUD LegalTech, Laureles de la Justicia, Mazo de Juez con Audio Real, Balanza de Legal Tech, Escudo de Justicia Penal Digital y Código Jurídico Holográfico.
        </p>

        {!error ? (
          <div className="w-full space-y-4">
            <div className="w-full h-3 bg-black/80 rounded-full overflow-hidden border border-[#FF6B00]/40 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#FF5500] via-[#FF6B00] to-[#FFB347] rounded-full transition-all duration-300"
                style={{ width: `${Math.max(8, progress)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-tech text-white/80 px-1">
              <span className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#FF6B00] animate-spin" />
                {statusText}
              </span>
              <span className="text-[#FF6B00] font-bold">{Math.round(progress)}%</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-4 text-[11px] font-tech text-white/70">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center gap-1">
                <span className="text-[#FF6B00] font-bold">HUD LEGALTECH</span>
                <span>Lentes & Laureles</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center gap-1">
                <span className="text-[#FF6B00] font-bold flex items-center gap-1">
                  <Gavel className="w-3 h-3" /> MAZO 3D
                </span>
                <span>Sonido Web Audio</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center gap-1">
                <span className="text-[#FF6B00] font-bold">2 MENCIONES</span>
                <span>Test AR & Poderes</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="p-4 rounded-2xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs leading-relaxed">
              <p className="font-semibold text-red-400 mb-1 flex items-center justify-center gap-1.5">
                <Camera className="w-4 h-4" /> Aviso de Cámara o Sensor
              </p>
              {error}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={onRetry}
                className="px-5 py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#FF5500] text-black font-display font-bold text-xs tracking-wider uppercase transition"
              >
                Reintentar Cámara
              </button>
              <button
                onClick={onStartDemo}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-[#FF6B00]/50 font-display font-bold text-xs tracking-wider uppercase transition"
              >
                Modo Simulación Holográfica
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-white/10 w-full flex items-center justify-between text-[11px] text-white/50 font-tech">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF6B00]" />
            100% Procesamiento Local WebGL/GPU • 60 FPS
          </span>
          <span>#DerechoUnifranz</span>
        </div>
      </div>
    </div>
  );
}
