"use client";

// Act II: the question, typed as interface — no card, just type.
import { useEffect, useState } from "react";

const QUESTIONS = [
  "where's the latest pricing deck?",
  "who owns customer onboarding?",
  "what did we decide about the rebrand?",
];

export default function QuestionType() {
  const [qi, setQi] = useState(0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const q = QUESTIONS[qi];
    if (typed.length < q.length) {
      const t = setTimeout(() => setTyped(q.slice(0, typed.length + 1)), 55);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setTyped("");
      setQi((qi + 1) % QUESTIONS.length);
    }, 2600);
    return () => clearTimeout(t);
  }, [typed, qi]);

  return (
    <p className="caret mx-auto max-w-3xl font-display text-3xl leading-snug text-on-dark sm:text-6xl">
      {typed}
    </p>
  );
}
