"use client";

// The signature moment, v2: every dot is a piece of company knowledge drifting
// in chaos. While a question types, the field agitates. The instant the cited
// answer lands, particles pull into orbital rings, a pulse rolls through, and
// neighbors CONNECT — the scattered company becomes a glowing knowledge graph.
// Driven by "zecway-demo-phase" events from the SearchDemo.

import { useEffect, useRef } from "react";
import * as THREE from "three";

const EMBER = new THREE.Color("#e8540a");
const INK = new THREE.Color("#7a7268");

export default function GraphField() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isMobile = window.innerWidth < 768;
    const COUNT = isMobile ? 420 : 1100;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100,
    );
    camera.position.z = 16;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const scatter = new Float32Array(COUNT * 3);
    const target = new Float32Array(COUNT * 3);
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);

    const spreadX = isMobile ? 9 : 16;
    const spreadY = isMobile ? 14 : 9;
    for (let i = 0; i < COUNT; i++) {
      scatter[i * 3] = (Math.random() - 0.5) * spreadX * 2;
      scatter[i * 3 + 1] = (Math.random() - 0.5) * spreadY * 2;
      scatter[i * 3 + 2] = (Math.random() - 0.5) * 6;

      const ring = i % 3;
      const radius = (isMobile ? 4.6 : 7.2) + ring * (isMobile ? 1.3 : 1.7);
      const angle = (i / COUNT) * Math.PI * 2 * 3 + ring * 2.1;
      const wobble = (Math.random() - 0.5) * 0.4;
      target[i * 3] = Math.cos(angle) * (radius + wobble);
      target[i * 3 + 1] = Math.sin(angle) * (radius + wobble) * 0.62;
      target[i * 3 + 2] = Math.sin(angle * 2) * 0.8;

      positions.set(scatter.slice(i * 3, i * 3 + 3), i * 3);
      seeds[i] = Math.random() * Math.PI * 2;

      const c = i % 7 === 0 ? EMBER : INK;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: isMobile ? 0.1 : 0.085,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false,
    });
    scene.add(new THREE.Points(geo, mat));

    // Constellation: connect ring-neighbors (i -> i+3 shares the same ring).
    // Visible only as the field organizes — the graph revealing itself.
    const STEP = isMobile ? 4 : 2; // connect every other particle pair
    const pairs: number[] = [];
    for (let i = 0; i < COUNT - 3; i += STEP) pairs.push(i, i + 3);
    const linePositions = new Float32Array(pairs.length * 3);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: EMBER,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    scene.add(new THREE.LineSegments(lineGeo, lineMat));

    // 0 = chaos, 1 = orbit; pulse rolls through when an answer lands
    let t = 0;
    let goal = 0;
    let pulse = 0;
    const onPhase = (e: Event) => {
      const phase = (e as CustomEvent).detail;
      const next = phase === "answer" ? 1 : 0;
      if (next === 1 && goal === 0) pulse = 1;
      goal = next;
    };
    window.addEventListener("zecway-demo-phase", onPhase);

    let px = 0;
    let py = 0;
    const onMove = (e: PointerEvent) => {
      px = (e.clientX / window.innerWidth - 0.5) * 1.4;
      py = (e.clientY / window.innerHeight - 0.5) * 1.0;
    };
    if (!isMobile) window.addEventListener("pointermove", onMove);

    let raf = 0;
    let running = true;
    const clock = new THREE.Clock();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!running) return;
      const time = clock.getElapsedTime();
      t += (goal - t) * 0.035;
      pulse *= 0.962;

      // while the question types, the chaos gets restless
      const agitation = goal === 0 ? 1.5 : 1 - t * 0.85;

      const pos = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < COUNT; i++) {
        const s = seeds[i];
        const dx = Math.sin(time * 0.35 * agitation + s) * 0.45 * (1 - t * 0.85);
        const dy = Math.cos(time * 0.28 * agitation + s * 1.7) * 0.45 * (1 - t * 0.85);
        const orbit = t > 0.02 ? time * 0.12 : 0;
        const tx = target[i * 3] * Math.cos(orbit) - target[i * 3 + 2] * Math.sin(orbit);
        const tz = target[i * 3] * Math.sin(orbit) + target[i * 3 + 2] * Math.cos(orbit);
        pos[i * 3] = scatter[i * 3] * (1 - t) + tx * t + dx;
        pos[i * 3 + 1] = scatter[i * 3 + 1] * (1 - t) + target[i * 3 + 1] * t + dy;
        pos[i * 3 + 2] = scatter[i * 3 + 2] * (1 - t) + tz * t;
      }
      geo.attributes.position.needsUpdate = true;

      // graph edges follow their endpoints; visible only when organized
      const lp = lineGeo.attributes.position.array as Float32Array;
      for (let k = 0; k < pairs.length; k++) {
        const i = pairs[k];
        lp[k * 3] = pos[i * 3];
        lp[k * 3 + 1] = pos[i * 3 + 1];
        lp[k * 3 + 2] = pos[i * 3 + 2];
      }
      lineGeo.attributes.position.needsUpdate = true;
      lineMat.opacity = Math.max(0, t - 0.45) * 0.5 + pulse * 0.25;

      mat.opacity = 0.7 + t * 0.3;
      mat.size = (isMobile ? 0.1 : 0.085) * (1 + pulse * 0.9);
      camera.position.x += (px - camera.position.x) * 0.04;
      camera.position.y += (-py - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    tick();

    const io = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
    });
    io.observe(mount);

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("zecway-demo-phase", onPhase);
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

  return <div ref={mountRef} className="pointer-events-none absolute inset-0" aria-hidden />;
}
