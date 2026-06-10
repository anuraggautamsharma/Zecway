"use client";

// The 30s launch film, as a deterministic composition: every pixel is a pure
// function of time t. window.__seek(t) renders frame t exactly — a render
// farm in a browser tab. Visiting the page plays it on loop as a preview.
//
// Timeline (seconds):
//  0.0–4.5  brand: lockup + kicker, chaos drifting
//  3.5–8.5  headline: "Your company already knows the answer."
//  8.5–13   the question types; the field agitates
//  13–19.5  ignition: orbit + constellation; the cited answer
//  19.5–23  the three layers
//  23–26    clearance split
//  26–30    halo; end card

import { useEffect, useRef } from "react";
import * as THREE from "three";

const EMBER = new THREE.Color("#e8540a");
const DUST = new THREE.Color("#7a7268");
const COUNT = 1400;

const QUESTION = "where's the latest pricing deck?";

// stateFloat keyframes: chaos 0 · agitated 1 · orbit 2 · layers 3 · split 4 · halo 5
const KEYS: [number, number][] = [
  [0, 0], [8.5, 0], [9.2, 1], [13, 1], [15.2, 2], [19.3, 2],
  [20.6, 3], [22.8, 3], [24.2, 4], [25.6, 4], [27.2, 5], [30, 5],
];

function stateAt(t: number) {
  if (t <= KEYS[0][0]) return KEYS[0][1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [t0, s0] = KEYS[i];
    const [t1, s1] = KEYS[i + 1];
    if (t >= t0 && t < t1) {
      const k = (t - t0) / (t1 - t0);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      return s0 + (s1 - s0) * e;
    }
  }
  return KEYS[KEYS.length - 1][1];
}

// smooth visibility window: ramp a→b, hold b→c, ramp out c→d
function vis(t: number, a: number, b: number, c: number, d: number) {
  if (t <= a || t >= d) return 0;
  if (t < b) return (t - a) / (b - a);
  if (t <= c) return 1;
  return 1 - (t - c) / (d - c);
}

function bell(s: number, k: number) {
  return Math.max(0, 1 - Math.abs(s - k));
}

export default function StudioScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const ovRef = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.z = 16;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    mount.appendChild(renderer.domElement);

    // ── shapes ───────────────────────────────────────────────────────────
    const mk = () => new Float32Array(COUNT * 3);
    const chaos = mk();
    const orbit = mk();
    const layers = mk();
    const split = mk();
    const halo = mk();
    const seeds = new Float32Array(COUNT);
    const colors = new Float32Array(COUNT * 3);

    // seeded PRNG so every render is identical
    let seed = 42;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < COUNT; i++) {
      seeds[i] = rnd() * Math.PI * 2;
      const r3 = i % 3;
      const angle = (i / COUNT) * Math.PI * 2 * 3 + r3 * 2.1;
      const w = (rnd() - 0.5) * 0.4;

      chaos[i * 3] = (rnd() - 0.5) * 22;
      chaos[i * 3 + 1] = (rnd() - 0.5) * 26;
      chaos[i * 3 + 2] = (rnd() - 0.5) * 6;

      const oR = 6.2 + r3 * 1.5;
      orbit[i * 3] = Math.cos(angle) * (oR + w);
      orbit[i * 3 + 1] = Math.sin(angle) * (oR + w) * 0.7;
      orbit[i * 3 + 2] = Math.sin(angle * 2) * 0.8;

      const lR = 5.0 + w;
      layers[i * 3] = Math.cos(angle) * lR;
      layers[i * 3 + 1] = (r3 - 1) * 4.4 + Math.sin(angle) * lR * 0.16;
      layers[i * 3 + 2] = Math.sin(angle) * lR * 0.5;

      const side = i % 2 === 0 ? -1 : 1;
      const rr = Math.cbrt(rnd()) * 2.6;
      const th = rnd() * Math.PI * 2;
      const ph = Math.acos(2 * rnd() - 1);
      split[i * 3] = side * 4.4 + rr * Math.sin(ph) * Math.cos(th);
      split[i * 3 + 1] = rr * Math.sin(ph) * Math.sin(th) * 0.85;
      split[i * 3 + 2] = rr * Math.cos(ph);

      const hR = 7.4 + w * 2;
      halo[i * 3] = Math.cos(angle) * hR;
      halo[i * 3 + 1] = Math.sin(angle) * hR * 0.5;
      halo[i * 3 + 2] = Math.sin(angle * 3) * 0.5;

      const c = i % 6 === 0 ? EMBER : DUST;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const states = [chaos, chaos, orbit, layers, split, halo];

    const positions = new Float32Array(chaos);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false,
    });
    scene.add(new THREE.Points(geo, mat));

    const pairs: number[] = [];
    for (let i = 0; i < COUNT - 3; i += 2) pairs.push(i, i + 3);
    const lp = new Float32Array(pairs.length * 3);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(lp, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: EMBER,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    scene.add(new THREE.LineSegments(lineGeo, lineMat));

    // ── the frame function ───────────────────────────────────────────────
    const ov = ovRef.current;
    const set = (key: string, opacity: number, rise = 18) => {
      const el = ov[key];
      if (!el) return;
      el.style.opacity = String(opacity);
      el.style.transform = `translateY(${(1 - opacity) * rise}px)`;
    };

    const seekFrame = (t: number) => {
      const s = stateAt(t);
      const f = Math.min(Math.floor(s), states.length - 1);
      const c = Math.min(f + 1, states.length - 1);
      const frac = s - f;
      const A = states[f];
      const B = states[c];

      const organized = Math.min(1, Math.max(0, s - 1));
      const amp = 0.5 * (1 - organized * 0.85) * (1 + bell(s, 1) * 1.4);
      const spin = s > 1.5 ? t * 0.12 : 0;
      const cos = Math.cos(spin);
      const sin = Math.sin(spin);

      const pos = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < COUNT; i++) {
        const sd = seeds[i];
        const bx = A[i * 3] * (1 - frac) + B[i * 3] * frac;
        const by = A[i * 3 + 1] * (1 - frac) + B[i * 3 + 1] * frac;
        const bz = A[i * 3 + 2] * (1 - frac) + B[i * 3 + 2] * frac;
        const rx = bx * cos - bz * sin;
        const rz = bx * sin + bz * cos;
        pos[i * 3] = rx + Math.sin(t * 0.4 + sd) * amp;
        pos[i * 3 + 1] = by + Math.cos(t * 0.32 + sd * 1.7) * amp;
        pos[i * 3 + 2] = rz;
      }
      geo.attributes.position.needsUpdate = true;

      const la = lineGeo.attributes.position.array as Float32Array;
      for (let k = 0; k < pairs.length; k++) {
        const i = pairs[k];
        la[k * 3] = pos[i * 3];
        la[k * 3 + 1] = pos[i * 3 + 1];
        la[k * 3 + 2] = pos[i * 3 + 2];
      }
      lineGeo.attributes.position.needsUpdate = true;
      lineMat.opacity = bell(s, 2) * 0.5 + bell(s, 5) * 0.3;

      renderer.render(scene, camera);

      // ── overlays ──
      set("brand", vis(t, 0.3, 1.4, 3.6, 4.8));
      set("headline", vis(t, 3.8, 5.0, 7.4, 8.6));
      set("ask", vis(t, 8.6, 9.4, 12.2, 13.2));
      const typeEl = ov["question"];
      if (typeEl) {
        const progress = Math.min(1, Math.max(0, (t - 9.0) / 2.8));
        const n = Math.round(QUESTION.length * progress);
        const caret = t < 12.6 && (t * 2) % 1 < 0.55 ? "▎" : "";
        typeEl.textContent = QUESTION.slice(0, n) + caret;
      }
      set("answer", vis(t, 14.2, 15.6, 18.2, 19.5));
      set("layers", vis(t, 20.2, 21.4, 22.4, 23.6));
      set("clearance", vis(t, 23.9, 24.9, 25.4, 26.4));
      set("end", vis(t, 27.0, 28.2, 60, 61), 10);
    };

    // render-farm hook: resolve after the frame is composited
    (window as unknown as { __seek: (t: number) => Promise<void> }).__seek = (t: number) =>
      new Promise<void>((res) => {
        seekFrame(t);
        requestAnimationFrame(() => requestAnimationFrame(() => res()));
      });

    // preview loop for human visitors (disabled with ?render=1)
    let raf = 0;
    if (!location.search.includes("render")) {
      const t0 = performance.now();
      const loop = () => {
        raf = requestAnimationFrame(loop);
        seekFrame(((performance.now() - t0) / 1000) % 30);
      };
      loop();
    } else {
      seekFrame(0);
    }

    return () => {
      cancelAnimationFrame(raf);
      geo.dispose();
      mat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  const reg = (k: string) => (el: HTMLElement | null) => {
    ovRef.current[k] = el;
  };
  const layer =
    "pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-16 text-center";

  return (
    <div className="fixed inset-0 overflow-hidden bg-paper">
      <div ref={mountRef} className="absolute inset-0" aria-hidden />

      <div ref={reg("brand")} className={layer} style={{ opacity: 0 }}>
        <img src="/brand/zecway-mark.png" alt="" className="h-32 w-auto" />
        <span className="mt-5 font-display text-6xl leading-none text-ink">Zecway</span>
        <span className="mt-6 font-mono text-base uppercase tracking-[0.35em] text-mist">
          the company brain
        </span>
      </div>

      <div ref={reg("headline")} className={layer} style={{ opacity: 0 }}>
        <p className="max-w-4xl font-display text-7xl leading-[1.08] text-ink">
          Your company already knows the answer.
        </p>
        <p className="mt-8 font-mono text-base uppercase tracking-[0.3em] text-mist">
          it&apos;s scattered across ten tools
        </p>
      </div>

      <div ref={reg("ask")} className={layer} style={{ opacity: 0 }}>
        <p className="mb-8 font-mono text-base uppercase tracking-[0.3em] text-mist">
          then, someone asks
        </p>
        <p ref={reg("question")} className="max-w-4xl font-display text-6xl leading-snug text-ink" />
      </div>

      <div ref={reg("answer")} className={layer} style={{ opacity: 0 }}>
        <p className="mb-7 font-mono text-base uppercase tracking-[0.3em] text-accent">
          ● answer · 0.4s
        </p>
        <p className="max-w-4xl font-display text-5xl leading-snug text-ink">
          Pricing v4.2, updated Tuesday by Marcus — here&apos;s the deck, and the
          thread explaining what changed.
        </p>
        <p className="mt-8 font-mono text-lg text-mist">
          [1] Pricing v4.2 · Drive&nbsp;&nbsp;&nbsp;[2] #go-to-market · Slack
        </p>
      </div>

      <div ref={reg("layers")} className={layer} style={{ opacity: 0 }}>
        <p className="font-display text-6xl leading-[1.3] text-ink">
          <span className="font-mono text-2xl text-accent">01</span> Search.
          <br />
          <span className="font-mono text-2xl text-accent">02</span> Assistant.
          <br />
          <span className="font-mono text-2xl text-accent">03</span> Agents.
        </p>
      </div>

      <div ref={reg("clearance")} className={layer} style={{ opacity: 0 }}>
        <p className="max-w-4xl font-display text-6xl leading-tight text-ink">
          Same question.
          <br />
          Different clearance.
        </p>
        <p className="mt-8 font-mono text-base uppercase tracking-[0.3em] text-mist">
          permissions enforced in the database
        </p>
      </div>

      <div ref={reg("end")} className={layer} style={{ opacity: 0 }}>
        <img src="/brand/zecway-vertical.png" alt="Zecway" className="h-72 w-auto" />
        <p className="mt-10 font-mono text-lg uppercase tracking-[0.35em] text-mist">
          early access open · zecway.com
        </p>
      </div>
    </div>
  );
}
