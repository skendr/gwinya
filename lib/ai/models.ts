import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

/**
 * Model selection.
 *
 * Opus 4.7 is the most capable Claude as of this scaffold — use it for the
 * coaching/Q&A experience where reasoning about a clinical-safety constraint
 * matrix actually matters.
 *
 * Haiku 4.5 is the fast/cheap sibling — use it for "rephrase this", "tag this
 * symptom", or any single-shot rewrite where Opus is overkill.
 *
 * Both are configurable via env so we can pin per environment without code
 * changes (e.g., staging on Sonnet 4.6 for cost; prod on Opus 4.7).
 */
export const MODEL_IDS = {
  default: process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7",
  fast: process.env.ANTHROPIC_MODEL_FAST ?? "claude-haiku-4-5-20251001",
  // Vision model for the food check (app/api/scan). Uses OpenAI so it runs on
  // the OpenAI key the voice companion already needs — no Anthropic key
  // required for the demo. gpt-4o is vision-capable and supports generateObject.
  vision: process.env.OPENAI_VISION_MODEL ?? "gpt-4o",
} as const;

export const models = {
  default: anthropic(MODEL_IDS.default),
  fast: anthropic(MODEL_IDS.fast),
  // structuredOutputs:false → don't use OpenAI's strict json_schema mode, which
  // rejects maxItems / numeric min-max keywords present in our ScanResult
  // schema. We validate those ranges in code anyway.
  vision: openai(MODEL_IDS.vision, { structuredOutputs: false }),
};
