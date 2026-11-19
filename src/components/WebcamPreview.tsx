'use client';

import React, { useRef, useEffect, useState } from 'react';

interface WebcamPreviewProps {
  stream: MediaStream | null;
  cameraActive: boolean;
  isConnecting?: boolean;
  error?: string | null;
  visible: boolean;
  mirrorMode?: boolean;
  handDetected?: boolean;
  faceDetected?: boolean;
  onToggleMirror?: () => void;
  onRetryCamera?: () => void;
}

export function WebcamPreview({
  stream,
  cameraActive,
  isConnecting = false,
  error = null,
  visible,
  mirrorMode = true,
  handDetected = false,
  faceDetected = false,
  onToggleMirror,
  onRetryCamera,
}: WebcamPreviewProps) {
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const video = pipVideoRef.current;
    if (video && stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.play().catch(() => {});
    }
  }, [stream, cameraActive, mirrorMode]);

  if (!visible) return null;

  // When full-screen mirror mode is active and camera is on, the user is already looking at themselves on the screen!
  // Show a sleek floating camera control badge in the bottom-left.
  if (cameraActive && mirrorMode) {
    return (
      <div className="absolute bottom-6 left-6 z-20 pointer-events-auto animate-fade-in">
        <div className="glass rounded-2xl px-4 py-2.5 glow-cyan flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.7)] animate-pulse" />
            <span className="text-xs font-semibold text-green-300">
              🪞 Full-Screen Mirror Active
            </span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          {/* Quick toggle to PiP if user wants dark background */}
          {onToggleMirror && (
            <button
              onClick={onToggleMirror}
              className="text-[11px] text-white/70 hover:text-white px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Switch to dark background with corner camera"
            >
              Switch to Corner View
            </button>
          )}
        </div>
      </div>
    );
  }

  // When mirror mode is off or camera is inactive: show the corner camera box
  return (
    <div className="absolute bottom-6 left-6 z-20 pointer-events-auto animate-fade-in">
      <div
        className={`glass rounded-2xl p-2 glow-purple transition-all duration-300 ${
          isExpanded ? 'w-80' : 'w-60'
        }`}
      >
        {/* Top Header / Status bar */}
        <div className="flex items-center justify-between px-2 py-1.5 mb-1.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            {cameraActive ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.7)] animate-pulse" />
                <span className="text-[11px] font-semibold tracking-wider text-green-300">
                  CAMERA ON
                </span>
              </>
            ) : isConnecting ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-[11px] font-semibold tracking-wider text-amber-300">
                  CONNECTING...
                </span>
              </>
            ) : (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <span className="text-[11px] font-semibold tracking-wider text-red-300">
                  CAMERA OFF
                </span>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {cameraActive && onToggleMirror && (
              <button
                onClick={onToggleMirror}
                className="text-[10px] text-cyan-300 hover:text-cyan-200 px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 transition-colors"
                title="See yourself on full screen behind hookah"
              >
                🪞 Full Mirror
              </button>
            )}

            {cameraActive && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[10px] text-white/70 hover:text-white px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
                title={isExpanded ? 'Shrink camera preview' : 'Enlarge camera preview'}
              >
                {isExpanded ? '⤡' : '⤢'}
              </button>
            )}
          </div>
        </div>

        {/* Video or Inactive State */}
        <div className="relative rounded-xl overflow-hidden bg-black/80 aspect-[4/3] flex items-center justify-center">
          {/* PiP video feed */}
          <video
            ref={pipVideoRef}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              cameraActive ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
            }`}
            style={{ transform: 'scaleX(-1)' }}
            autoPlay
            playsInline
            muted
          />

          {/* Tracking indicators overlaid on top of video */}
          {cameraActive && (
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-medium backdrop-blur-md transition-all duration-300 ${
                  faceDetected
                    ? 'bg-green-500/30 text-green-200 border border-green-500/40'
                    : 'bg-black/40 text-white/40'
                }`}
              >
                {faceDetected ? '👄 Mouth Locked' : 'Searching Face'}
              </span>

              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-medium backdrop-blur-md transition-all duration-300 ${
                  handDetected
                    ? 'bg-purple-500/40 text-purple-200 border border-purple-500/50'
                    : 'bg-black/40 text-white/40'
                }`}
              >
                {handDetected ? '✋ Hand Active' : 'Show Hand'}
              </span>
            </div>
          )}

          {/* Fallback state when camera is not yet active */}
          {!cameraActive && (
            <div className="p-4 text-center flex flex-col items-center justify-center">
              <span className="text-3xl mb-2">📹</span>
              <p className="text-xs font-semibold text-white/90 mb-1">
                {isConnecting ? 'Starting camera...' : 'Camera Not Active'}
              </p>
              {error ? (
                <p className="text-[10px] text-red-300/90 mb-3 px-1 leading-snug">
                  {error}
                </p>
              ) : (
                <p className="text-[10px] text-white/50 mb-3 leading-snug">
                  Enable your webcam to see yourself and control the hookah with hand tracking.
                </p>
              )}

              {onRetryCamera && (
                <button
                  onClick={onRetryCamera}
                  disabled={isConnecting}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white shadow-[0_0_12px_rgba(139,92,246,0.5)] transition-all active:scale-95 disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Turn On Camera'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
