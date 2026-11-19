'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { HookahCanvas } from '@/components/HookahCanvas';
import { Header } from '@/components/Header';
import { StatusIndicators } from '@/components/StatusIndicators';
import { TutorialOverlay } from '@/components/TutorialOverlay';
import { SettingsPanel } from '@/components/SettingsPanel';
import { WebcamPreview } from '@/components/WebcamPreview';
import { CalibrationModal } from '@/components/CalibrationModal';
import { useWebcam } from '@/hooks/useWebcam';
import { useHandTracking } from '@/hooks/useHandTracking';
import { useFaceTracking } from '@/hooks/useFaceTracking';
import { useBlowDetection } from '@/hooks/useBlowDetection';
import { Vec2 } from '@/lib/physics';

export default function HookahBaarPage() {
  // Settings
  const [settings, setSettings] = useState({
    cameraEnabled: true,
    micEnabled: true,
    soundEnabled: true,
    particlesEnabled: true,
  });

  // UI state
  const [showCalibration, setShowCalibration] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [nearMouth, setNearMouth] = useState(false);
  const [smokingActive, setSmokingActive] = useState(false);
  const [manualBlow, setManualBlow] = useState(false);
  const [mirrorMode, setMirrorMode] = useState(true);

  // Webcam
  const webcam = useWebcam();

  // Tracking hooks
  const handTracking = useHandTracking(webcam.videoRef, settings.cameraEnabled && webcam.cameraActive);
  const faceTracking = useFaceTracking(webcam.videoRef, settings.cameraEnabled && webcam.cameraActive);

  // Blow detection
  const blowDetection = useBlowDetection();

  const isBlowing = blowDetection.blowDetected || manualBlow;
  const blowIntensity = manualBlow ? 0.9 : blowDetection.blowIntensity;

  // Detection loop - runs hand and face detection on each frame
  const detectionLoopRef = useRef<number>(0);

  // Auto-initialize models whenever camera activates
  useEffect(() => {
    if (webcam.cameraActive && settings.cameraEnabled) {
      if (!handTracking.isInitialized && !handTracking.isLoading) {
        handTracking.initialize();
      }
      if (!faceTracking.isInitialized && !faceTracking.isLoading) {
        faceTracking.initialize();
      }
    }
  }, [
    webcam.cameraActive,
    settings.cameraEnabled,
    handTracking.isInitialized,
    handTracking.isLoading,
    faceTracking.isInitialized,
    faceTracking.isLoading,
    handTracking.initialize,
    faceTracking.initialize,
  ]);

  useEffect(() => {
    if (!webcam.cameraActive || (!handTracking.isInitialized && !faceTracking.isInitialized)) {
      return;
    }

    const loop = () => {
      const timestamp = performance.now();
      if (handTracking.isInitialized) {
        handTracking.detect(timestamp);
      }
      if (faceTracking.isInitialized) {
        faceTracking.detect(timestamp);
      }
      detectionLoopRef.current = requestAnimationFrame(loop);
    };

    detectionLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current);
      }
    };
  }, [webcam.cameraActive, handTracking.isInitialized, faceTracking.isInitialized, handTracking.detect, faceTracking.detect]);

  // Handle camera start (also initializes tracking)
  const handleStartCamera = useCallback(async () => {
    await webcam.startCamera();
    // Initialize tracking models after camera is ready (using allSettled so one failure doesn't block the other)
    await Promise.allSettled([
      handTracking.initialize(),
      faceTracking.initialize(),
    ]);
  }, [webcam, handTracking, faceTracking]);

  // Handle mic start
  const handleStartMic = useCallback(async () => {
    await blowDetection.startMic();
  }, [blowDetection]);

  // Settings toggle
  const handleToggleSetting = useCallback((key: string) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: !prev[key as keyof typeof prev] };

      // Handle camera toggle
      if (key === 'cameraEnabled') {
        if (newSettings.cameraEnabled && !webcam.cameraActive) {
          handleStartCamera();
        } else if (!newSettings.cameraEnabled && webcam.cameraActive) {
          webcam.stopCamera();
        }
      }

      // Handle mic toggle
      if (key === 'micEnabled') {
        if (newSettings.micEnabled && !blowDetection.micActive) {
          handleStartMic();
        } else if (!newSettings.micEnabled && blowDetection.micActive) {
          blowDetection.stopMic();
        }
      }

      return newSettings;
    });
  }, [webcam, blowDetection, handleStartCamera, handleStartMic]);

  // Close calibration
  const handleCloseCalibration = useCallback(() => {
    setShowCalibration(false);
    setShowTutorial(true);
  }, []);

  // Dismiss tutorial
  const handleDismissTutorial = useCallback(() => {
    setShowTutorial(false);
  }, []);

  // Open calibration from settings
  const handleCalibrate = useCallback(() => {
    setShowCalibration(true);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050510]">
      {/* Full-screen mirrored live webcam feed for AR Mirror Mode */}
      <video
        ref={webcam.videoRef}
        className={`fixed inset-0 w-full h-full object-cover transition-opacity duration-700 pointer-events-none ${
          webcam.cameraActive && mirrorMode ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transform: 'scaleX(-1)', zIndex: 0 }}
        autoPlay
        playsInline
        muted
      />

      {/* Full-screen hookah canvas */}
      <HookahCanvas
        handPosition={handTracking.gripPoint || handTracking.palmCenter || handTracking.indexTip}
        mouthPosition={faceTracking.mouthPosition}
        nosePosition={faceTracking.nosePosition}
        leftNostril={faceTracking.leftNostril}
        rightNostril={faceTracking.rightNostril}
        isGrabbing={handTracking.isGrabbing}
        blowDetected={isBlowing}
        blowIntensity={blowIntensity}
        handDetected={handTracking.handDetected}
        particlesEnabled={settings.particlesEnabled}
        mirrorMode={mirrorMode && webcam.cameraActive}
        videoRef={webcam.videoRef}
        onNearMouth={setNearMouth}
        onSmokingActive={setSmokingActive}
      />

      {/* UI Layer */}
      <div className="relative z-10 pointer-events-none">
        {/* Header with Mirror toggle */}
        <Header
          mirrorMode={mirrorMode}
          onToggleMirror={() => setMirrorMode((m) => !m)}
          cameraActive={webcam.cameraActive}
          onStartCamera={handleStartCamera}
        />

        {/* Status indicators */}
        <StatusIndicators
          handDetected={handTracking.handDetected}
          faceDetected={faceTracking.faceDetected}
          blowDetected={isBlowing}
          cameraActive={webcam.cameraActive}
          micActive={blowDetection.micActive || manualBlow}
        />

        {/* Manual Blow / Puff Trigger Button (Click or Hold Fallback) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <button
            onPointerDown={() => setManualBlow(true)}
            onPointerUp={() => setManualBlow(false)}
            onPointerLeave={() => setManualBlow(false)}
            className={`glass rounded-2xl px-6 py-3 flex items-center gap-2.5 transition-all duration-300 select-none ${
              manualBlow ? 'glow-cyan bg-cyan-500/20 scale-95' : 'hover:bg-white/10'
            }`}
            title="Hold or click to blow smoke manually"
          >
            <span className="text-xl">💨</span>
            <span className="text-xs font-semibold tracking-wider uppercase text-white/90">
              {manualBlow ? 'Blowing Virtual Smoke...' : 'Hold to Blow (Click Fallback)'}
            </span>
          </button>
        </div>

        {/* Webcam preview & mirror control */}
        <WebcamPreview
          stream={webcam.stream}
          cameraActive={webcam.cameraActive}
          isConnecting={webcam.isConnecting}
          error={webcam.error}
          visible={settings.cameraEnabled}
          mirrorMode={mirrorMode}
          handDetected={handTracking.handDetected}
          faceDetected={faceTracking.faceDetected}
          onToggleMirror={() => setMirrorMode((m) => !m)}
          onRetryCamera={handleStartCamera}
        />

        {/* Settings panel */}
        <SettingsPanel
          settings={settings}
          onToggle={handleToggleSetting}
          onCalibrate={handleCalibrate}
        />

        {/* Tutorial overlay */}
        {showTutorial && (
          <TutorialOverlay
            handDetected={handTracking.handDetected}
            nearMouth={nearMouth}
            blowDetected={isBlowing}
            onDismiss={handleDismissTutorial}
          />
        )}

        {/* Calibration modal */}
        <CalibrationModal
          isOpen={showCalibration}
          onClose={handleCloseCalibration}
          onStartCamera={handleStartCamera}
          onStartMic={handleStartMic}
          cameraActive={webcam.cameraActive}
          micActive={blowDetection.micActive}
          cameraError={webcam.error}
          micError={blowDetection.error}
          handTrackingLoading={handTracking.isLoading}
          faceTrackingLoading={faceTracking.isLoading}
        />

        {/* Smoking active indicator */}
        {smokingActive && (
          <div className="absolute top-1/2 right-8 -translate-y-1/2 animate-fade-in">
            <div className="glass rounded-xl px-4 py-3 glow-cyan">
              <span className="text-lg">🌬️</span>
              <span className="text-xs text-cyan-300 ml-2 font-medium">
                Smoke Active
              </span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
