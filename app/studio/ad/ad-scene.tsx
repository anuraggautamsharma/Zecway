"use client";

// "0.4 SECONDS" — the Zecway launch ad. 30s, 18 cuts, every pixel a pure
// function of t. window.__seek(t) renders any frame exactly; visiting plays
// the loop. Built like a motion-graphics comp: scenes, beats, slams,
// match-cut stopwatch motif (00:00 → 2.5hrs → 0.4s).

import { useEffect, useRef } from "react";

/* ── easings ── */
const c01 = (x: number) => Math.min(1, Math.max(0, x));
const eo = (x: number) => 1 - Math.pow(2, -10 * c01(x)); // expo out
const ec = (x: number) => 1 - Math.pow(1 - c01(x), 3); // cubic out
const eb = (x: number) => {
  const k = 1.70158 * 1.2;
  const v = c01(x) - 1;
  return 1 + (k + 1) * v * v * v + k * v * v; // back out (punch)
};

const CUTS: Record<string, [number, number]> = {
  open: [0, 1.2],
  q1: [1.2, 1.8],
  q2: [1.8, 2.4],
  q3: [2.4, 3.0],
  chaos: [3.0, 4.6],
  cost: [4.6, 6.2],
  beat: [6.2, 7.4],
  hare: [7.4, 9.0],
  search: [9.0, 11.0],
  answer: [11.0, 13.2],
  claim1: [13.2, 14.2],
  claim2: [14.2, 15.2],
  perm: [15.2, 17.4],
  climb: [17.4, 19.6],
  agent: [19.6, 22.0],
  connect: [22.0, 24.0],
  ask: [24.0, 26.5],
  end: [26.5, 30.01],
};

const BGS: Record<string, string> = {
  open: "#181715", q1: "#faf9f5", q2: "#f5f0e8", q3: "#faf9f5",
  chaos: "#faf9f5", cost: "#e8540a", beat: "#181715", hare: "#faf9f5",
  search: "#f5f0e8", answer: "#faf9f5", claim1: "#f5f0e8", claim2: "#faf9f5",
  perm: "#faf9f5", climb: "#181715", agent: "#181715", connect: "#faf9f5",
  ask: "#faf9f5", end: "#e8540a",
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

// seeded chip layout for the chaos avalanche
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

    const seek = (t: number) => {
      // which scene
      let scene = "end";
      for (const [id, [a, b]] of Object.entries(CUTS)) {
        if (t >= a && t < b) { scene = id; break; }
      }
      const [a, b] = CUTS[scene];
      const p = c01((t - a) / (b - a));
      if (root.current) root.current.style.background = BGS[scene];
      for (const id of Object.keys(CUTS)) {
        sty("sc-" + id, { display: id === scene ? "flex" : "none" });
      }

      switch (scene) {
        case "open": {
          const secs = p * 3.94;
          txt("open-clock", `00:0${Math.floor(secs)}.${Math.floor((secs % 1) * 10)}`);
          sty("open-clock", { opacity: String(eo(p * 4)), letterSpacing: `${4 - p * 10}px` });
          sty("open-tag", { opacity: String(eo(p * 3) * 0.8) });
          break;
        }
        case "q1": case "q2": case "q3": {
          const k = eb(p * 1.8);
          sty(scene + "-t", {
            transform: `translateY(${(1 - k) * 70}px) scale(${1.12 - k * 0.12})`,
            opacity: String(ec(p * 3)),
          });
          break;
        }
        case "chaos": {
          for (let i = 0; i < CHIPS.length; i++) {
            const ch = CHIPS[i];
            const lp = ec((p * 1.35 - ch.delay) * 2.2);
            sty(`chip-${i}`, {
              opacity: String(c01(lp * 3)),
              transform: `translate(-50%,-50%) translateY(${(1 - lp) * -130}vh) rotate(${ch.rot * lp}deg)`,
            });
          }
          txt("chaos-n", `TABS OPEN: ${Math.floor(ec(p) * 47)}`);
          const shake = p > 0.75 ? Math.sin(p * 200) * 4 * (p - 0.75) * 4 : 0;
          sty("sc-chaos", { display: "flex", transform: `translateX(${shake}px)` });
          break;
        }
        case "cost": {
          const k = eb(p * 2.2);
          txt("cost-n", (ec(p * 1.6) * 2.5).toFixed(1) + " hrs");
          sty("cost-n", { transform: `scale(${0.7 + k * 0.3})`, opacity: String(ec(p * 4)) });
          sty("cost-s1", { opacity: String(c01((p - 0.3) * 4)) });
          sty("cost-s2", { opacity: String(c01((p - 0.5) * 4)) });
          break;
        }
        case "beat": {
          const n = Math.floor(c01(p * 1.5) * BEAT_LINE.length);
          txt("beat-t", BEAT_LINE.slice(0, n) + (p < 0.92 && (t * 2.5) % 1 < 0.55 ? "▎" : ""));
          break;
        }
        case "hare": {
          const wipe = ec(p * 1.7);
          sty("hare-img", { clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`, opacity: "1" });
          const ring = c01(p * 1.4);
          sty("hare-ring", {
            transform: `translate(-50%,-50%) scale(${0.5 + ring * 1.3})`,
            opacity: String((1 - ring) * 0.8),
          });
          const w = c01((p - 0.45) * 3);
          sty("hare-word", { opacity: String(w), transform: `translateY(${(1 - ec(w)) * 34}px)` });
          break;
        }
        case "search": {
          const k = eb(p * 2.4);
          sty("search-bar", { transform: `scale(${0.85 + k * 0.15})`, opacity: String(ec(p * 4)) });
          const n = Math.floor(c01((p - 0.18) * 1.7) * SEARCH_Q.length);
          txt("search-q", SEARCH_Q.slice(0, n));
          sty("search-caret", { opacity: (t * 2.5) % 1 < 0.55 ? "1" : "0" });
          break;
        }
        case "answer": {
          const k = eb(p * 2.6);
          sty("ans-04", { transform: `scale(${0.6 + k * 0.4})`, opacity: String(ec(p * 5)) });
          const card = eb(c01((p - 0.28) * 2.6));
          sty("ans-card", { opacity: String(c01((p - 0.28) * 5)), transform: `translateY(${(1 - card) * 50}px)` });
          const c1 = eb(c01((p - 0.5) * 4));
          const c2 = eb(c01((p - 0.62) * 4));
          sty("ans-c1", { transform: `scale(${c1})`, opacity: String(c1) });
          sty("ans-c2", { transform: `scale(${c2})`, opacity: String(c2) });
          break;
        }
        case "claim1": case "claim2": {
          const k = eb(p * 2);
          sty(scene + "-t", { transform: `translateY(${(1 - k) * 80}px)`, opacity: String(ec(p * 4)) });
          if (scene === "claim2") {
            const fly = ec(c01((p - 0.35) * 2.2));
            sty("claim2-chip", {
              transform: `translate(${fly * 36}vw, ${fly * -34}vh) scale(${1 - fly * 0.45}) rotate(${fly * 10}deg)`,
              opacity: "1",
            });
          }
          break;
        }
        case "perm": {
          const slide = eo(p * 2.2);
          sty("perm-l", { transform: `translateX(${(slide - 1) * 100}%)` });
          sty("perm-r", { transform: `translateX(${(1 - slide) * 100}%)` });
          const q = eb(c01((p - 0.22) * 3));
          sty("perm-q", { transform: `translate(-50%,-50%) scale(${q})`, opacity: String(q) });
          const ok = eb(c01((p - 0.48) * 3.4));
          sty("perm-ok", { transform: `translateY(${(1 - ok) * 40}px)`, opacity: String(ok) });
          const no = eb(c01((p - 0.6) * 3.4));
          sty("perm-no", { transform: `rotate(-6deg) scale(${no})`, opacity: String(no) });
          sty("perm-cap", { opacity: String(c01((p - 0.75) * 4)) });
          break;
        }
        case "climb": {
          const s1 = eo(c01(p * 2.6));
          const s2 = eo(c01((p - 0.22) * 2.6));
          const s3 = eo(c01((p - 0.44) * 2.6));
          sty("climb-1", { transform: `translateY(${(1 - s1) * 110}%)` });
          sty("climb-2", { transform: `translateY(${(1 - s2) * 220}%)` });
          sty("climb-3", { transform: `translateY(${(1 - s3) * 330}%)` });
          break;
        }
        case "agent": {
          AGENT_LINES.forEach((line, i) => {
            const lp = c01((p - i * 0.2) * 5.5);
            const n = Math.floor(lp * line.length);
            txt(`agent-${i}`, line.slice(0, n));
            const check = eb(c01((p - i * 0.2 - 0.13) * 6));
            sty(`agent-c${i}`, { transform: `scale(${check})`, opacity: String(check) });
          });
          break;
        }
        case "connect": {
          const k = eb(p * 2);
          sty("conn-t", { transform: `scale(${0.85 + k * 0.15})`, opacity: String(ec(p * 4)) });
          for (let i = 0; i < 8; i++) {
            const cp = eb(c01((p - 0.15 - i * 0.06) * 3.4));
            sty(`conn-${i}`, { transform: `scale(${cp})`, opacity: String(cp) });
          }
          break;
        }
        case "ask": {
          const l1 = eb(c01(p * 2.4));
          const l2 = eb(c01((p - 0.18) * 2.4));
          const dot = eb(c01((p - 0.42) * 3.2));
          sty("ask-1", { transform: `translateY(${(1 - l1) * 90}px)`, opacity: String(c01(p * 4)) });
          sty("ask-2", { transform: `translateY(${(1 - l2) * 90}px)`, opacity: String(c01((p - 0.18) * 4)) });
          sty("ask-dot", { transform: `scale(${dot})`, opacity: String(dot) });
          break;
        }
        case "end": {
          const k = eb(c01(p * 1.9));
          sty("end-mark", { transform: `scale(${0.5 + k * 0.5})`, opacity: String(ec(p * 4)) });
          sty("end-word", { opacity: String(c01((p - 0.22) * 3.4)), transform: `translateY(${(1 - ec(c01((p - 0.22) * 3.4))) * 30}px)` });
          sty("end-cta", { opacity: String(c01((p - 0.4) * 3)) });
          const ring = (t * 0.7) % 1;
          sty("end-ring", {
            transform: `translate(-50%,-50%) scale(${1 + ring * 1.6})`,
            opacity: String((1 - ring) * 0.35),
          });
          break;
        }
      }
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
        seek(((performance.now() - t0) / 1000) % 30);
      };
      loop();
    } else {
      seek(0);
    }
    return () => cancelAnimationFrame(raf);
  }, []);

  const reg = (k: string) => (e: HTMLElement | null) => { R.current[k] = e; };
  const scene = "absolute inset-0 hidden flex-col items-center justify-center text-center";
  const mono = "font-mono uppercase";

  return (
    <div ref={root} className="fixed inset-0 overflow-hidden" style={{ background: "#181715" }}>
      {/* OPEN — racing stopwatch */}
      <div ref={reg("sc-open")} className={scene}>
        <span ref={reg("open-tag")} className={`${mono} absolute left-12 top-12 text-base tracking-[0.35em] text-on-dark-soft`}>
          a workday, anywhere
        </span>
        <span ref={reg("open-clock")} className="font-mono text-[11rem] font-medium text-on-dark" />
      </div>

      {/* RAPID QUESTIONS */}
      {(["q1", "q2", "q3"] as const).map((id, i) => (
        <div key={id} ref={reg("sc-" + id)} className={scene}>
          <span className={`${mono} absolute left-12 top-12 text-base tracking-[0.35em] text-mist`}>
            q.0{i + 1}
          </span>
          <p ref={reg(id + "-t")} className="max-w-4xl px-12 font-display text-7xl leading-tight text-ink">
            {["Where's the pricing deck?", "Who owns onboarding?", "Is the contract signed?"][i]}
          </p>
        </div>
      ))}

      {/* CHAOS AVALANCHE */}
      <div ref={reg("sc-chaos")} className={scene}>
        {CHIPS.map((ch, i) => (
          <span
            key={i}
            ref={reg(`chip-${i}`)}
            className={`absolute rounded-xl border border-line bg-white px-6 py-3 font-mono ${ch.big ? "text-3xl" : "text-xl"} text-body shadow-[0_10px_30px_-12px_rgba(20,20,19,0.35)]`}
            style={{ left: `${ch.x}%`, top: `${ch.y}%`, opacity: 0 }}
          >
            {ch.label}
          </span>
        ))}
        <span ref={reg("chaos-n")} className={`${mono} absolute right-12 top-12 text-2xl tracking-[0.2em] text-accent`} />
      </div>

      {/* THE COST */}
      <div ref={reg("sc-cost")} className={scene}>
        <span ref={reg("cost-n")} className="font-display text-[12rem] leading-none text-white" />
        <p ref={reg("cost-s1")} className={`${mono} mt-8 text-2xl tracking-[0.3em] text-white/90`}>
          lost per person · every day
        </p>
        <p ref={reg("cost-s2")} className={`${mono} mt-3 text-2xl tracking-[0.3em] text-white/70`}>
          just searching
        </p>
      </div>

      {/* BEAT */}
      <div ref={reg("sc-beat")} className={scene}>
        <p ref={reg("beat-t")} className="font-mono text-5xl text-on-dark" />
      </div>

      {/* HARE REVEAL */}
      <div ref={reg("sc-hare")} className={scene}>
        <div className="relative">
          <span ref={reg("hare-ring")} className="absolute left-1/2 top-1/2 h-[480px] w-[480px] rounded-full border-[3px] border-accent" style={{ opacity: 0 }} />
          <img ref={reg("hare-img")} src="/brand/zecway-mark.png" alt="" className="h-64 w-auto" style={{ clipPath: "inset(0 100% 0 0)" }} />
        </div>
        <span ref={reg("hare-word")} className="mt-8 font-display text-7xl text-ink" style={{ opacity: 0 }}>
          Zecway
        </span>
      </div>

      {/* SEARCH */}
      <div ref={reg("sc-search")} className={scene}>
        <div ref={reg("search-bar")} className="flex w-[78%] items-center gap-5 rounded-2xl border border-line bg-white px-9 py-7 shadow-[0_24px_60px_-24px_rgba(20,20,19,0.3)]">
          <span className="text-4xl text-mist">⌕</span>
          <span className="font-display text-5xl text-ink">
            <span ref={reg("search-q")} />
            <span ref={reg("search-caret")} className="text-accent">▎</span>
          </span>
        </div>
      </div>

      {/* 0.4s ANSWER */}
      <div ref={reg("sc-answer")} className={scene}>
        <p className={`${mono} text-2xl tracking-[0.35em] text-mist`}>answer in</p>
        <span ref={reg("ans-04")} className="font-mono text-[10rem] font-medium leading-none text-accent">
          0.4s
        </span>
        <div ref={reg("ans-card")} className="mt-8 w-[74%] rounded-2xl border border-line bg-white p-9 text-left shadow-[0_24px_60px_-24px_rgba(20,20,19,0.3)]" style={{ opacity: 0 }}>
          <p className="font-display text-4xl leading-snug text-ink">
            Pricing v4.2, updated Tuesday by Marcus — here&apos;s the deck.
          </p>
          <div className="mt-6 flex gap-4">
            <span ref={reg("ans-c1")} className="rounded-lg bg-accent-soft px-5 py-2.5 font-mono text-xl text-accent-deep">[1] Drive</span>
            <span ref={reg("ans-c2")} className="rounded-lg bg-accent-soft px-5 py-2.5 font-mono text-xl text-accent-deep">[2] Slack</span>
          </div>
        </div>
      </div>

      {/* CLAIM COUPLET */}
      <div ref={reg("sc-claim1")} className={scene}>
        <p ref={reg("claim1-t")} className="font-display text-8xl text-ink">every claim,</p>
      </div>
      <div ref={reg("sc-claim2")} className={scene}>
        <p ref={reg("claim2-t")} className="font-display text-8xl text-ink">has a receipt.</p>
        <span ref={reg("claim2-chip")} className="absolute left-1/2 top-1/2 -ml-10 rounded-lg bg-accent px-6 py-3 font-mono text-3xl text-white">
          [1]
        </span>
      </div>

      {/* PERMISSIONS SPLIT */}
      <div ref={reg("sc-perm")} className={scene}>
        <div ref={reg("perm-l")} className="absolute inset-y-0 left-0 w-1/2 bg-paper" style={{ transform: "translateX(-100%)" }}>
          <div ref={reg("perm-ok")} className="absolute left-1/2 top-[58%] w-[72%] -translate-x-1/2 rounded-xl border border-line bg-white p-7 text-left shadow-lg" style={{ opacity: 0 }}>
            <p className="font-display text-3xl text-ink">19 months of runway.</p>
            <p className="mt-3 font-mono text-lg text-mist">[1] Runway model · Sheets</p>
          </div>
          <p className={`${mono} absolute left-1/2 top-[30%] -translate-x-1/2 text-xl tracking-[0.25em] text-mist`}>finance · full clearance</p>
        </div>
        <div ref={reg("perm-r")} className="absolute inset-y-0 right-0 w-1/2 bg-dark" style={{ transform: "translateX(100%)" }}>
          <span ref={reg("perm-no")} className={`${mono} absolute left-1/2 top-[58%] -translate-x-1/2 border-[3px] border-accent px-8 py-4 text-3xl tracking-[0.2em] text-accent`} style={{ opacity: 0 }}>
            access denied
          </span>
          <p className={`${mono} absolute left-1/2 top-[30%] -translate-x-1/2 text-xl tracking-[0.25em] text-on-dark-soft`}>design · standard</p>
        </div>
        <div ref={reg("perm-q")} className="absolute left-1/2 top-[42%] z-10 rounded-xl bg-white px-8 py-4 font-mono text-2xl text-ink shadow-xl" style={{ opacity: 0, transform: "translate(-50%,-50%) scale(0)" }}>
          &ldquo;what&apos;s our runway?&rdquo;
        </div>
        <p ref={reg("perm-cap")} className={`${mono} absolute bottom-14 left-1/2 z-10 -translate-x-1/2 text-xl tracking-[0.3em] text-mist mix-blend-difference`} style={{ opacity: 0, color: "#999" }}>
          same question · different clearance
        </p>
      </div>

      {/* THE CLIMB */}
      <div ref={reg("sc-climb")} className="absolute inset-0 hidden flex-col">
        <div ref={reg("climb-3")} className="flex h-1/3 items-center bg-accent px-20" style={{ transform: "translateY(330%)" }}>
          <span className="font-mono text-3xl text-white/80">03</span>
          <span className="ml-10 font-display text-7xl text-white">Agents</span>
        </div>
        <div ref={reg("climb-2")} className="flex h-1/3 items-center bg-cream px-20" style={{ transform: "translateY(220%)" }}>
          <span className="font-mono text-3xl text-accent">02</span>
          <span className="ml-10 font-display text-7xl text-ink">Assistant</span>
        </div>
        <div ref={reg("climb-1")} className="flex h-1/3 items-center bg-paper px-20" style={{ transform: "translateY(110%)" }}>
          <span className="font-mono text-3xl text-accent">01</span>
          <span className="ml-10 font-display text-7xl text-ink">Search</span>
        </div>
      </div>

      {/* AGENT TERMINAL */}
      <div ref={reg("sc-agent")} className={`${scene} !items-start !justify-center px-24 !text-left`}>
        <p className={`${mono} mb-10 text-xl tracking-[0.3em] text-accent`}>agent: rfp-answerer</p>
        {AGENT_LINES.map((_, i) => (
          <div key={i} className="mb-6 flex items-center gap-6">
            <span ref={reg(`agent-${i}`)} className="font-mono text-3xl text-on-dark" />
            <span ref={reg(`agent-c${i}`)} className="font-mono text-3xl text-accent" style={{ opacity: 0 }}>✓</span>
          </div>
        ))}
      </div>

      {/* CONNECTS EVERYTHING */}
      <div ref={reg("sc-connect")} className={scene}>
        <p ref={reg("conn-t")} className="font-display text-7xl text-ink">connects everything.</p>
        {APPS.slice(0, 8).map((aname, i) => {
          const ang = (i / 8) * Math.PI * 2 - Math.PI / 2;
          return (
            <span
              key={aname}
              ref={reg(`conn-${i}`)}
              className="absolute rounded-xl border border-line bg-white px-6 py-3 font-mono text-2xl text-body shadow-md"
              style={{
                left: `calc(50% + ${Math.cos(ang) * 34}vw)`,
                top: `calc(50% + ${Math.sin(ang) * 30}vh)`,
                transform: "translate(-50%,-50%) scale(0)",
                opacity: 0,
              }}
            >
              {aname}
            </span>
          );
        })}
      </div>

      {/* ASK */}
      <div ref={reg("sc-ask")} className={scene}>
        <p ref={reg("ask-1")} className="font-display text-8xl leading-tight text-ink">Ask your company</p>
        <p ref={reg("ask-2")} className="font-display text-8xl leading-tight text-ink">
          anything<span ref={reg("ask-dot")} className="inline-block text-accent">.</span>
        </p>
      </div>

      {/* END CARD */}
      <div ref={reg("sc-end")} className={scene}>
        <span ref={reg("end-ring")} className="absolute left-1/2 top-1/2 h-[560px] w-[560px] rounded-full border-2 border-white/60" style={{ opacity: 0 }} />
        <img ref={reg("end-mark")} src="/brand/zecway-mark.png" alt="" className="h-60 w-auto" style={{ filter: "brightness(0) invert(1)" }} />
        <span ref={reg("end-word")} className="mt-6 font-display text-8xl text-white" style={{ opacity: 0 }}>Zecway</span>
        <p ref={reg("end-cta")} className={`${mono} mt-10 text-2xl tracking-[0.4em] text-white/85`} style={{ opacity: 0 }}>
          early access open · zecway.com
        </p>
      </div>
    </div>
  );
}
