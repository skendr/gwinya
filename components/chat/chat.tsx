"use client";

import { useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { detectRedFlag } from "@/lib/domain/red-flags";
import { RedFlagBanner } from "@/components/red-flag-banner";
import { ChatBubble } from "./chat-bubble";
import { ChatInput } from "./chat-input";

export function Chat({
  mode = "coach",
  lessonContext,
  starter,
}: {
  mode?: "coach" | "lesson";
  lessonContext?: string;
  starter?: string;
}) {
  const [draft, setDraft] = useState("");

  const { messages, append, status, error } = useChat({
    api: "/api/chat",
    body: { mode, lessonContext },
    initialMessages: starter
      ? [{ id: "starter", role: "assistant", content: starter }]
      : undefined,
  });

  const flag = useMemo(() => detectRedFlag(draft), [draft]);
  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-col gap-3 pb-2">
        {messages.map((m) => (
          <ChatBubble key={m.id} role={m.role === "user" ? "user" : "assistant"}>
            {m.content}
          </ChatBubble>
        ))}
        {isStreaming && messages[messages.length - 1]?.role === "user" ? (
          <ChatBubble role="assistant">
            <span className="inline-flex gap-1" aria-label="Thinking">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-muted)]" />
              <span
                className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-muted)]"
                style={{ animationDelay: "120ms" }}
              />
              <span
                className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-muted)]"
                style={{ animationDelay: "240ms" }}
              />
            </span>
          </ChatBubble>
        ) : null}
        {error ? (
          <ChatBubble role="assistant">
            Sorry — something went wrong on my end. Try again in a moment.
          </ChatBubble>
        ) : null}
      </div>

      {flag ? <RedFlagBanner flag={flag} /> : null}

      <ChatInput
        value={draft}
        onChange={setDraft}
        isStreaming={isStreaming}
        disabled={isStreaming}
        onSubmit={() => {
          append({ role: "user", content: draft });
          setDraft("");
        }}
      />
    </div>
  );
}
