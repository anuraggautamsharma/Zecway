"use client";

// One World: a single persistent particle universe behind the whole page.
// It never resets — scroll morphs it through states, like one continuous shot:
// 0 chaos · 1 agitated chaos · 2 the orbital graph · 3 three separated layers ·
// 4 split clearance clusters · 5 calm halo. State is driven by which [data-act]
// is at the viewport center.

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Monochrome dust + black evidence nodes, sprinkled with the brand's block
// palette (deepened so the pastel hues read at particle size) and the rare
// magenta — per DESIGNfigma.md
const NODE = new THREE.Color("#000000");
const DUST = new THREE.Color("#a3a3a3");
const deepen = (hex: string) => {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0.22, -0.16);
  return c;
};
const BRAND = [
  deepen("#dceeb1"), // lime
  deepen("#c5b0f4"), // lilac
  deepen("#c8e6cd"), // mint
  deepen("#f3c9b6"), // coral
  deepen("#efd4d4"), // pink
  new THREE.Color("#1f1d3d"), // navy
  new THREE.Color("#ff3d8b"), // magenta — the rare spark
];

function bell(s: number, k: number) {
  return Math.max(0, 1 - Math.abs(s - k));
}

export default function WorldCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isMobile = window.innerWidth < 768;
    const COUNT = isMobile ? 380 : 1000;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.z = 16;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    // ── the six shapes of the world ──────────────────────────────────────
    const mk = () => new Float32Array(COUNT * 3);
    const chaos = mk();
    const orbit = mk();
    const layers = mk();
    const split = mk();
    const halo = mk();
    const seeds = new Float32Array(COUNT);
    const colors = new Float32Array(COUNT * 3);

    const sx = isMobile ? 7 : 14;
    const sy = isMobile ? 12 : 8;
    for (let i = 0; i < COUNT; i++) {
      seeds[i] = Math.random() * Math.PI * 2;
      const r3 = i % 3;
      const angle = (i / COUNT) * Math.PI * 2 * 3 + r3 * 2.1;
      const w = (Math.random() - 0.5) * 0.4;

      chaos[i * 3] = (Math.random() - 0.5) * sx * 2;
      chaos[i * 3 + 1] = (Math.random() - 0.5) * sy * 2;
      chaos[i * 3 + 2] = (Math.random() - 0.5) * 6;

      const oR = (isMobile ? 4.2 : 6.6) + r3 * (isMobile ? 1.2 : 1.6);
      orbit[i * 3] = Math.cos(angle) * (oR + w);
      orbit[i * 3 + 1] = Math.sin(angle) * (oR + w) * 0.62;
      orbit[i * 3 + 2] = Math.sin(angle * 2) * 0.8;

      const lR = (isMobile ? 3.4 : 5.2) + w;
      const spacing = isMobile ? 4.4 : 3.7;
      layers[i * 3] = Math.cos(angle) * lR;
      layers[i * 3 + 1] = (r3 - 1) * spacing + Math.sin(angle) * lR * 0.16;
      layers[i * 3 + 2] = Math.sin(angle) * lR * 0.5;

      const side = i % 2 === 0 ? -1 : 1;
      const cx = side * (isMobile ? 2.9 : 5.6);
      const rr = Math.cbrt(Math.random()) * (isMobile ? 1.9 : 2.4);
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      split[i * 3] = cx + rr * Math.sin(ph) * Math.cos(th);
      split[i * 3 + 1] = rr * Math.sin(ph) * Math.sin(th) * 0.8;
      split[i * 3 + 2] = rr * Math.cos(ph);

      const hR = (isMobile ? 5 : 7.6) + w * 2;
      halo[i * 3] = Math.cos(angle) * hR;
      halo[i * 3 + 1] = Math.sin(angle) * hR * 0.45;
      halo[i * 3 + 2] = Math.sin(angle * 3) * 0.5;

      const c =
        i % 6 === 0
          ? NODE
          : i % 3 === 1
            ? BRAND[(i / 3) % BRAND.length | 0]
            : DUST;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    // states 0 and 1 share the chaos shape; 1 only drifts harder
    const states = [chaos, chaos, orbit, layers, split, halo];

    const positions = new Float32Array(chaos);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: isMobile ? 0.105 : 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false,
    });
    scene.add(new THREE.Points(geo, mat));

    // constellation edges — visible in the graph and halo states
    const STEP = isMobile ? 4 : 2;
    const pairs: number[] = [];
    for (let i = 0; i < COUNT - 3; i += STEP) pairs.push(i, i + 3);
    const lp = new Float32Array(pairs.length * 3);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(lp, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: NODE,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    scene.add(new THREE.LineSegments(lineGeo, lineMat));

    // ── which act is at the viewport center → stateFloat 0..5 ───────────
    let actMids: { mid: number; state: number }[] = [];
    const measure = () => {
      actMids = Array.from(document.querySelectorAll<HTMLElement>("[data-act]")).map(
        (el) => ({
          mid: el.offsetTop + el.offsetHeight / 2,
          state: Number(el.dataset.act),
        }),
      );
    };
    measure();

    const stateAt = (y: number) => {
      if (actMids.length === 0) return 0;
      const c = y + window.innerHeight / 2;
      if (c <= actMids[0].mid) return actMids[0].state;
      for (let i = 0; i < actMids.length - 1; i++) {
        const a = actMids[i];
        const b = actMids[i + 1];
        if (c >= a.mid && c < b.mid) {
          return a.state + ((c - a.mid) / (b.mid - a.mid)) * (b.state - a.state);
        }
      }
      return actMids[actMids.length - 1].state;
    };

    let s = 0; // smoothed stateFloat
    let px = 0;
    let py = 0;
    const onMove = (e: PointerEvent) => {
      px = (e.clientX / window.innerWidth - 0.5) * 1.6;
      py = (e.clientY / window.innerHeight - 0.5) * 1.1;
    };
    if (!isMobile) window.addEventListener("pointermove", onMove);

    let raf = 0;
    let running = true;
    const clock = new THREE.Clock();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!running) return;
      const time = clock.getElapsedTime();

      s += (stateAt(window.scrollY) - s) * 0.06;
      const f = Math.min(Math.floor(s), states.length - 1);
      const c = Math.min(f + 1, states.length - 1);
      const frac = s - f;
      const A = states[f];
      const B = states[c];

      // drift amplitude: big in chaos, surging while the question types,
      // settling once the world organizes
      const organized = Math.min(1, Math.max(0, s - 1));
      const amp = 0.45 * (1 - organized * 0.85) * (1 + bell(s, 1) * 1.3);
      const spin = s > 1.5 ? time * 0.1 : 0;
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
        pos[i * 3] = rx + Math.sin(time * 0.35 + sd) * amp;
        pos[i * 3 + 1] = by + Math.cos(time * 0.28 + sd * 1.7) * amp;
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
      lineMat.opacity = bell(s, 2) * 0.45 + bell(s, 5) * 0.3;

      camera.position.x += (px - camera.position.x) * 0.04;
      camera.position.y += (-py - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    tick();

    const onVis = () => {
      running = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      measure();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden
    />
  );
}
