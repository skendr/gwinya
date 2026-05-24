"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Camera } from "lucide-react";

/**
 * Floating action button — the camera, hovering above the bottom nav.
 * Hidden on /scan itself (you're already there) and on /sign-in (no auth).
 */
const HIDE_ON = ["/scan", "/sign-in", "/auth"];

export function FloatingScanButton() {
  const pathname = usePathname();
  if (HIDE_ON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.4 }}
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 4.5rem)" }}
    >
      <Link
        href="/scan"
        aria-label="Scan food"
        className="pointer-events-auto group relative grid h-14 w-14 place-items-center rounded-full text-white shadow-[0_8px_22px_-6px_rgba(213,90,58,0.55),0_2px_0_0_var(--color-clay-deep)] transition-transform active:translate-y-[2px]"
        style={{ background: "var(--color-clay)" }}
      >
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(closest-side, rgba(213,90,58,0.45), transparent 70%)",
            transform: "scale(1.5)",
          }}
        />
        <Camera className="h-6 w-6" strokeWidth={2.25} />
      </Link>
    </motion.div>
  );
}
