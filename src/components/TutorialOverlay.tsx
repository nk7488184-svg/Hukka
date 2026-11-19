'use client';

import React, { useEffect, useState, useRef } from 'react';

interface TutorialOverlayProps {
  handDetected: boolean;
  nearMouth: boolean;
  blowDetected: boolean;
  onDismiss: () => void;
}

const STEPS = [
  {
    icon: '✋',
    title: 'Move your hand to grab the hose',
    description: 'Show your hand to the camera and reach for the hookah hose',
    condition: 'handDetected' as const,
  },
  {
    icon: '👄',
    title: 'Bring the mouthpiece toward your mouth',
    description: 'Guide the virtual mouthpiece close to your face',
    condition: 'nearMouth' as const,
  },
  {
    icon: '💨',
    title: 'Blow gently to create virtual smoke',
    description: 'Blow into your microphone or hold the button below to blow',
    condition: 'blowDetected' as const,
  },
];

export function TutorialOverlay({
  handDetected,
  nearMouth,
  blowDetected,
  onDismiss,
}: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const conditions = { handDetected, nearMouth, blowDetected };

  useEffect(() => {
    if (completed) return;

    const safeIndex = Math.min(currentStep, STEPS.length - 1);
    const step = STEPS[safeIndex];

    if (conditions[step.condition]) {
      if (timerRef.current) clearTimeout(timerRef.current);

      if (safeIndex < STEPS.length - 1) {
        timerRef.current = setTimeout(() => {
          setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
        }, 800);
      } else {
        timerRef.current = setTimeout(() => {
          setCompleted(true);
          setFadeOut(true);
          setTimeout(onDismiss, 600);
        }, 1200);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handDetected, nearMouth, blowDetected, currentStep, completed, onDismiss]);

  if (completed && fadeOut) {
    return null;
  }

  const safeStepIndex = Math.min(Math.max(currentStep, 0), STEPS.length - 1);
  const step = STEPS[safeStepIndex];
  if (!step) return null;

  return (
    <div
      className={`absolute inset-0 z-30 flex items-end justify-center pb-24 pointer-events-none transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="glass rounded-2xl px-8 py-6 max-w-md text-center animate-fade-in pointer-events-auto">
        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i < safeStepIndex
                  ? 'w-8 bg-green-400'
                  : i === safeStepIndex
                  ? 'w-8 bg-purple-400 animate-pulse-glow'
                  : 'w-4 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Current step */}
        <div className="animate-float">
          <span className="text-4xl mb-3 block">{step.icon}</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
        <p className="text-sm text-white/50">{step.description}</p>

        {/* Step counter */}
        <p className="text-xs text-white/30 mt-4">
          Step {safeStepIndex + 1} of {STEPS.length}
        </p>

        {/* Skip button */}
        <button
          onClick={onDismiss}
          className="mt-3 text-xs text-white/30 hover:text-white/60 transition-colors underline"
        >
          Skip Tutorial
        </button>
      </div>
    </div>
  );
}
