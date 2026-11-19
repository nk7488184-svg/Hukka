'use client';

import React from 'react';

interface StatusIndicatorsProps {
  handDetected: boolean;
  faceDetected: boolean;
  blowDetected: boolean;
  cameraActive: boolean;
  micActive: boolean;
}

function Indicator({
  label,
  active,
  icon,
}: {
  label: string;
  active: boolean;
  icon: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ${
        active ? 'glass glow-green' : 'glass-light'
      }`}
    >
      <span className="text-base">{icon}</span>
      <div
        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
          active
            ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]'
            : 'bg-red-400/60 shadow-[0_0_8px_rgba(248,113,113,0.3)]'
        }`}
      />
      <span
        className={`text-xs font-medium transition-colors duration-300 ${
          active ? 'text-green-300' : 'text-white/40'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export function StatusIndicators({
  handDetected,
  faceDetected,
  blowDetected,
  cameraActive,
  micActive,
}: StatusIndicatorsProps) {
  return (
    <div className="absolute top-6 right-6 z-20 flex flex-col gap-2 animate-slide-in-right">
      {cameraActive && (
        <>
          <Indicator
            label={handDetected ? 'Hand Detected' : 'No Hand'}
            active={handDetected}
            icon="✋"
          />
          <Indicator
            label={faceDetected ? 'Mouth Detected' : 'No Mouth'}
            active={faceDetected}
            icon="👄"
          />
        </>
      )}
      {micActive && (
        <Indicator
          label={blowDetected ? 'Blow Detected' : 'No Blow'}
          active={blowDetected}
          icon="💨"
        />
      )}
    </div>
  );
}
