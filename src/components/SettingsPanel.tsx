'use client';

import React, { useState } from 'react';

interface SettingsPanelProps {
  settings: {
    cameraEnabled: boolean;
    micEnabled: boolean;
    soundEnabled: boolean;
    particlesEnabled: boolean;
  };
  onToggle: (key: string) => void;
  onCalibrate: () => void;
}

function ToggleRow({
  label,
  icon,
  active,
  onToggle,
}: {
  label: string;
  icon: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-white/70">{label}</span>
      </div>
      <button
        onClick={onToggle}
        className={`toggle-switch ${active ? 'active' : ''}`}
        aria-label={`Toggle ${label}`}
      />
    </div>
  );
}

export function SettingsPanel({
  settings,
  onToggle,
  onCalibrate,
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-6 right-6 z-20 pointer-events-auto">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass rounded-xl p-3 hover:bg-white/5 transition-all duration-300 mb-2 float-right"
        title="Settings"
      >
        <svg
          className={`w-5 h-5 text-white/60 transition-transform duration-300 ${
            isOpen ? 'rotate-90' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="glass rounded-2xl p-5 w-64 animate-fade-in clear-both">
          <h3 className="text-sm font-semibold text-white/80 mb-3 tracking-wide">
            Settings
          </h3>

          <div className="space-y-1">
            <ToggleRow
              label="Camera"
              icon="📷"
              active={settings.cameraEnabled}
              onToggle={() => onToggle('cameraEnabled')}
            />
            <ToggleRow
              label="Microphone"
              icon="🎤"
              active={settings.micEnabled}
              onToggle={() => onToggle('micEnabled')}
            />
            <ToggleRow
              label="Sound Effects"
              icon="🔊"
              active={settings.soundEnabled}
              onToggle={() => onToggle('soundEnabled')}
            />
            <ToggleRow
              label="Particles"
              icon="✨"
              active={settings.particlesEnabled}
              onToggle={() => onToggle('particlesEnabled')}
            />
          </div>

          <div className="border-t border-white/10 mt-3 pt-3">
            <button
              onClick={onCalibrate}
              className="w-full py-2 px-4 rounded-xl text-xs font-medium
                bg-gradient-to-r from-purple-500/20 to-cyan-500/20
                hover:from-purple-500/30 hover:to-cyan-500/30
                border border-white/10 transition-all duration-300
                text-white/70 hover:text-white"
            >
              🔧 Calibrate Camera & Mic
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
