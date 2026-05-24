import { z } from "zod";

/**
 * Structured output schema for /api/scan. We pass this to the AI SDK's
 * `generateObject` so Claude returns a typed, validated JSON object —
 * no parsing, no prompt-injection-friendly free text.
 *
 * Keep these field names + values aligned with lib/db/schema.ts's
 * foodScans table so we can persist directly without translation.
 */
export const ScanResult = z.object({
  suggestedItemName: z
    .string()
    .describe(
      "Best guess at what the food item is, in 2–5 plain-English words. " +
        "Examples: 'mashed potato with stew', 'porridge with banana', " +
        "'creamy tomato soup', 'soft pasta bake'. Use 'Unclear' when the " +
        "image is not food/drink.",
    ),
  predictedLevel: z
    .union([z.number().int().min(0).max(7), z.null()])
    .describe(
      "IDDSI level 0-7 that the image most resembles. null when the image " +
        "is not food/drink, or when the image is too ambiguous to commit to a level.",
    ),
  levelName: z
    .string()
    .describe(
      "Human-readable level name. e.g. 'Minced & Moist (Level 5)'. Use 'Unclear' if predictedLevel is null.",
    ),
  visualReasoning: z
    .string()
    .describe(
      "1-3 sentences citing the specific visual cues that led to this level. " +
        "Plain English. Refer to particle sizes, surface texture, visible liquid.",
    ),
  matchesPrescribed: z
    .enum(["matches", "more-modified", "less-modified", "unknown"])
    .describe(
      "Comparison vs the user's prescribed level. Foods AT OR BELOW the " +
        "prescribed level are within plan; foods above it are the concern. " +
        "'matches' = image level equals prescribed (within plan). " +
        "'more-modified' = image is BELOW prescribed — softer than the user " +
        "needs, fully within their plan. " +
        "'less-modified' = image is ABOVE prescribed — closer to regular " +
        "than the SLT prescribed; the case to flag. " +
        "'unknown' = no prescribed level provided, or you cannot tell.",
    ),
  caveats: z
    .array(z.string())
    .max(6)
    .describe(
      "Things this image can't tell us — moisture, cohesiveness, hidden " +
        "components, etc. Empty array if none apply.",
    ),
  redFlagIds: z
    .array(
      z.enum([
        "bones",
        "nuts-seeds",
        "skins",
        "dry-crusts",
        "long-fibres",
        "mixed-textures",
        "sticky-bread",
        "round-firm",
      ]),
    )
    .describe(
      "IDs of visible high-risk items. Only include flags you can actually " +
        "see in the image. Empty array if none.",
    ),
  suggestion: z
    .string()
    .describe(
      "ONE gentle, non-prescriptive next step. Never tells the user it's safe " +
        "to eat. Often a 'check with your SLT' or 'mash a little more' suggestion.",
    ),
  confidence: z
    .enum(["low", "medium", "high"])
    .describe(
      "How confident the model is in the predictedLevel. " +
        "'low' = ambiguous image, poor lighting, mixed textures. " +
        "'high' = clear well-lit photo with obvious texture cues.",
    ),
});

export type ScanResult = z.infer<typeof ScanResult>;
