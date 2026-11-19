'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

export interface BlowDetectionState {
  blowDetected: boolean;
  blowIntensity: number;
  micActive: boolean;
  error: string | null;
}

// Hysteresis thresholds optimized for standard computer microphones
const BLOW_START_THRESHOLD = 0.02;
const BLOW_STOP_THRESHOLD = 0.01;

export function useBlowDetection() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lowPassRef = useRef<BiquadFilterNode | null>(null);
  const rafRef = useRef<number>(0);
  const isBlowingRef = useRef(false);

  const [state, setState] = useState<BlowDetectionState>({
    blowDetected: false,
    blowIntensity: 0,
    micActive: false,
    error: null,
  });

  const startMic = useCallback(async () => {
    try {
      setState((s) => ({ ...s, error: null }));

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.5;

      // Low-pass filter to focus on blow frequencies
      const lowPass = audioContext.createBiquadFilter();
      lowPass.type = 'lowpass';
      lowPass.frequency.value = 1500;
      lowPass.Q.value = 0.7;

      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(lowPass);
      lowPass.connect(analyser);
      // Don't connect analyser to destination (no audio playback)

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      streamRef.current = mediaStream;
      lowPassRef.current = lowPass;

      setState((s) => ({ ...s, micActive: true }));
      console.log('Microphone initialized for blow detection');

      // Start detection loop
      detectBlow();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Microphone access denied';
      setState((s) => ({ ...s, error: message, micActive: false }));
      console.error('Microphone error:', err);
    }
  }, []);

  const detectBlow = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const pcmData = new Float32Array(analyser.fftSize);

    const loop = () => {
      if (!analyserRef.current) return;

      analyser.getFloatTimeDomainData(pcmData);

      // Calculate RMS volume
      let sumSquares = 0;
      for (let i = 0; i < pcmData.length; i++) {
        sumSquares += pcmData[i] * pcmData[i];
      }
      const rms = Math.sqrt(sumSquares / pcmData.length);

      // Hysteresis-based detection
      const wasBlowing = isBlowingRef.current;
      if (!wasBlowing && rms > BLOW_START_THRESHOLD) {
        isBlowingRef.current = true;
      } else if (wasBlowing && rms < BLOW_STOP_THRESHOLD) {
        isBlowingRef.current = false;
      }

      const intensity = Math.min(1, Math.max(0.4, rms / 0.06)); // Normalize to 0.4-1.0

      setState((s) => {
        if (
          s.blowDetected !== isBlowingRef.current ||
          Math.abs(s.blowIntensity - intensity) > 0.01
        ) {
          return {
            ...s,
            blowDetected: isBlowingRef.current,
            blowIntensity: intensity,
          };
        }
        return s;
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    loop();
  }, []);

  const stopMic = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (lowPassRef.current) {
      lowPassRef.current.disconnect();
      lowPassRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    isBlowingRef.current = false;
    setState({
      blowDetected: false,
      blowIntensity: 0,
      micActive: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    startMic,
    stopMic,
  };
}
