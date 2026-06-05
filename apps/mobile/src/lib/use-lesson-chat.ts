import { useCallback, useRef, useState } from "react";
import { fetch as expoFetch } from "expo/fetch";
import { API_BASE_URL, isApiConfigured } from "./env";
import { supabase } from "./supabase";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

/**
 * Lesson chat against the web app's `/api/chat` route (mode: "lesson").
 *
 * That route returns the Vercel AI SDK data-stream protocol. React Native's
 * built-in fetch can't stream a response body, so we use `expo/fetch` and
 * parse the stream by hand: each line is `<typeId>:<json>` and text deltas use
 * type `0` (`0:"chunk"`). Lesson mode only streams text (no tool calls), so
 * handling type 0 is sufficient and avoids depending on the AI SDK in RN.
 *
 * We forward the Supabase access token as a Bearer header so the route can
 * (optionally, see Phase 5) ground replies in the user's plan; today the route
 * reads cookies, so without that change the chat simply streams without plan
 * context — which is fine.
 */
export function useLessonChat(lessonContext: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(0);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;
      if (!isApiConfigured) {
        setError("Chat needs EXPO_PUBLIC_API_BASE_URL set in apps/mobile/.env.");
        return;
      }
      setError(null);

      const userMsg: ChatMessage = {
        id: `u${idRef.current++}`,
        role: "user",
        content: trimmed,
      };
      const assistantId = `a${idRef.current++}`;
      const history = [...messages, userMsg];
      setMessages([...history, { id: assistantId, role: "assistant", content: "" }]);
      setStreaming(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const res = await expoFetch(`${API_BASE_URL}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({
            mode: "lesson",
            lessonContext,
            messages: history.map((m) => ({ id: m.id, role: m.role, content: m.content })),
          }),
        });

        if (!res.ok || !res.body) throw new Error(`Chat failed (${res.status}).`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const delta = parseTextDelta(line);
            if (delta) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + delta } : m,
                ),
              );
            }
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
        // Drop the empty assistant placeholder on failure.
        setMessages((prev) => prev.filter((m) => !(m.id === assistantId && m.content === "")));
      } finally {
        setStreaming(false);
      }
    },
    [messages, streaming, lessonContext],
  );

  return { messages, streaming, error, send };
}

/** Parse one data-stream line; returns the text delta for `0:"…"` lines. */
function parseTextDelta(line: string): string | null {
  if (!line.startsWith("0:")) return null;
  try {
    const parsed = JSON.parse(line.slice(2));
    return typeof parsed === "string" ? parsed : null;
  } catch {
    return null;
  }
}
