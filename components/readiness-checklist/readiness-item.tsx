"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { ChecklistItem } from "@/lib/domain/types";

export function ReadinessItem({
  item,
  checked,
  onChange,
}: {
  item: ChecklistItem;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label
      htmlFor={item.id}
      className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[var(--color-paper)] p-4 shadow-[0_1px_0_0_rgba(28,36,51,0.04)] transition-shadow hover:shadow-[0_8px_22px_-16px_rgba(28,36,51,0.18)]"
    >
      <Checkbox
        id={item.id}
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        className="mt-0.5"
      />
      <span className="flex flex-col gap-1">
        <span className="font-medium leading-snug text-[var(--color-ink)]">{item.prompt}</span>
        {item.helper ? (
          <span className="text-sm leading-relaxed text-[var(--color-ink-soft)]">
            {item.helper}
          </span>
        ) : null}
      </span>
    </label>
  );
}
