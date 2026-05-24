import { convertToCoreMessages, streamText, type CoreMessage, type Message } from "ai";
import {
  models,
  COACH_SYSTEM_PROMPT,
  LESSON_SYSTEM_PROMPT,
  ANTHROPIC_CACHE_EPHEMERAL,
} from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/client";
import { clinicalPlan } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Node runtime so we can use Supabase auth cookies + Drizzle to fetch
// the user's clinical_plan for cached plan-context injection.
export const runtime = "nodejs";
export const maxDuration = 30;

type ChatMode = "coach" | "lesson";

const SYSTEM_PROMPTS: Record<ChatMode, string> = {
  coach: COACH_SYSTEM_PROMPT,
  lesson: LESSON_SYSTEM_PROMPT,
};

/**
 * Render the user's plan as a stable text block so it can sit in a
 * cached system message. We deliberately keep wording predictable —
 * any string in the plan changes the cache key, which is fine; the
 * cache then warms again on the user's next turn.
 */
function renderPlanContext(plan: NonNullable<Awaited<ReturnType<typeof loadPlan>>>): string {
  const lines: string[] = ["This user has uploaded a Speech and Language Therapy plan."];
  if (plan.textureLevel != null) {
    lines.push(
      `Prescribed food (IDDSI texture): Level ${plan.textureLevel}. ` +
        `Per the IDDSI clinical principle, FOODS AT OR BELOW Level ${plan.textureLevel} ` +
        `are all within this user's plan. Foods ABOVE Level ${plan.textureLevel} ` +
        `(closer to regular) are the case to flag.`,
    );
  }
  if (plan.fluidLevel != null) {
    lines.push(
      `Prescribed drinks (IDDSI fluid): Level ${plan.fluidLevel}. ` +
        `For DRINKS the relationship inverts: drinks AT OR THICKER than ` +
        `Level ${plan.fluidLevel} are within plan; thinner drinks are the concern.`,
    );
  }
  if (plan.posture) lines.push(`Posture: ${plan.posture}.`);
  if (plan.strategies?.length) {
    lines.push(`Strategies the SLT prescribed:\n- ${plan.strategies.join("\n- ")}`);
  }
  if (plan.foodsToAvoid?.length) {
    lines.push(`Foods to avoid:\n- ${plan.foodsToAvoid.join("\n- ")}`);
  }
  if (plan.redFlags?.length) {
    lines.push(`Personalised red flags from this SLT (treat as urgent):\n- ${plan.redFlags.join("\n- ")}`);
  }
  if (plan.exercises?.length) {
    lines.push(`Exercises:\n- ${plan.exercises.join("\n- ")}`);
  }
  if (plan.warningSigns?.length) {
    lines.push(`Standard warning signs printed on the slip:\n- ${plan.warningSigns.join("\n- ")}`);
  }
  lines.push(
    "Defer to this plan. If the user's question conflicts with their plan, " +
      "say so plainly and suggest they raise it with their SLT before changing anything.",
  );
  return lines.join("\n\n");
}

async function loadPlan() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [row] = await db
    .select()
    .from(clinicalPlan)
    .where(eq(clinicalPlan.userId, user.id))
    .limit(1);
  if (!row) return null;
  // Only useful if there's something to ground on — return null when the
  // row exists but has no prescribed level + no strategies + no red flags.
  const hasContent =
    row.textureLevel != null ||
    row.fluidLevel != null ||
    (row.strategies?.length ?? 0) > 0 ||
    (row.foodsToAvoid?.length ?? 0) > 0 ||
    (row.redFlags?.length ?? 0) > 0;
  return hasContent ? row : null;
}

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
   * The plan-context block (Block C) is a per-user static block — stable
   * across a turn-by-turn conversation but unique per user. Caching it
   * ephemerally means a user's second turn in the same window reads the
   * plan from cache. We put it AFTER the lesson context so changing
   * lessons doesn't invalidate plan caching.
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

  const plan = await loadPlan();
  if (plan) {
    prefix.push({
      role: "system",
      content: renderPlanContext(plan),
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
