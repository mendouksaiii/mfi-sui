'use client';

import { useEffect, useRef } from 'react';

/** Animated "Sui sea" — a single full-screen WebGL fragment shader running
 *  domain-warped fractal noise to fake flowing, sun-lit water in Sui blues.
 *  No three.js. DPR-capped, pauses off-screen, static frame on reduced-motion. */
const FRAG = `
precision highp float;
uniform float u_time;
uniform vec2 u_res;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  float a=hash(i), b=hash(i+vec2(1.0,0.0)), c=hash(i+vec2(0.0,1.0)), d=hash(i+vec2(1.0,1.0));
  vec2 u=f*f*(3.0-2.0*f);
  return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;
}
float fbm(vec2 p){
  float v=0.0, a=0.5;
  for(int i=0;i<5;i++){ v+=a*noise(p); p=p*2.02+vec2(1.7,9.2); a*=0.5; }
  return v;
}
void main(){
  vec2 uv = gl_FragCoord.xy/u_res.xy;
  vec2 p = (gl_FragCoord.xy - 0.5*u_res.xy)/u_res.y * 3.2;
  float t = u_time*0.05;

  // domain warp for flowing current
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t*0.8)));
  vec2 r = vec2(fbm(p + 2.0*q + vec2(1.7 - t, 9.2)), fbm(p + 2.0*q + vec2(8.3, 2.8 + t)));
  float n = fbm(p + 3.0*r);
  float waves = fbm(p*2.1 + 2.0*r + vec2(-t*1.4, t));

  vec3 deep  = vec3(0.012,0.055,0.16);
  vec3 mid   = vec3(0.06,0.28,0.72);
  vec3 bright= vec3(0.22,0.59,1.0);
  vec3 foam  = vec3(0.72,0.90,1.0);

  vec3 col = mix(deep, mid, smoothstep(0.15,0.75,n));
  col = mix(col, bright, smoothstep(0.5,0.95,waves));
  col += foam * smoothstep(0.86,1.0,waves) * 0.6;

  // overhead light gradient + soft vignette
  col *= 0.78 + 0.32*uv.y;
  float vig = smoothstep(1.25, 0.25, length(uv-0.5));
  col *= 0.82 + 0.18*vig;

  gl_FragColor = vec4(col, 1.0);
}`;

const VERT = `
attribute vec2 a;
void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

export function SeaCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_res');

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(uRes, w, h);
    };
    resize();
    window.addEventListener('resize', resize);

    const reduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      new URLSearchParams(window.location.search).has('still');
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver((e) => (visible = e[0].isIntersecting), { threshold: 0 });
    io.observe(canvas);

    const start = performance.now();
    const paused = () => (window as unknown as { __seaPause?: boolean }).__seaPause === true;
    const render = (now: number) => {
      resize();
      gl.uniform1f(uTime, (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = !reduced && visible && !paused() ? requestAnimationFrame(render) : 0;
    };

    if (reduced) {
      gl.uniform1f(uTime, 8.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      raf = requestAnimationFrame(render);
    }

    // resume RAF when scrolled back into view
    const onVis = () => {
      if (!reduced && visible && !raf && !paused()) raf = requestAnimationFrame(render);
    };
    const visInterval = window.setInterval(onVis, 400);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(visInterval);
      window.removeEventListener('resize', resize);
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={className} />;
}
