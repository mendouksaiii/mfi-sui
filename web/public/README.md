# Background image

Drop your background image here as **`backdrop.jpg`** (or `.png` / `.webp` —
if you use a different extension, update the path in
`components/fx/Background.tsx`).

- It becomes the base layer of the global site background.
- The animated WebGL "Sui sea" shimmers on top (screen-blended) for motion.
- To use ONLY the image (no animated sea), set `SEA_MOTION = false` in
  `components/fx/Background.tsx`.

Recommended: a wide, dark-ish blue-sea image, ~2400px wide, so light text
stays readable over it. The per-page veil already darkens it slightly.
