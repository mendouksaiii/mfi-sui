'use client';

import { useCallback, type HTMLAttributes } from 'react';

/** Wrapper that feeds cursor coordinates to the `.spotlight` border effect —
 *  the card edge illuminates under the pointer. Pure CSS var write on
 *  mousemove; no re-renders, no layout work. */
export function Spotlight({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - r.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - r.top}px`);
  }, []);

  return (
    <div className={`spotlight ${className}`} onMouseMove={onMouseMove} {...rest}>
      {children}
    </div>
  );
}
