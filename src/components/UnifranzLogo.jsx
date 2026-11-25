import React, { useState, useEffect } from 'react';

export default function UnifranzLogo({ className = "h-11", showTagline = true }) {
  const [imgSrc, setImgSrc] = useState('/assets/logo-unifranz.png');
  const [useFallbackSvg, setUseFallbackSvg] = useState(false);

  return (
    <div className="flex items-center gap-3 select-none">
      {!useFallbackSvg ? (
        <img
          src={imgSrc}
          alt="UNIFRANZ Logo Oficial"
          className={`${className} w-auto object-contain drop-shadow-[0_0_12px_rgba(255,107,0,0.45)]`}
          onError={() => {
            if (imgSrc === '/assets/logo-unifranz.png') {
              setImgSrc('/assets/logo-unifranz.svg');
            } else {
              setUseFallbackSvg(true);
            }
          }}
        />
      ) : (
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FF4500] flex items-center justify-center shadow-neon-orange border border-white/20">
            <span className="font-display font-black text-xl text-black tracking-tighter">U</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-2xl tracking-wider text-white leading-none">
              UNI<span className="text-[#FF6B00]">FRANZ</span>
            </span>
            {showTagline && (
              <span className="font-tech text-[9px] tracking-[0.28em] text-white/70 uppercase mt-0.5">
                Universidad Privada Franz Tamayo
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
