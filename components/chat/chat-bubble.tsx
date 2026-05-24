import { cn } from "@/lib/utils";

export function ChatBubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-[0.95rem] leading-relaxed",
          isUser
            ? "rounded-br-md bg-[var(--color-clay)] text-white shadow-[0_2px_0_0_var(--color-clay-deep)]"
            : "rounded-bl-md bg-[var(--color-paper)] text-[var(--color-ink)] shadow-[0_1px_0_0_rgba(28,36,51,0.06)]"
        )}
      >
        {children}
      </div>
    </div>
  );
}
