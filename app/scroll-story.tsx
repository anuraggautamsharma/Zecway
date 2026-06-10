"use client";

// Scroll-driven storytelling (GSAP ScrollTrigger):
// 1. Tool names start scattered/rotated and magnetize into one neat row —
//    "every tool, one search bar", performed by the scroll itself.
// 2. Sections rise with a calm stagger. Reduced motion gets everything static.

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function ScatterToBar({ tools }: { tools: string[] }) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const chips = gsap.utils.toArray<HTMLElement>(".scatter-chip");
        chips.forEach((chip, i) => {
          gsap.from(chip, {
            x: gsap.utils.random(-260, 260),
            y: gsap.utils.random(-160, 160),
            rotation: gsap.utils.random(-28, 28),
            opacity: 0.25,
            ease: "power2.out",
            scrollTrigger: {
              trigger: wrap.current,
              start: "top 85%",
              end: "top 35%",
              scrub: 0.6,
            },
            delay: i * 0.01,
          });
        });
        gsap.from(".scatter-line", {
          scaleX: 0,
          transformOrigin: "left center",
          ease: "none",
          scrollTrigger: {
            trigger: wrap.current,
            start: "top 60%",
            end: "top 30%",
            scrub: 0.6,
          },
        });
      });
    }, wrap);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrap}>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {tools.map((t) => (
          <span
            key={t}
            className="scatter-chip rounded-lg border border-line bg-paper px-3.5 py-1.5 text-sm font-medium text-body"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="scatter-line mx-auto mt-8 h-px w-full max-w-md bg-accent/60" />
      <p className="mt-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-mist">
        one search bar
      </p>
    </div>
  );
}

export function RiseIn({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(ref.current, {
          y: 42,
          opacity: 0,
          duration: 0.9,
          delay,
          ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 88%" },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
