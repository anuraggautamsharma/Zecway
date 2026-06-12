"use client";

// Chapter navigation for the scroll story — six quiet dots tracking the
// acts, the active one stretched. Desktop only; phones have snap pacing.
import { useEffect, useState } from "react";

const ACTS: [string, string][] = [
  ["0", "Start"],
  ["1", "The question"],
  ["2", "The answer"],
  ["3", "Three layers"],
  ["4", "Clearance"],
  ["5", "Get early access"],
];

export default function ActNav() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const c = window.scrollY + window.innerHeight / 2;
      let best = 0;
      let bestDist = Infinity;
      document.querySelectorAll<HTMLElement>("[data-act]").forEach((el) => {
        const mid = el.offsetTop + el.offsetHeight / 2;
        const d = Math.abs(mid - c);
        if (d < bestDist) {
          bestDist = d;
          best = Number(el.dataset.act);
        }
      });
      setActive(best);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Story chapters"
      className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-2.5 md:flex"
    >
      {ACTS.map(([act, label]) => (
        <button
          key={act}
          type="button"
          aria-label={label}
          title={label}
          onClick={() =>
            document
              .querySelector(`[data-act="${act}"]`)
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className={`w-1.5 rounded-full transition-all duration-500 ${
            active === Number(act)
              ? "h-6 bg-ink"
              : "h-1.5 bg-ink/25 hover:bg-ink/60"
          }`}
        />
      ))}
    </nav>
  );
}
