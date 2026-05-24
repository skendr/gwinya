import { anthropic } from "@ai-sdk/anthropic";

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
} as const;

export const models = {
  default: anthropic(MODEL_IDS.default),
  fast: anthropic(MODEL_IDS.fast),
};
