'use client';

import { useEffect, useRef } from 'react';

/**
 * Animated neon "agent network" — drifting nodes linked by cyan filaments that
 * brighten as nodes near each other and reach toward the cursor. Canvas 2D,
 * DPR-capped, static single frame on reduced-motion or the `?still` param.
 */
export function NeonNetwork() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    type Node = { x: number; y: number; vx: number; vy: number; accent: boolean };
    const count = Math.max(55, Math.min(130, Math.floor((w * h) / 12000)));
    const nodes: Node[] = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      accent: Math.random() < 0.14, // a few pink nodes for accent
    }));

    const mouse = { x: -9999, y: -9999 };
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const LINK = 170;
    const MOUSE_LINK = 220;
    const reduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      new URLSearchParams(window.location.search).has('still');

    let raf = 0;
    const frame = () => {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (!reduced) {
          a.x += a.vx;
          a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
        }
        // node-to-node filaments
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(0,245,255,${(1 - d / LINK) * 0.62})`;
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        // reach toward the cursor
        const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (md < MOUSE_LINK) {
          ctx.strokeStyle = `rgba(0,245,255,${(1 - md / MOUSE_LINK) * 0.55})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      // glowing nodes
      for (const a of nodes) {
        const color = a.accent ? '#ff006e' : '#00f5ff';
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.accent ? 2.6 : 2.1, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowBlur = 14;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (!reduced) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return <canvas ref={ref} className="h-full w-full" />;
}
