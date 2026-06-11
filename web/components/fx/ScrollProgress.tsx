'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

/** Fixed top progress rail tied to page scroll. Isolated Framer leaf. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-signal"
    />
  );
}
