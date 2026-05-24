"use client";

import { ArrowUp, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  isStreaming,
  placeholder = "Ask a gentle question…",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!disabled && value.trim()) onSubmit();
      }}
      className="sticky bottom-[5.5rem] left-0 right-0 flex items-end gap-2 rounded-3xl border border-black/5 bg-[var(--color-paper)] p-2 shadow-[0_-8px_24px_-20px_rgba(28,36,51,0.25)]"
    >
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={1}
        className="!min-h-[2.75rem] !border-0 !bg-transparent !shadow-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!disabled && value.trim()) onSubmit();
          }
        }}
      />
      <button
        type="submit"
        aria-label="Send"
        disabled={disabled || !value.trim()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-clay)] text-white shadow-[0_3px_0_0_var(--color-clay-deep)] transition disabled:opacity-40 active:translate-y-[2px] active:shadow-[0_1px_0_0_var(--color-clay-deep)]"
      >
        {isStreaming ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
        )}
      </button>
    </form>
  );
}
