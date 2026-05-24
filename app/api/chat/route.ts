import { convertToCoreMessages, streamText, type CoreMessage, type Message } from "ai";
import {
  models,
  COACH_SYSTEM_PROMPT,
  LESSON_SYSTEM_PROMPT,
  ANTHROPIC_CACHE_EPHEMERAL,
} from "@/lib/ai";

export const runtime = "edge";
export const maxDuration = 30;

type ChatMode = "coach" | "lesson";

const SYSTEM_PROMPTS: Record<ChatMode, string> = {
  coach: COACH_SYSTEM_PROMPT,
  lesson: LESSON_SYSTEM_PROMPT,
};

export async function POST(req: Request) {
  const { messages, mode = "coach", lessonContext } = (await req.json()) as {
    messages: Message[];
    mode?: ChatMode;
    lessonContext?: string;
  };

  const system = SYSTEM_PROMPTS[mode] ?? COACH_SYSTEM_PROMPT;

  /*
   * Prompt-cache strategy.
   *
   * The system prompt is large (~1.5–2k tokens), identical across every
   * request, and reused on every turn. Marking it `cache_control: ephemeral`
   * tells Anthropic to cache it server-side for ~5 minutes. After the first
   * request, subsequent turns read those tokens at ~10% of input cost and
   * with much lower TTFB.
   *
   * `lessonContext` (when present) is a per-lesson static block — caching
   * it too lets a whole class of lessons share a stable prefix.
   *
   * Per-user state (name, plan, today's symptoms) intentionally lives in
   * the *messages*, not the system prompt, so the cache stays warm.
   */
  const prefix: CoreMessage[] = [
    {
      role: "system",
      content: system,
      providerOptions: ANTHROPIC_CACHE_EPHEMERAL,
    } as CoreMessage,
  ];

  if (lessonContext) {
    prefix.push({
      role: "system",
      content: `Lesson context the user is currently reading:\n\n${lessonContext}`,
      providerOptions: ANTHROPIC_CACHE_EPHEMERAL,
    } as CoreMessage);
  }

  const result = streamText({
    model: models.default,
    messages: [...prefix, ...convertToCoreMessages(messages)],
    // No temperature override — Claude Opus 4.7 rejects explicit temperature.
    maxTokens: 700,
  });

  return result.toDataStreamResponse();
}
