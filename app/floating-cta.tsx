"use client";

// Desktop: the conversion action stays one click away after the hero —
// a quiet floating pill, not a header.
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

  return (
    <a
      href="#join"
      className={`fixed right-6 top-6 z-40 hidden rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(232,84,10,0.5)] transition-all duration-500 hover:bg-accent-deep active:scale-[0.97] md:block ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
      }`}
    >
      Get early access
    </a>
  );
}
