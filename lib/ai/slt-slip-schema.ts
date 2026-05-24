import { z } from "zod";

/**
 * Structured output schema for /api/plan/scan. Passed to the AI SDK's
 * `generateObject` so Claude returns a typed, validated JSON object
 * extracted from a photograph of the user's SLT slip.
 *
 * Field shapes match lib/db/schema.ts:clinicalPlan so we can persist
 * with minimal translation. Notable design choices:
 *
 *   - textureLevel / fluidLevel are nullable. A slip that prescribes a
 *     "soft diet" without an IDDSI number must yield null, not a guess.
 *   - rawPlanText is the verbatim PLAN-box transcription. It is the
 *     audit trail and the source of truth — the structured arrays
 *     below are an index of it, not a replacement.
 *   - redFlags vs warningSigns are deliberately separate. See the
 *     SLT_SLIP_SYSTEM_PROMPT for the rationale (printed-form list vs
 *     personalised SLT note).
 *   - URLs in educationalLinks are .url() validated; the prompt tells
 *     the model to drop anything that doesn't parse.
 */
export const SLTSlipResult = z.object({
  textureLevel: z
    .union([z.number().int().min(0).max(7), z.null()])
    .describe(
      "IDDSI food level (0-7) on the slip. Null when the slip does not name a specific IDDSI level.",
    ),
  fluidLevel: z
    .union([z.number().int().min(0).max(4), z.null()])
    .describe(
      "IDDSI drink level (0-4) on the slip. Null when the slip does not name a specific IDDSI level.",
    ),
  posture: z
    .string()
    .describe(
      'Printed posture line, verbatim. Often "Sit upright for all swallowing". Empty string if absent.',
    ),
  specialPrecautions: z
    .array(z.string())
    .describe(
      "Only the special-precautions checkboxes that are visibly TICKED on this slip. Verbatim wording.",
    ),
  warningSigns: z
    .array(z.string())
    .describe(
      "Printed warning-signs list, verbatim. These are the form's standard items, not personalised.",
    ),
  strategies: z
    .array(z.string())
    .describe(
      "Bullet strategies from the handwritten PLAN box. Preserve the clinician's exact wording.",
    ),
  exercises: z
    .array(z.string())
    .describe(
      "Exercises listed in the PLAN box, if present. Preserve verbatim.",
    ),
  foodsToAvoid: z
    .array(z.string())
    .describe(
      "Foods the clinician told the user to avoid. Verbatim from the slip.",
    ),
  redFlags: z
    .array(z.string())
    .describe(
      "Clinician-personalised red flags from the PLAN box — items the SLT specifically called out for THIS user. Distinct from warningSigns.",
    ),
  educationalLinks: z
    .array(
      z.object({
        label: z.string(),
        url: z.string().url(),
      }),
    )
    .describe(
      "Labelled URLs (often YouTube) from the slip. Drop entries whose URL does not parse.",
    ),
  sltName: z
    .union([z.string(), z.null()])
    .describe("SLT name from the signature/footer. Null if unreadable or absent."),
  reviewDate: z
    .union([z.string(), z.null()])
    .describe(
      'Next-review date, ISO yyyy-mm-dd. Null when uncertain. Example: "2026-09-14".',
    ),
  rawPlanText: z
    .string()
    .describe(
      "Verbatim PLAN-box transcription including line breaks. The audit trail behind every structured field.",
    ),
  confidence: z
    .enum(["low", "medium", "high"])
    .describe(
      "Overall legibility of the slip. 'low' when handwriting is unclear or the slip is partially out of frame.",
    ),
  caveats: z
    .array(z.string())
    .max(8)
    .describe(
      "Caller-actionable notes about ambiguous fields, dropped URLs, unclear checkboxes, etc.",
    ),
});

export type SLTSlipResult = z.infer<typeof SLTSlipResult>;
