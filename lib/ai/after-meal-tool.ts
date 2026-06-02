import { isoDay } from "@/lib/format/dates";
import type { SymptomLog } from "@/lib/domain/types";

/**
 * The OpenAI Realtime function the voice companion calls to persist the
 * after-meal check (see lib/ai/companion.ts and components/meal-companion).
 *
 * The fields mirror the `afterMeal` checklist items (lib/content/checklists.ts)
 * and map onto a SymptomLog row exactly like the tap form
 * (components/after-meal-log/after-meal-log.tsx) — so a meal checked by voice
 * and one tapped in are indistinguishable in the symptom_logs table.
 *
 * NB: this schema and the `afterMeal` item set are two sources for the same
 * five things. If you add a checklist item, add a matching field here and a
 * branch in afterMealCheckToSymptomLog, or the companion will ask about it but
 * have nowhere to save it.
 */
export const SAVE_AFTER_MEAL_TOOL_NAME = "save_after_meal_log";

export const afterMealLogTool = {
  type: "function",
  name: SAVE_AFTER_MEAL_TOOL_NAME,
  description:
    "Save the after-meal check once you have gently asked the person how the meal went. " +
    "Call this exactly once, at the end, with what they told you.",
  parameters: {
    type: "object",
    properties: {
      coughed: {
        type: "boolean",
        description: "They coughed during the meal.",
      },
      wetVoice: {
        type: "boolean",
        description: "Their voice felt wet or gurgly.",
      },
      tiredBeforeFinishing: {
        type: "boolean",
        description: "They felt tired before finishing.",
      },
      avoidedFoodOrDrink: {
        type: "boolean",
        description: "They avoided a food or drink they usually have.",
      },
      usedStrategy: {
        type: "boolean",
        description:
          "They used at least one of their strategies (small bites, slow pace, chin tuck).",
      },
      notes: {
        type: "string",
        description: "Anything else they want to remember, in their words. Optional.",
      },
    },
    required: [
      "coughed",
      "wetVoice",
      "tiredBeforeFinishing",
      "avoidedFoodOrDrink",
      "usedStrategy",
    ],
  },
} as const;

export type AfterMealCheckInput = {
  coughed?: boolean;
  wetVoice?: boolean;
  tiredBeforeFinishing?: boolean;
  avoidedFoodOrDrink?: boolean;
  usedStrategy?: boolean;
  notes?: string;
};

/**
 * Map the voice tool arguments onto a SymptomLog, identically to the tap
 * form's mapping (components/after-meal-log/after-meal-log.tsx):
 *   coughed              → coughing
 *   wetVoice             → wetVoice
 *   tiredBeforeFinishing → fatigue (0 untracked / 2 if true)
 *   avoidedFoodOrDrink   → notes (prepended line; no dedicated column)
 *   usedStrategy         → usedStrategy
 * confidence stays at the default 3 — the after-meal check doesn't ask about it.
 */
export function afterMealCheckToSymptomLog(input: AfterMealCheckInput): SymptomLog {
  const avoid = input.avoidedFoodOrDrink ? "Avoided something I usually have." : null;
  const extra = input.notes?.trim() || null;
  const notes = [avoid, extra].filter(Boolean).join("\n") || undefined;
  return {
    date: isoDay(),
    coughing: !!input.coughed,
    wetVoice: !!input.wetVoice,
    fatigue: input.tiredBeforeFinishing ? 2 : 0,
    confidence: 3,
    usedStrategy: !!input.usedStrategy,
    notes,
  };
}
