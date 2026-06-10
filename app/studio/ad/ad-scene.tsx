"use client";

// "0.4 SECONDS" v2 — layered motion-graphics cut. Every frame is a 5-layer
// composition: three.js dust field (pulsing on the half-beat) · blueprint
// grid · ghost numerals & props · foreground type · HUD telemetry. Cuts ride
// the felt beat of the stomp-claps track (81.3 bpm, fitted from the
// waveform); slash-wipes fire on cut boundaries. GSAP eases drive every
// move. window.__seek(t) renders any frame exactly.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

const exo = gsap.parseEase("expo.out");
const pun = gsap.parseEase("back.out(2.2)");
const cub = gsap.parseEase("power3.out");
const c01 = (x: number) => Math.min(1, Math.max(0, x));

// Beat grid fitted from the track: stomps at 0.3690s, felt beat 0.7380s.
const B8 = 0.369;
const B = 0.738;
export const AD_DURATION = 40.5 * B; // 29.889s

const BEATS: Record<string, [number, number]> = {
  open: [0, 2],
  q1: [2, 3],
  q2: [3, 4],
  q3: [4, 5],
  chaos: [5, 7.5],
  cost: [7.5, 10],
  beat: [10, 12],
  hare: [12, 14],
  search: [14, 16.5],
  answer: [16.5, 20],
  claim1: [20, 21.5],
  claim2: [21.5, 23],
  perm: [23, 26],
  climb: [26, 28.5],
  agent: [28.5, 31.5],
  connect: [31.5, 33.5],
  ask: [33.5, 36],
  end: [36, 40.51],
};
const CUTS = Object.fromEntries(
  Object.entries(BEATS).map(([k, [a, b]]) => [k, [a * B, b * B]]),
) as Record<string, [number, number]>;
const ORDER = Object.keys(CUTS);
const BOUNDS = ORDER.slice(1).map((k) => CUTS[k][0]);

const BGS: Record<string, string> = {
  open: "#181715", q1: "#faf9f5", q2: "#f5f0e8", q3: "#faf9f5",
  chaos: "#faf9f5", cost: "#e8540a", beat: "#181715", hare: "#faf9f5",
  search: "#f5f0e8", answer: "#faf9f5", claim1: "#f5f0e8", claim2: "#faf9f5",
  perm: "#faf9f5", climb: "#181715", agent: "#181715", connect: "#faf9f5",
  ask: "#faf9f5", end: "#e8540a",
};
const TONE: Record<string, "dark" | "light" | "ember"> = {
  open: "dark", q1: "light", q2: "light", q3: "light", chaos: "light",
  cost: "ember", beat: "dark", hare: "light", search: "light",
  answer: "light", claim1: "light", claim2: "light", perm: "light",
  climb: "dark", agent: "dark", connect: "light", ask: "light", end: "ember",
};
const NAMES: Record<string, string> = {
  open: "the clock", q1: "the questions", q2: "the questions", q3: "the questions",
  chaos: "tab avalanche", cost: "the cost", beat: "the turn", hare: "the hare",
  search: "ask", answer: "0.4 seconds", claim1: "receipts", claim2: "receipts",
  perm: "clearance", climb: "three layers", agent: "the worker",
  connect: "one graph", ask: "the claim", end: "zecway",
};

const APPS = ["Drive", "Slack", "Notion", "Email", "Jira", "Sheets", "Confluence", "GitHub", "Teams", "PDFs"];
const BEAT_LINE = "there's a faster animal.";
const SEARCH_Q = "where's the pricing deck?";
const AGENT_LINES = [
  "> reading customer RFP … 31 questions",
  "> drafting answers from the graph",
  "> citing every source",
  "> done · 4 minutes",
];

function chipLayout() {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 42 }, (_, i) => ({
    label: APPS[i % APPS.length],
    x: 4 + rnd() * 78,
    y: 8 + rnd() * 78,
    rot: (rnd() - 0.5) * 38,
    delay: i * 0.018,
    big: rnd() > 0.7,
  }));
}
const CHIPS = chipLayout();

export default function AdScene() {
  const root = useRef<HTMLDivElement>(null);
  const dustMount = useRef<HTMLDivElement>(null);
  const R = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const el = (k: string) => R.current[k];
    const sty = (k: string, css: Partial<CSSStyleDeclaration>) => {
      const e = el(k);
      if (e) Object.assign(e.style, css);
    };
    const txt = (k: string, s: string) => {
      const e = el(k);
      if (e && e.textContent !== s) e.textContent = s;
    };

    /* ── layer 1: three.js dust field ── */
    const W = window.innerWidth;
    const H = window.innerHeight;
    const scene3 = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(55, W / H, 0.1, 60);
    cam.position.z = 12;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    dustMount.current!.appendChild(renderer.domElement);

    const DN = 460;
    let s3 = 11;
    const rnd3 = () => ((s3 = (s3 * 16807) % 2147483647) - 1) / 2147483646;
    const dpos = new Float32Array(DN * 3);
    const dseed = new Float32Array(DN);
    const dcol = new Float32Array(DN * 3);
    const DUST = new THREE.Color("#8a8378");
    const EMB = new THREE.Color("#e8540a");
    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = (rnd3() - 0.5) * 16;
      dpos[i * 3 + 1] = (rnd3() - 0.5) * 20;
      dpos[i * 3 + 2] = (rnd3() - 0.5) * 5;
      dseed[i] = rnd3() * Math.PI * 2;
      const c = i % 7 === 0 ? EMB : DUST;
      dcol[i * 3] = c.r; dcol[i * 3 + 1] = c.g; dcol[i * 3 + 2] = c.b;
    }
    const dgeo = new THREE.BufferGeometry();
    dgeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(dpos), 3));
    dgeo.setAttribute("color", new THREE.BufferAttribute(dcol, 3));
    const dmat = new THREE.PointsMaterial({
      size: 0.06, vertexColors: true, transparent: true, opacity: 0.4,
      sizeAttenuation: true, depthWrite: false,
    });
    scene3.add(new THREE.Points(dgeo, dmat));

    const seek = (t: number) => {
      let scene = "end";
      for (const id of ORDER) {
        const [a, b] = CUTS[id];
        if (t >= a && t < b) { scene = id; break; }
      }
      const [a, b] = CUTS[scene];
      const p = c01((t - a) / (b - a));
      const tone = TONE[scene];
      if (root.current) root.current.style.background = BGS[scene];
      for (const id of ORDER) sty("sc-" + id, { display: id === scene ? "flex" : "none" });

      /* beat pulses */
      const pulse = Math.pow(1 - ((t / B) % 1), 3); // felt beat
      const pulse8 = Math.pow(1 - ((t / B8) % 1), 2.4); // stomp/clap subdivision
      const beatIdx = Math.floor(t / B);

      /* dust layer */
      const arr = dgeo.attributes.position.array as Float32Array;
      for (let i = 0; i < DN; i++) {
        arr[i * 3] = dpos[i * 3] + Math.sin(t * 0.32 + dseed[i]) * 0.5;
        arr[i * 3 + 1] = dpos[i * 3 + 1] + Math.cos(t * 0.27 + dseed[i] * 1.7) * 0.5;
        arr[i * 3 + 2] = dpos[i * 3 + 2];
      }
      dgeo.attributes.position.needsUpdate = true;
      dmat.size = 0.055 * (1 + pulse8 * 0.7);
      dmat.opacity = (tone === "dark" ? 0.55 : tone === "ember" ? 0.5 : 0.4) * (0.8 + pulse * 0.2);
      renderer.render(scene3, cam);

      /* grid + HUD layer */
      const hudCol = tone === "light" ? "rgba(20,20,19,0.45)" : "rgba(250,249,245,0.55)";
      const gridCol = tone === "light" ? "rgba(20,20,19,0.05)" : "rgba(250,249,245,0.07)";
      sty("grid", {
        backgroundImage: `linear-gradient(${gridCol} 1px, transparent 1px), linear-gradient(90deg, ${gridCol} 1px, transparent 1px)`,
      });
      for (const k of ["hud-tl", "hud-tr", "hud-bl", "hud-br", "marks"]) sty(k, { color: hudCol });
      sty("marks", { borderColor: hudCol });
      const ss = Math.floor(t);
      const ff = Math.floor((t % 1) * 24);
      txt("hud-tc", `00:${String(ss).padStart(2, "0")}.${String(ff).padStart(2, "0")}`);
      sty("hud-dot", {
        background: "#e8540a",
        transform: `scale(${0.7 + pulse * 0.9})`,
        opacity: String(0.4 + pulse * 0.6),
      });
      txt("hud-sc", `sc ${String(ORDER.indexOf(scene) + 1).padStart(2, "0")}/18 — ${NAMES[scene]}`);
      txt("hud-beat", `beat ${String(beatIdx + 1).padStart(2, "0")} · 81.3 bpm`);
      for (let i = 0; i < 6; i++) {
        const h = 5 + (pulse8 * 22 * Math.abs(Math.sin(dseed[i * 9] + beatIdx))) + pulse * 8;
        sty(`eq-${i}`, { height: `${h}px`, background: i % 3 === 0 ? "#e8540a" : hudCol });
      }

      /* scenes */
      switch (scene) {
        case "open": {
          const secs = p * 2.94;
          txt("open-clock", `00:0${Math.floor(secs)}.${Math.floor((secs % 1) * 10)}`);
          sty("open-clock", { opacity: String(exo(p * 4)), letterSpacing: `${4 - p * 10}px`, transform: `scale(${1 + pulse * 0.025})` });
          sty("open-tag", { opacity: String(exo(p * 3) * 0.8) });
          sty("open-strip", { transform: `translateX(${-p * 30}%)`, opacity: String(c01(p * 4) * 0.5) });
          break;
        }
        case "q1": case "q2": case "q3": {
          const k = pun(p * 1.6);
          const idx = { q1: "01", q2: "02", q3: "03" }[scene]!;
          txt(scene + "-ghost", idx);
          sty(scene + "-ghost", { opacity: String(c01(p * 3) * 0.5), transform: `translate(-50%,-50%) scale(${1.05 - cub(p) * 0.05})` });
          sty(scene + "-t", { transform: `translateY(${(1 - k) * 70}px) scale(${1.12 - k * 0.12})`, opacity: String(cub(p * 3)) });
          sty(scene + "-bar", { transform: `scaleX(${cub(c01(p * 2.2 - 0.2))})` });
          break;
        }
        case "chaos": {
          for (let i = 0; i < CHIPS.length; i++) {
            const ch = CHIPS[i];
            const lp = cub((p * 1.35 - ch.delay) * 2.2);
            sty(`chip-${i}`, {
              opacity: String(c01(lp * 3)),
              transform: `translate(-50%,-50%) translateY(${(1 - lp) * -130}vh) rotate(${ch.rot * lp}deg)`,
            });
          }
          txt("chaos-n", `TABS OPEN: ${Math.floor(cub(p) * 47)}`);
          txt("chaos-ghost", String(Math.floor(cub(p) * 47)));
          sty("chaos-ghost", { opacity: String(c01(p * 2) * 0.35) });
          const shake = p > 0.7 ? Math.sin(p * 220) * 5 * (p - 0.7) * 3.3 : 0;
          sty("sc-chaos", { display: "flex", transform: `translateX(${shake}px)` });
          break;
        }
        case "cost": {
          const k = pun(p * 2);
          txt("cost-n", (cub(p * 1.5) * 2.5).toFixed(1) + " hrs");
          sty("cost-n", { transform: `scale(${(0.7 + k * 0.3) * (1 + pulse * 0.02)})`, opacity: String(cub(p * 4)) });
          sty("cost-s1", { opacity: String(c01((p - 0.3) * 4)) });
          sty("cost-s2", { opacity: String(c01((p - 0.5) * 4)) });
          for (let i = 0; i < 4; i++) {
            const bh = cub(c01((p - 0.08 - i * 0.09) * 2.4)) * [34, 58, 44, 70][i];
            sty(`cost-bar-${i}`, { height: `${bh}%` });
          }
          sty("cost-strip", { transform: `rotate(-5deg) translateX(${-15 - p * 25}%)` });
          break;
        }
        case "beat": {
          const n = Math.floor(c01(p * 1.4) * BEAT_LINE.length);
          txt("beat-t", BEAT_LINE.slice(0, n) + (p < 0.92 && (t * 2.7) % 1 < 0.55 ? "▎" : ""));
          sty("beat-blip", { opacity: String(pulse), transform: `scale(${0.8 + pulse * 0.5})` });
          break;
        }
        case "hare": {
          const wipe = cub(p * 1.7);
          sty("hare-img", { clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`, opacity: "1" });
          for (const [k, d] of [["hare-ring", 0], ["hare-ring2", 0.22]] as const) {
            const ring = c01((p - d) * 1.4);
            sty(k, { transform: `translate(-50%,-50%) scale(${0.5 + ring * 1.5})`, opacity: String((1 - ring) * 0.7) });
          }
          const w = c01((p - 0.42) * 3);
          sty("hare-word", { opacity: String(w), transform: `translateY(${(1 - cub(w)) * 34}px)` });
          sty("hare-est", { opacity: String(c01((p - 0.6) * 3) * 0.7) });
          break;
        }
        case "search": {
          const k = pun(p * 2.2);
          sty("search-bar", { transform: `scale(${0.85 + k * 0.15})`, opacity: String(cub(p * 4)) });
          const n = Math.floor(c01((p - 0.14) * 1.55) * SEARCH_Q.length);
          txt("search-q", SEARCH_Q.slice(0, n));
          sty("search-caret", { opacity: (t * 2.7) % 1 < 0.55 ? "1" : "0" });
          sty("search-ghost", { opacity: String(c01(p * 2) * 0.4) });
          for (let i = 0; i < 3; i++) {
            const rp = c01((p - 0.45 - i * 0.12) * 4);
            sty(`search-row-${i}`, { opacity: String(rp * 0.65), transform: `translateY(${(1 - cub(rp)) * 18}px)` });
          }
          break;
        }
        case "answer": {
          const k = pun(p * 2.4);
          sty("ans-04", { transform: `scale(${(0.6 + k * 0.4) * (1 + pulse * 0.018)})`, opacity: String(cub(p * 5)) });
          sty("ans-ghost", { opacity: String(c01(p * 2.5) * 0.35) });
          const card = pun(c01((p - 0.26) * 2.4));
          sty("ans-card", { opacity: String(c01((p - 0.26) * 5)), transform: `translateY(${(1 - card) * 50}px)` });
          sty("ans-prog", { transform: `scaleX(${cub(c01((p - 0.3) * 1.8))})` });
          const ch1 = pun(c01((p - 0.48) * 4));
          const ch2 = pun(c01((p - 0.6) * 4));
          sty("ans-c1", { transform: `scale(${ch1})`, opacity: String(ch1) });
          sty("ans-c2", { transform: `scale(${ch2})`, opacity: String(ch2) });
          break;
        }
        case "claim1": case "claim2": {
          const k = pun(p * 1.8);
          sty(scene + "-t", { transform: `translateY(${(1 - k) * 80}px)`, opacity: String(cub(p * 4)) });
          sty(scene + "-ghost", { opacity: String(c01(p * 3) * 0.4) });
          if (scene === "claim2") {
            for (let i = 0; i < 3; i++) {
              const rp = pun(c01((p - 0.25 - i * 0.1) * 3.4));
              sty(`rcpt-${i}`, { transform: `scale(${rp})`, opacity: String(rp) });
            }
          }
          break;
        }
        case "perm": {
          const slide = exo(p * 2);
          sty("perm-l", { transform: `translateX(${(slide - 1) * 100}%)` });
          sty("perm-r", { transform: `translateX(${(1 - slide) * 100}%)` });
          sty("perm-div", { opacity: String(c01((p - 0.18) * 4) * (0.5 + pulse * 0.5)), transform: `translateX(-50%) scaleY(${cub(c01((p - 0.18) * 3))})` });
          const q = pun(c01((p - 0.2) * 3));
          sty("perm-q", { transform: `translate(-50%,-50%) scale(${q})`, opacity: String(q) });
          const ok = pun(c01((p - 0.44) * 3.2));
          sty("perm-ok", { transform: `translateY(${(1 - ok) * 40}px)`, opacity: String(ok) });
          const no = pun(c01((p - 0.56) * 3.2));
          sty("perm-no", { transform: `rotate(-6deg) scale(${no})`, opacity: String(no) });
          sty("perm-cap", { opacity: String(c01((p - 0.72) * 4)) });
          break;
        }
        case "climb": {
          const s1 = exo(c01(p * 2.4));
          const s2 = exo(c01((p - 0.2) * 2.4));
          const s3v = exo(c01((p - 0.4) * 2.4));
          sty("climb-1", { transform: `translateY(${(1 - s1) * 110}%)` });
          sty("climb-2", { transform: `translateY(${(1 - s2) * 220}%)` });
          sty("climb-3", { transform: `translateY(${(1 - s3v) * 330}%)` });
          txt("climb-ghost", "/03");
          sty("climb-ghost", { opacity: String(c01((p - 0.5) * 3) * 0.5) });
          break;
        }
        case "agent": {
          AGENT_LINES.forEach((line, i) => {
            const lp = c01((p - i * 0.19) * 5.2);
            const n = Math.floor(lp * line.length);
            txt(`agent-${i}`, line.slice(0, n));
            const check = pun(c01((p - i * 0.19 - 0.12) * 6));
            sty(`agent-c${i}`, { transform: `scale(${check})`, opacity: String(check) });
          });
          const pct = Math.floor(cub(p) * 100);
          const filled = Math.round(pct / 8);
          txt("agent-prog", `[${"#".repeat(filled)}${"-".repeat(13 - filled)}] ${pct}%`);
          sty("agent-ghost", { opacity: String(c01((p - 0.6) * 3) * 0.3) });
          break;
        }
        case "connect": {
          const k = pun(p * 1.8);
          sty("conn-t", { transform: `scale(${0.85 + k * 0.15})`, opacity: String(cub(p * 4)) });
          const hm = pun(c01(p * 2.6));
          sty("conn-hare", { transform: `translate(-50%,-50%) scale(${hm})`, opacity: String(hm) });
          sty("conn-ring", { transform: `translate(-50%,-50%) scale(${1 + pulse * 0.06})`, opacity: String(c01(p * 3) * 0.5) });
          for (let i = 0; i < 8; i++) {
            const cp = pun(c01((p - 0.12 - i * 0.055) * 3.2));
            sty(`conn-${i}`, { transform: `translate(-50%,-50%) scale(${cp})`, opacity: String(cp) });
            sty(`conn-line-${i}`, { transform: `rotate(${i * 45}deg) scaleX(${cub(c01((p - 0.08 - i * 0.05) * 2.8))})` });
          }
          break;
        }
        case "ask": {
          const l1 = pun(c01(p * 2.2));
          const l2 = pun(c01((p - 0.16) * 2.2));
          const dot = pun(c01((p - 0.4) * 3));
          sty("ask-1", { transform: `translateY(${(1 - l1) * 90}px)`, opacity: String(c01(p * 4)) });
          sty("ask-2", { transform: `translateY(${(1 - l2) * 90}px)`, opacity: String(c01((p - 0.16) * 4)) });
          sty("ask-dot", { transform: `scale(${dot})`, opacity: String(dot) });
          sty("ask-ghost", { opacity: String((1 - c01((p - 0.4) * 3)) * 0.35) });
          break;
        }
        case "end": {
          const k = pun(c01(p * 1.7));
          sty("end-mark", { transform: `scale(${(0.5 + k * 0.5) * (1 + pulse * 0.02)})`, opacity: String(cub(p * 4)) });
          sty("end-word", { opacity: String(c01((p - 0.2) * 3.2)), transform: `translateY(${(1 - cub(c01((p - 0.2) * 3.2))) * 30}px)` });
          sty("end-cta", { opacity: String(c01((p - 0.38) * 3)) });
          const ring = (t * 0.8) % 1;
          sty("end-ring", { transform: `translate(-50%,-50%) scale(${1 + ring * 1.6})`, opacity: String((1 - ring) * 0.35) });
          const ring2 = (t * 0.8 + 0.5) % 1;
          sty("end-ring2", { transform: `translate(-50%,-50%) scale(${1 + ring2 * 1.6})`, opacity: String((1 - ring2) * 0.25) });
          break;
        }
      }

      /* slash-wipe transitions on every cut boundary (= on a beat) */
      let wOpacity = 0, wX = -130;
      for (let i = 0; i < BOUNDS.length; i++) {
        const tb = BOUNDS[i];
        if (t > tb - 0.1 && t < tb + 0.13) {
          const w = (t - (tb - 0.1)) / 0.23;
          wX = -130 + cub(w) * 260;
          wOpacity = 1;
          sty("wipe", { background: i % 2 === 0 ? "#e8540a" : "#181715" });
          break;
        }
      }
      sty("wipe", { opacity: String(wOpacity), transform: `translateX(${wX}%) skewX(-14deg)` });

      /* opening fade from black */
      sty("fade", { opacity: String(c01(1 - t / 0.45)) });
    };

    (window as unknown as { __seek: (t: number) => Promise<void> }).__seek = (t: number) =>
      new Promise<void>((res) => {
        seek(t);
        requestAnimationFrame(() => requestAnimationFrame(() => res()));
      });

    let raf = 0;
    if (!location.search.includes("render")) {
      const t0 = performance.now();
      const loop = () => {
        raf = requestAnimationFrame(loop);
        seek(((performance.now() - t0) / 1000) % AD_DURATION);
      };
      loop();
    } else {
      seek(0);
    }
    const dm = dustMount.current;
    return () => {
      cancelAnimationFrame(raf);
      dgeo.dispose();
      dmat.dispose();
      renderer.dispose();
      if (dm?.contains(renderer.domElement)) dm.removeChild(renderer.domElement);
    };
  }, []);

  const reg = (k: string) => (e: HTMLElement | null) => { R.current[k] = e; };
  const scene = "absolute inset-0 hidden flex-col items-center justify-center text-center";
  const mono = "font-mono uppercase";
  const ghost = "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display leading-none";
  const ghostStroke = { color: "transparent", WebkitTextStroke: "2px rgba(232,84,10,0.5)" } as const;

  return (
    <div ref={root} className="fixed inset-0 overflow-hidden" style={{ background: "#181715" }}>
      {/* L1 dust */}
      <div ref={dustMount} className="pointer-events-none absolute inset-0" aria-hidden />
      {/* L2 blueprint grid */}
      <div ref={reg("grid")} className="pointer-events-none absolute inset-0" style={{ backgroundSize: "72px 72px" }} aria-hidden />

      {/* scenes (L3 ghosts + L4 content) */}
      <div ref={reg("sc-open")} className={scene}>
        <span ref={reg("open-tag")} className={`${mono} absolute left-12 top-24 text-base tracking-[0.35em] text-on-dark-soft`}>
          a workday, anywhere
        </span>
        <span ref={reg("open-clock")} className="font-mono text-[11rem] font-medium text-on-dark" />
        <div ref={reg("open-strip")} className={`${mono} absolute bottom-28 whitespace-nowrap font-mono text-xl tracking-[0.3em] text-on-dark-soft`}>
          monday 9:14 am · 47 tabs · 12 tools · 3 “quick questions” · monday 9:14 am · 47 tabs · 12 tools ·
        </div>
      </div>

      {(["q1", "q2", "q3"] as const).map((id, i) => (
        <div key={id} ref={reg("sc-" + id)} className={scene}>
          <span ref={reg(id + "-ghost")} className={ghost} style={{ ...ghostStroke, fontSize: "44rem" }} />
          <p ref={reg(id + "-t")} className="relative max-w-4xl px-12 font-display text-7xl leading-tight text-ink">
            {["Where's the pricing deck?", "Who owns onboarding?", "Is the contract signed?"][i]}
          </p>
          <span ref={reg(id + "-bar")} className="mt-8 h-1.5 w-40 origin-left bg-accent" style={{ transform: "scaleX(0)" }} />
        </div>
      ))}

      <div ref={reg("sc-chaos")} className={scene}>
        <span ref={reg("chaos-ghost")} className={ghost} style={{ ...ghostStroke, fontSize: "40rem" }} />
        {CHIPS.map((ch, i) => (
          <span key={i} ref={reg(`chip-${i}`)}
            className={`absolute rounded-xl border border-line bg-white px-6 py-3 font-mono ${ch.big ? "text-3xl" : "text-xl"} text-body shadow-[0_10px_30px_-12px_rgba(20,20,19,0.35)]`}
            style={{ left: `${ch.x}%`, top: `${ch.y}%`, opacity: 0 }}>
            {ch.label}
          </span>
        ))}
        <span ref={reg("chaos-n")} className={`${mono} absolute right-12 top-24 text-2xl tracking-[0.2em] text-accent`} />
      </div>

      <div ref={reg("sc-cost")} className={scene}>
        <div className="absolute inset-x-0 bottom-0 flex h-full items-end justify-center gap-10 px-24 pb-0 opacity-25">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} ref={reg(`cost-bar-${i}`)} className="w-32 bg-white" style={{ height: 0 }} />
          ))}
        </div>
        <div ref={reg("cost-strip")} className={`${mono} absolute top-32 whitespace-nowrap font-mono text-2xl tracking-[0.4em] text-white/30`}>
          time lost · time lost · time lost · time lost · time lost · time lost · time lost ·
        </div>
        <span ref={reg("cost-n")} className="relative font-display text-[12rem] leading-none text-white" />
        <p ref={reg("cost-s1")} className={`${mono} relative mt-8 text-2xl tracking-[0.3em] text-white/90`}>lost per person · every day</p>
        <p ref={reg("cost-s2")} className={`${mono} relative mt-3 text-2xl tracking-[0.3em] text-white/70`}>just searching</p>
      </div>

      <div ref={reg("sc-beat")} className={scene}>
        <span ref={reg("beat-blip")} className="mb-10 inline-block h-4 w-4 rounded-full bg-accent" />
        <p ref={reg("beat-t")} className="font-mono text-5xl text-on-dark" />
      </div>

      <div ref={reg("sc-hare")} className={scene}>
        <div className="relative">
          <span ref={reg("hare-ring")} className="absolute left-1/2 top-1/2 h-[480px] w-[480px] rounded-full border-[3px] border-accent" style={{ opacity: 0 }} />
          <span ref={reg("hare-ring2")} className="absolute left-1/2 top-1/2 h-[480px] w-[480px] rounded-full border-2 border-accent/60" style={{ opacity: 0 }} />
          <img ref={reg("hare-img")} src="/brand/zecway-mark.png" alt="" className="h-64 w-auto" style={{ clipPath: "inset(0 100% 0 0)" }} />
        </div>
        <span ref={reg("hare-word")} className="mt-8 font-display text-7xl text-ink" style={{ opacity: 0 }}>Zecway</span>
        <span ref={reg("hare-est")} className={`${mono} mt-5 text-lg tracking-[0.4em] text-mist`} style={{ opacity: 0 }}>the company brain</span>
      </div>

      <div ref={reg("sc-search")} className={scene}>
        <span ref={reg("search-ghost")} className={ghost} style={{ ...ghostStroke, fontSize: "44rem" }}>?</span>
        <div ref={reg("search-bar")} className="relative flex w-[78%] items-center gap-5 rounded-2xl border border-line bg-white px-9 py-7 shadow-[0_24px_60px_-24px_rgba(20,20,19,0.3)]">
          <span className="text-4xl text-mist">⌕</span>
          <span className="font-display text-5xl text-ink">
            <span ref={reg("search-q")} />
            <span ref={reg("search-caret")} className="text-accent">▎</span>
          </span>
        </div>
        <div className="mt-5 w-[78%] space-y-3">
          {["HR Policy 2026 — drive", "Pricing v4.2 — drive", "#go-to-market — slack"].map((row, i) => (
            <div key={row} ref={reg(`search-row-${i}`)} className="flex justify-between rounded-xl border border-line bg-white/70 px-7 py-4 font-mono text-xl text-mist" style={{ opacity: 0 }}>
              <span>{row.split(" — ")[0]}</span><span>{row.split(" — ")[1]}</span>
            </div>
          ))}
        </div>
      </div>

      <div ref={reg("sc-answer")} className={scene}>
        <span ref={reg("ans-ghost")} className={ghost} style={{ ...ghostStroke, fontSize: "36rem" }}>0.4</span>
        <p className={`${mono} relative text-2xl tracking-[0.35em] text-mist`}>answer in</p>
        <span ref={reg("ans-04")} className="relative font-mono text-[10rem] font-medium leading-none text-accent">0.4s</span>
        <div ref={reg("ans-card")} className="relative mt-8 w-[74%] overflow-hidden rounded-2xl border border-line bg-white p-9 text-left shadow-[0_24px_60px_-24px_rgba(20,20,19,0.3)]" style={{ opacity: 0 }}>
          <span ref={reg("ans-prog")} className="absolute left-0 top-0 h-1.5 w-full origin-left bg-accent" style={{ transform: "scaleX(0)" }} />
          <p className="font-display text-4xl leading-snug text-ink">Pricing v4.2, updated Tuesday by Marcus — here&apos;s the deck.</p>
          <div className="mt-6 flex gap-4">
            <span ref={reg("ans-c1")} className="rounded-lg bg-accent-soft px-5 py-2.5 font-mono text-xl text-accent-deep">[1] Drive</span>
            <span ref={reg("ans-c2")} className="rounded-lg bg-accent-soft px-5 py-2.5 font-mono text-xl text-accent-deep">[2] Slack</span>
          </div>
        </div>
      </div>

      <div ref={reg("sc-claim1")} className={scene}>
        <span ref={reg("claim1-ghost")} className={ghost} style={{ ...ghostStroke, fontSize: "30rem" }}>[</span>
        <p ref={reg("claim1-t")} className="relative font-display text-8xl text-ink">every claim,</p>
      </div>
      <div ref={reg("sc-claim2")} className={scene}>
        <span ref={reg("claim2-ghost")} className={ghost} style={{ ...ghostStroke, fontSize: "30rem" }}>]</span>
        <p ref={reg("claim2-t")} className="relative font-display text-8xl text-ink">has a receipt.</p>
        <div className="relative mt-10 flex gap-5">
          {["[1] Drive", "[2] Slack", "[3] Notion"].map((r, i) => (
            <span key={r} ref={reg(`rcpt-${i}`)} className="rounded-xl bg-accent px-7 py-3.5 font-mono text-2xl text-white" style={{ opacity: 0 }}>{r}</span>
          ))}
        </div>
      </div>

      <div ref={reg("sc-perm")} className={scene}>
        <div ref={reg("perm-l")} className="absolute inset-y-0 left-0 w-1/2 bg-paper" style={{ transform: "translateX(-100%)" }}>
          <p className={`${mono} absolute left-1/2 top-[30%] -translate-x-1/2 text-xl tracking-[0.25em] text-mist`}>finance · full clearance</p>
          <div ref={reg("perm-ok")} className="absolute left-1/2 top-[56%] w-[72%] -translate-x-1/2 rounded-xl border border-line bg-white p-7 text-left shadow-lg" style={{ opacity: 0 }}>
            <p className="font-display text-3xl text-ink">19 months of runway.</p>
            <p className="mt-3 font-mono text-lg text-mist">[1] Runway model · Sheets</p>
          </div>
        </div>
        <div ref={reg("perm-r")} className="absolute inset-y-0 right-0 w-1/2 bg-dark" style={{ transform: "translateX(100%)" }}>
          <p className={`${mono} absolute left-1/2 top-[30%] -translate-x-1/2 text-xl tracking-[0.25em] text-on-dark-soft`}>design · standard</p>
          <span ref={reg("perm-no")} className={`${mono} absolute left-1/2 top-[56%] -translate-x-1/2 border-[3px] border-accent px-8 py-4 text-3xl tracking-[0.2em] text-accent`} style={{ opacity: 0 }}>access denied</span>
        </div>
        <span ref={reg("perm-div")} className="absolute left-1/2 top-0 z-10 h-full w-0.5 origin-top bg-accent" style={{ opacity: 0 }} />
        <div ref={reg("perm-q")} className="absolute left-1/2 top-[41%] z-10 rounded-xl bg-white px-8 py-4 font-mono text-2xl text-ink shadow-xl" style={{ opacity: 0, transform: "translate(-50%,-50%) scale(0)" }}>
          &ldquo;what&apos;s our runway?&rdquo;
        </div>
        <p ref={reg("perm-cap")} className={`${mono} absolute bottom-24 left-1/2 z-10 -translate-x-1/2 text-xl tracking-[0.3em]`} style={{ opacity: 0, color: "#8e8b82" }}>
          same question · different clearance
        </p>
      </div>

      <div ref={reg("sc-climb")} className="absolute inset-0 hidden flex-col">
        <span ref={reg("climb-ghost")} className={`${mono} absolute right-14 top-1/2 z-10 -translate-y-1/2 font-mono text-[10rem]`} style={{ ...ghostStroke }} />
        <div ref={reg("climb-3")} className="flex h-1/3 items-center bg-accent px-20" style={{ transform: "translateY(330%)" }}>
          <span className="font-mono text-3xl text-white/80">03</span>
          <span className="ml-10 font-display text-7xl text-white">Agents</span>
          <span className={`${mono} ml-auto mr-24 font-mono text-xl tracking-[0.3em] text-white/60`}>the destination</span>
        </div>
        <div ref={reg("climb-2")} className="flex h-1/3 items-center bg-cream px-20" style={{ transform: "translateY(220%)" }}>
          <span className="font-mono text-3xl text-accent">02</span>
          <span className="ml-10 font-display text-7xl text-ink">Assistant</span>
          <span className={`${mono} ml-auto mr-24 font-mono text-xl tracking-[0.3em] text-mist`}>rolling out</span>
        </div>
        <div ref={reg("climb-1")} className="flex h-1/3 items-center bg-paper px-20" style={{ transform: "translateY(110%)" }}>
          <span className="font-mono text-3xl text-accent">01</span>
          <span className="ml-10 font-display text-7xl text-ink">Search</span>
          <span className={`${mono} ml-auto mr-24 font-mono text-xl tracking-[0.3em] text-mist`}>live today</span>
        </div>
      </div>

      <div ref={reg("sc-agent")} className={`${scene} !items-start !justify-center px-24 !text-left`}>
        <span ref={reg("agent-ghost")} className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 font-mono text-[24rem]" style={{ ...ghostStroke }}>✓</span>
        <p className={`${mono} mb-10 text-xl tracking-[0.3em] text-accent`}>agent: rfp-answerer</p>
        {AGENT_LINES.map((_, i) => (
          <div key={i} className="mb-6 flex items-center gap-6">
            <span ref={reg(`agent-${i}`)} className="font-mono text-3xl text-on-dark" />
            <span ref={reg(`agent-c${i}`)} className="font-mono text-3xl text-accent" style={{ opacity: 0 }}>✓</span>
          </div>
        ))}
        <p ref={reg("agent-prog")} className="mt-8 font-mono text-2xl text-on-dark-soft" />
      </div>

      <div ref={reg("sc-connect")} className={scene}>
        <span ref={reg("conn-ring")} className="absolute left-1/2 top-1/2 h-[58vh] w-[58vh] rounded-full border border-dashed border-accent/50" style={{ opacity: 0 }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={`l${i}`} ref={reg(`conn-line-${i}`)} className="absolute left-1/2 top-1/2 h-0.5 w-[32vw] origin-left bg-accent/30" style={{ transform: `rotate(${i * 45}deg) scaleX(0)` }} />
        ))}
        <img ref={reg("conn-hare")} src="/brand/zecway-mark.png" alt="" className="absolute left-1/2 top-1/2 h-28 w-auto" style={{ opacity: 0, transform: "translate(-50%,-50%) scale(0)" }} />
        <p ref={reg("conn-t")} className="relative mt-[52vh] font-display text-6xl text-ink">connects everything.</p>
        {APPS.slice(0, 8).map((aname, i) => {
          const ang = (i / 8) * Math.PI * 2 - Math.PI / 2;
          return (
            <span key={aname} ref={reg(`conn-${i}`)}
              className="absolute rounded-xl border border-line bg-white px-6 py-3 font-mono text-2xl text-body shadow-md"
              style={{ left: `calc(50% + ${Math.cos(ang) * 30}vw)`, top: `calc(50% + ${Math.sin(ang) * 26}vh)`, transform: "translate(-50%,-50%) scale(0)", opacity: 0 }}>
              {aname}
            </span>
          );
        })}
      </div>

      <div ref={reg("sc-ask")} className={scene}>
        <span ref={reg("ask-ghost")} className={ghost} style={{ ...ghostStroke, fontSize: "44rem" }}>?</span>
        <p ref={reg("ask-1")} className="relative font-display text-8xl leading-tight text-ink">Ask your company</p>
        <p ref={reg("ask-2")} className="relative font-display text-8xl leading-tight text-ink">
          anything<span ref={reg("ask-dot")} className="inline-block text-accent">.</span>
        </p>
      </div>

      <div ref={reg("sc-end")} className={scene}>
        <span ref={reg("end-ring")} className="absolute left-1/2 top-1/2 h-[560px] w-[560px] rounded-full border-2 border-white/60" style={{ opacity: 0 }} />
        <span ref={reg("end-ring2")} className="absolute left-1/2 top-1/2 h-[560px] w-[560px] rounded-full border border-white/40" style={{ opacity: 0 }} />
        <img ref={reg("end-mark")} src="/brand/zecway-mark.png" alt="" className="h-60 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
        <span ref={reg("end-word")} className="mt-6 font-display text-8xl text-white" style={{ opacity: 0 }}>Zecway</span>
        <p ref={reg("end-cta")} className={`${mono} mt-10 text-2xl tracking-[0.4em] text-white/85`} style={{ opacity: 0 }}>
          early access open · zecway.com
        </p>
      </div>

      {/* L5 HUD telemetry */}
      <div className="pointer-events-none absolute inset-0 z-20" aria-hidden>
        <span ref={reg("marks")} className="absolute inset-7 border border-transparent" style={{ borderWidth: 0 }} />
        {[["left-7 top-7", "border-l-2 border-t-2"], ["right-7 top-7", "border-r-2 border-t-2"], ["left-7 bottom-7", "border-l-2 border-b-2"], ["right-7 bottom-7", "border-r-2 border-b-2"]].map(([pos, b]) => (
          <span key={pos} ref={reg("marks")} className={`absolute ${pos} h-7 w-7 ${b}`} />
        ))}
        <span ref={reg("hud-tl")} className={`${mono} absolute left-14 top-12 font-mono text-sm tracking-[0.35em]`}>zecway · the company brain</span>
        <span ref={reg("hud-tr")} className="absolute right-14 top-11 flex items-center gap-3 font-mono text-sm tracking-[0.2em]">
          <span ref={reg("hud-dot")} className="inline-block h-2.5 w-2.5 rounded-full" />
          <span ref={reg("hud-tc")} />
        </span>
        <span ref={reg("hud-bl")} className={`${mono} absolute bottom-12 left-14 font-mono text-sm tracking-[0.3em]`}>
          <span ref={reg("hud-sc")} />
        </span>
        <span ref={reg("hud-br")} className="absolute bottom-11 right-14 flex items-end gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} ref={reg(`eq-${i}`)} className="w-1.5" style={{ height: 5 }} />
          ))}
          <span ref={reg("hud-beat")} className={`${mono} ml-4 font-mono text-sm tracking-[0.25em]`} />
        </span>
      </div>

      {/* L6 wipe + opening fade */}
      <div ref={reg("wipe")} className="pointer-events-none absolute -inset-y-10 -left-1/4 z-30 w-[150%]" style={{ opacity: 0 }} aria-hidden />
      <div ref={reg("fade")} className="pointer-events-none absolute inset-0 z-40 bg-black" aria-hidden />
    </div>
  );
}
