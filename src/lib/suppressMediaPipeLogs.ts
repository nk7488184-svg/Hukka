// Client-side suppression for benign MediaPipe / TFLite internal WebAssembly messages
// MediaPipe's C++ code outputs informational strings like "INFO: Created TensorFlow Lite XNNPACK delegate"
// to stderr, which browsers and Next.js Turbopack dev server interpret as runtime errors.
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  const isBenignMediaPipeLog = (args: any[]) => {
    return args.some((arg) => {
      if (typeof arg !== 'string') return false;
      return (
        arg.includes('TensorFlow Lite') ||
        arg.includes('XNNPACK') ||
        arg.includes('face_landmarker_graph') ||
        arg.includes('Sets FaceBlendshapesGraph') ||
        arg.includes('landmark_projection_calculator') ||
        arg.includes('NORM_RECT without IMAGE_DIMENSIONS') ||
        arg.includes('gl_context') ||
        arg.includes('OpenGL error checking is disabled')
      );
    });
  };

  console.error = function (...args: any[]) {
    if (isBenignMediaPipeLog(args)) {
      // Re-route benign info messages to console.debug so they don't trigger the Next.js error overlay
      console.debug('[MediaPipe Info]', ...args);
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = function (...args: any[]) {
    if (isBenignMediaPipeLog(args)) {
      console.debug('[MediaPipe Warn]', ...args);
      return;
    }
    originalWarn.apply(console, args);
  };
}

export {};
