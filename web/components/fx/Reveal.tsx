'use client';

import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Scroll-triggered fade/slide reveal. If `stagger`, animates direct children
 *  marked with [data-reveal]; otherwise animates the wrapper itself. */
export function Reveal({
  children,
  className,
  y = 30,
  delay = 0,
  stagger = false,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  delay?: number;
  stagger?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const targets = stagger
        ? ref.current!.querySelectorAll('[data-reveal]')
        : ref.current!;
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          delay,
          stagger: stagger ? 0.09 : 0,
          scrollTrigger: { trigger: ref.current, start: 'top 82%' },
        },
      );
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
