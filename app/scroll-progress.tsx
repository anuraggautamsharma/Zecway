"use client";

// Reading progress for the scroll story — a hairline along the top edge
// that fills as you travel. Mobile only; desktop has the chapter dots.
import { useEffect, useRef } from "react";

export default function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-ink sm:hidden"
      style={{ transform: "scaleX(0)" }}
    />
  );
}
