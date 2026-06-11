"use client";

import { useState } from "react";

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-mist transition hover:border-accent/50 hover:text-accent"
    >
      {copied ? "Copied ✓" : "Copy invite link"}
    </button>
  );
}
