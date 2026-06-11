'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/** Full-bleed background image with a slow Ken-Burns drift and cursor parallax.
 *  Image lives at /public/backdrop.jpg. Inset so motion never reveals edges. */
export function ImageBackdrop() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 50, damping: 18 });
  const sy = useSpring(y, { stiffness: 50, damping: 18 });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onMove = (e: MouseEvent) => {
      x.set((e.clientX / window.innerWidth - 0.5) * 30);
      y.set((e.clientY / window.innerHeight - 0.5) * 30);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [x, y]);

  return (
    <motion.div style={{ x: sx, y: sy }} className="absolute inset-[-6%]">
      <div
        className="h-full w-full animate-kenburns bg-cover bg-center"
        style={{ backgroundImage: "url('/backdrop.jpg')", backgroundColor: '#06122b' }}
      />
    </motion.div>
  );
}
