'use client';

import React from 'react';

interface HeaderProps {
  mirrorMode?: boolean;
  onToggleMirror?: () => void;
  cameraActive?: boolean;
  onStartCamera?: () => void;
}

export function Header({
  mirrorMode = true,
  onToggleMirror,
  cameraActive = false,
  onStartCamera,
}: HeaderProps) {
  return (
    <div className="absolute top-0 left-0 z-20 p-6 flex flex-wrap items-center gap-3 animate-slide-in-left pointer-events-auto">
      <div className="glass rounded-2xl px-6 py-4 glow-purple">
        <h1
          className="text-3xl font-bold tracking-wider"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Hookah Baar
          </span>
        </h1>
        <p className="text-xs text-white/40 mt-1 tracking-widest uppercase">
          Virtual Hookah Experience
        </p>
      </div>

      {/* Quick Action Badges */}
      <div className="flex items-center gap-2">
        {cameraActive && onToggleMirror && (
          <button
            onClick={onToggleMirror}
            className={`glass rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${
              mirrorMode
                ? 'glow-cyan bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle seeing yourself on the full screen behind the hookah"
          >
            <span>🪞</span>
            <span>{mirrorMode ? 'Mirror View: ON' : 'Mirror View: OFF'}</span>
          </button>
        )}

        {!cameraActive && onStartCamera && (
          <button
            onClick={onStartCamera}
            className="glass rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 bg-gradient-to-r from-purple-500/30 to-cyan-500/30 hover:from-purple-500/50 hover:to-cyan-500/50 text-white transition-all duration-300 glow-purple"
          >
            <span>📹</span>
            <span>Enable Camera</span>
          </button>
        )}
      </div>
    </div>
  );
}
