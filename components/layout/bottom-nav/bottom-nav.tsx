"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div
        className="pointer-events-auto mx-3 flex w-full max-w-[26rem] items-center justify-between rounded-full border border-black/5 px-2 py-2 shadow-[0_10px_30px_-12px_rgba(28,36,51,0.25)] backdrop-blur-md"
        style={{ background: "color-mix(in oklab, var(--color-paper) 92%, transparent)" }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex h-12 flex-1 items-center justify-center rounded-full text-xs font-medium transition-colors",
                active
                  ? "text-[var(--color-ink)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full"
                  style={{ background: "var(--color-clay-soft)" }}
                />
              )}
              <span className="relative flex flex-col items-center gap-0.5">
                <Icon className="h-5 w-5" strokeWidth={2.25} />
                <span>{label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
