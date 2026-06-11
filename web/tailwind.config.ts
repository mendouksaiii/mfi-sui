import type { Config } from 'tailwindcss';

/**
 * M-Fi neon design system (ported from the original M-Fi Underwriter).
 * Near-black canvas, neon cyan primary, with pink/lime/purple/amber accents.
 * Orbitron for display, Rajdhani for body, Share Tech Mono for data.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // surface scale (ink = dark, role preserved from before)
        ink: {
          950: '#050508',
          900: '#0d0d14',
          800: '#12121e',
          700: '#1e1e2e',
        },
        line: 'rgba(0,245,255,0.15)',
        'line-strong': 'rgba(0,245,255,0.40)',
        fg: {
          DEFAULT: '#e8e8f0',
          muted: '#9a9ab0',
          faint: '#5a5a70',
        },
        // primary brand accent — neon cyan
        signal: {
          DEFAULT: '#00f5ff',
          dim: '#00c2cc',
          glow: 'rgba(0,245,255,0.25)',
        },
        // semantic status (data only)
        repaid: '#a8ff00', // lime
        active: '#ffaa00', // amber
        denied: '#ff006e', // pink
        // extra neon palette
        neon: {
          cyan: '#00f5ff',
          pink: '#ff006e',
          lime: '#a8ff00',
          purple: '#bf00ff',
          amber: '#ffaa00',
        },
      },
      fontFamily: {
        display: ['Orbitron', 'ui-monospace', 'monospace'],
        sans: ['Rajdhani', 'system-ui', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.02em',
      },
      borderRadius: {
        xl: '4px',
      },
      boxShadow: {
        diffuse: '0 0 40px rgba(0,245,255,0.12)',
        'inset-edge': 'inset 0 1px 0 rgba(0,245,255,0.12)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'grid-shift': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(60px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.35', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.08)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-30px)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.16,1,0.3,1) infinite',
        shimmer: 'shimmer 1.6s infinite',
        marquee: 'marquee 36s linear infinite',
        'grid-shift': 'grid-shift 8s linear infinite',
        'pulse-glow-1': 'pulse-glow 7s ease-in-out infinite',
        'pulse-glow-2': 'pulse-glow 9s ease-in-out infinite',
        float: 'float 14s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
