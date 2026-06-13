'use client';

import { Suspense, lazy } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface SplineSceneProps {
  scene: string;
  className?: string;
  onError?: () => void;
}

/** Lazy-loaded Spline 3D scene with a neon loading state that matches the
 *  M-Fi system (no generic shadcn `.loader`). */
export function SplineScene({ scene, className, onError }: SplineSceneProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-signal/30 border-t-signal" />
        </div>
      }
    >
      <Spline scene={scene} className={className} onError={onError} />
    </Suspense>
  );
}
