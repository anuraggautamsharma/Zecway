"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "./actions";

const NAV = [
  {
    href: "/app",
    label: "Home",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    href: "/app/assistant",
    label: "Assistant",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/app/agents",
    label: "Agents",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 3 14h7l-1 8 10-12h-7z" />
      </svg>
    ),
  },
  {
    href: "/app/documents",
    label: "Library",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
  },
  {
    href: "/app/team",
    label: "Team",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

const SETTINGS_ITEM = {
  href: "/app/settings",
  label: "Settings",
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

const ADMIN_ITEM = {
  href: "/app/admin",
  label: "Founder console",
  icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  ),
};

function Nav({
  onNavigate,
  isFounder,
  isAdmin,
}: {
  onNavigate?: () => void;
  isFounder?: boolean;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const items = [
    ...NAV,
    ...(isAdmin ? [SETTINGS_ITEM] : []),
    ...(isFounder ? [ADMIN_ITEM] : []),
  ];
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active =
          item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
              active
                ? "bg-card font-medium text-ink"
                : "text-mist hover:bg-paper/60 hover:text-ink"
            }`}
          >
            <span className={active ? "text-accent" : ""}>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
      <span className="mt-1 flex cursor-default items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-mist/60">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22v-5" />
          <path d="M9 8V2" />
          <path d="M15 8V2" />
          <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
        </svg>
        Connectors
        <span className="ml-auto rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide">
          soon
        </span>
      </span>
    </nav>
  );
}

function SidebarContent({
  workspaceName,
  email,
  isFounder,
  isAdmin,
  onNavigate,
}: {
  workspaceName: string;
  email: string;
  isFounder?: boolean;
  isAdmin?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-6 px-3 pt-2">
        {/* mark + workspace name — the workspace is the identity in-product */}
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/brand/zecway-mark.png" alt="Zecway" className="h-6 w-auto" />
          <span className="truncate text-sm font-semibold text-ink">{workspaceName}</span>
        </Link>
      </div>
      <Nav onNavigate={onNavigate} isFounder={isFounder} isAdmin={isAdmin} />
      <div className="mt-auto border-t border-line px-3 pt-4">
        <p className="truncate text-xs text-mist">{email}</p>
        <form action={signOut} className="mt-2">
          <button className="text-xs font-medium text-mist transition hover:text-ink">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Shell({
  workspaceName,
  email,
  isFounder,
  isAdmin,
  children,
}: {
  workspaceName: string;
  email: string;
  isFounder?: boolean;
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-surface flex min-h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-cream md:block">
        <SidebarContent workspaceName={workspaceName} email={email} isFounder={isFounder} isAdmin={isAdmin} />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-line bg-paper/80 px-4 py-3 backdrop-blur md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-lg border border-line p-2 text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-ink">{workspaceName}</span>
        <span className="w-9" />
      </div>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-ink/20"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="animate-pop absolute inset-y-0 left-0 w-64 border-r border-line bg-cream shadow-xl">
            <SidebarContent
              workspaceName={workspaceName}
              email={email}
              isFounder={isFounder}
              isAdmin={isAdmin}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Content — pages wrap themselves in PageBody, or go full-bleed */}
      <main className="min-w-0 flex-1 pt-14 md:ml-60 md:pt-0">{children}</main>
    </div>
  );
}
