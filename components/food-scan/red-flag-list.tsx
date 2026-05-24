import { AlertTriangle } from "lucide-react";
import { visualRedFlags, type VisualRedFlagId } from "@/lib/content/iddsi";

export function ScanRedFlagList({ ids }: { ids: VisualRedFlagId[] }) {
  if (!ids.length) return null;
  const items = visualRedFlags.filter((f) => ids.includes(f.id));
  return (
    <div className="space-y-2 rounded-2xl border-2 border-[var(--color-rose)]/40 bg-[var(--color-rose-soft)] p-4 text-[#9b2c2c]">
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        High-risk items visible
      </div>
      <ul className="space-y-1 text-sm leading-relaxed">
        {items.map((f) => (
          <li key={f.id} className="flex items-start gap-2">
            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
            {f.label}
          </li>
        ))}
      </ul>
      <p className="text-xs opacity-80">
        These don&apos;t mean you can&apos;t eat the meal — but they&apos;re worth a pause and,
        if you&apos;re unsure, a quick chat with your SLT.
      </p>
    </div>
  );
}
