/**
 * M-Fi wordmark — the neon "·M-Fi PROTOCOL" lockup from the original
 * M-Fi Underwriter brand. Glowing cyan Orbitron over the dark canvas.
 */
const CYAN_GLOW = '0 0 10px #00f5ff, 0 0 28px rgba(0,245,255,0.65), 0 0 60px rgba(0,245,255,0.3)';

export function LogoMark({ className }: { className?: string; size?: number }) {
  return (
    <span className={`inline-flex select-none flex-col leading-none ${className ?? ''}`}>
      <span
        className="font-display text-lg font-black tracking-tight"
        style={{ color: '#00f5ff', textShadow: CYAN_GLOW }}
      >
        <span className="mr-0.5 align-middle text-[0.7em]">&#9679;</span>M&#8211;Fi
      </span>
      <span className="mt-[1px] pl-0.5 font-mono text-[7px] tracking-[0.42em] text-fg-faint">
        PROTOCOL
      </span>
    </span>
  );
}

export const Logo = LogoMark;
