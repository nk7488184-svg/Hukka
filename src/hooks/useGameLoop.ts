'use client';

import { useRef, useCallback, useEffect } from 'react';

export function useGameLoop(callback: (deltaTime: number, timestamp: number) => void) {
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  // Always use the latest callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const loop = useCallback((timestamp: number) => {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }

    const deltaTime = Math.min(timestamp - lastTimeRef.current, 50); // Cap at 50ms (20fps min)
    lastTimeRef.current = timestamp;

    callbackRef.current(deltaTime, timestamp);

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const start = useCallback(() => {
    if (!rafRef.current) {
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [loop]);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return { start, stop };
}
