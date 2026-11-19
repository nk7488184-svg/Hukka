'use client';

import React from 'react';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCamera: () => void;
  onStartMic: () => void;
  cameraActive: boolean;
  micActive: boolean;
  cameraError: string | null;
  micError: string | null;
  handTrackingLoading: boolean;
  faceTrackingLoading: boolean;
}

export function CalibrationModal({
  isOpen,
  onClose,
  onStartCamera,
  onStartMic,
  cameraActive,
  micActive,
  cameraError,
  micError,
  handTrackingLoading,
  faceTrackingLoading,
}: CalibrationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass rounded-3xl p-8 max-w-md w-full mx-4 animate-fade-in glow-purple">
        <h2
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Setup
          </span>
        </h2>
        <p className="text-sm text-white/50 mb-6">
          Enable your camera and microphone for the full experience
        </p>

        {/* Camera section */}
        <div className="glass-light rounded-xl p-4 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📷</span>
              <div>
                <p className="text-sm font-medium text-white/80">Camera</p>
                <p className="text-xs text-white/40">
                  {cameraActive
                    ? 'Connected'
                    : cameraError
                    ? 'Access denied'
                    : 'Not connected'}
                </p>
              </div>
            </div>
            {!cameraActive ? (
              <button
                onClick={onStartCamera}
                disabled={handTrackingLoading || faceTrackingLoading}
                className="px-4 py-2 rounded-lg text-xs font-medium
                  bg-purple-500/20 hover:bg-purple-500/30
                  border border-purple-500/30 transition-all
                  text-purple-300 disabled:opacity-50"
              >
                {handTrackingLoading || faceTrackingLoading
                  ? 'Loading AI...'
                  : 'Enable'}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                <span className="text-xs text-green-300">Active</span>
              </div>
            )}
          </div>
          {cameraError && (
            <p className="text-xs text-red-400/80 mt-2">⚠️ {cameraError}</p>
          )}
        </div>

        {/* Microphone section */}
        <div className="glass-light rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎤</span>
              <div>
                <p className="text-sm font-medium text-white/80">Microphone</p>
                <p className="text-xs text-white/40">
                  {micActive
                    ? 'Connected'
                    : micError
                    ? 'Access denied'
                    : 'Not connected'}
                </p>
              </div>
            </div>
            {!micActive ? (
              <button
                onClick={onStartMic}
                className="px-4 py-2 rounded-lg text-xs font-medium
                  bg-cyan-500/20 hover:bg-cyan-500/30
                  border border-cyan-500/30 transition-all
                  text-cyan-300"
              >
                Enable
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                <span className="text-xs text-green-300">Active</span>
              </div>
            )}
          </div>
          {micError && (
            <p className="text-xs text-red-400/80 mt-2">⚠️ {micError}</p>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-white/30 text-center mb-4">
          All processing happens locally in your browser. No data is sent to any server.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={async () => {
              if (!cameraActive) await onStartCamera();
              if (!micActive) await onStartMic();
              onClose();
            }}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold
              bg-gradient-to-r from-purple-500 to-cyan-500
              hover:from-purple-400 hover:to-cyan-400
              shadow-[0_0_15px_rgba(139,92,246,0.4)]
              transition-all text-white"
          >
            {cameraActive ? 'Continue to Hookah' : 'Allow Camera & Enter'}
          </button>

          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl text-xs font-medium
              bg-white/5 hover:bg-white/10 border border-white/10
              text-white/60 hover:text-white transition-all"
          >
            Use Mouse Mode
          </button>
        </div>
      </div>
    </div>
  );
}
