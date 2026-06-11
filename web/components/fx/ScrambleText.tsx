'use client';

import { useEffect, useRef, useState } from 'react';

const CHARS = '!<>-_\\/[]{}=+*^?#________01';

/** Terminal-style decode: text resolves out of random glyphs, on mount or when
 *  scrolled into view. Respects reduced-motion. */
export function ScrambleText({
  text,
  className,
  trigger = 'mount',
}: {
  text: string;
  className?: string;
  trigger?: 'mount' | 'view';
}) {
  const [display, setDisplay] = useState(text);
  const ref = useRef<HTMLSpanElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    const scramble = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setDisplay(text);
        return;
      }
      let frame = 0;
      const dur = 30;
      const id = window.setInterval(() => {
        frame++;
        const out = text
          .split('')
          .map((ch, i) => {
            if (ch === ' ') return ' ';
            const revealAt = (i / text.length) * dur * 0.7 + 5;
            return frame > revealAt ? ch : CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join('');
        setDisplay(out);
        if (frame > dur) {
          window.clearInterval(id);
          setDisplay(text);
        }
      }, 34);
      return () => window.clearInterval(id);
    };

    if (trigger === 'mount') {
      const cleanup = scramble();
      return cleanup;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting && !ran.current) {
          ran.current = true;
          scramble();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [text, trigger]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
