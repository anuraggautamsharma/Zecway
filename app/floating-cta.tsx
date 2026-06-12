"use client";

// The conversion action stays one tap away after the hero — a floating
// pill (top-right on desktop, thumb-zone on mobile) that gets out of the
// way while the hero CTA or the join form is on screen.
import { useEffect, useState } from "react";

export default function FloatingCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const past = window.scrollY > window.innerHeight * 0.7;
      const join = document.getElementById("join");
      const nearEnd = join
        ? join.getBoundingClientRect().top < window.innerHeight * 0.8
        : false;
      setShow(past && !nearEnd);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const base =
    "fixed z-40 rounded-full bg-accent font-[480] text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)] transition-all duration-500 hover:bg-accent-deep active:scale-[0.97]";
  const hiddenUp = "pointer-events-none -translate-y-3 opacity-0";
  const hiddenDown = "pointer-events-none translate-y-3 opacity-0";

  return (
    <>
      <a
        href="#join"
        className={`${base} right-6 top-6 hidden px-5 py-2.5 text-sm md:block ${
          show ? "translate-y-0 opacity-100" : hiddenUp
        }`}
      >
        Get early access
      </a>
      <a
        href="#join"
        className={`${base} inset-x-4 bottom-4 py-3.5 text-center text-sm md:hidden ${
          show ? "translate-y-0 opacity-100" : hiddenDown
        }`}
      >
        Get early access
      </a>
    </>
  );
}
