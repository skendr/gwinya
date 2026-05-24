import { generateObject, type CoreMessage } from "ai";
import { z } from "zod";
import {
  models,
  IDDSI_SCAN_SYSTEM_PROMPT,
  ANTHROPIC_CACHE_EPHEMERAL,
  ScanResult,
} from "@/lib/ai";
import { MODEL_IDS } from "@/lib/ai/models";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db/client";
import { clinicalPlan, foodScans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 30;

const RequestBody = z.object({
  /** Data URL: `data:image/jpeg;base64,…`. The client must downscale before
   *  sending — we cap the server-side decoded length at 5 MiB. */
  imageDataUrl: z.string().startsWith("data:image/"),
  /** Optional free-text the user typed alongside the photo. */
  userNote: z.string().max(500).optional(),
});

const MAX_BASE64_BYTES = Math.floor(5 * 1024 * 1024 * 4 / 3); // ~5 MiB decoded

export async function POST(req: Request) {
  /* Auth ---------------------------------------------------------------- */
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "unauthorised" }, { status: 401 });
  }

  /* Parse + validate ---------------------------------------------------- */
  let parsed: z.infer<typeof RequestBody>;
  try {
    parsed = RequestBody.parse(await req.json());
  } catch (err) {
    return Response.json(
      { error: "bad-request", detail: err instanceof Error ? err.message : "invalid body" },
      { status: 400 },
    );
  }
  if (parsed.imageDataUrl.length > MAX_BASE64_BYTES) {
    return Response.json(
      { error: "image-too-large", limitBytes: MAX_BASE64_BYTES },
      { status: 413 },
    );
  }

  const match = parsed.imageDataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/);
  if (!match) {
    return Response.json({ error: "bad-image" }, { status: 400 });
  }
  const [, mimeType, base64] = match;

  /* Prescribed level (snapshot at scan time) --------------------------- */
  const [plan] = await db
    .select({ textureLevel: clinicalPlan.textureLevel })
    .from(clinicalPlan)
    .where(eq(clinicalPlan.userId, user.id))
    .limit(1);
  const prescribed = plan?.textureLevel ?? null;

  /* Vision call --------------------------------------------------------- */
  const userTextParts = [
    prescribed != null
      ? `The user's SLT-prescribed IDDSI level is ${prescribed}.`
      : `No prescribed IDDSI level is on file for this user — set matchesPrescribed to "unknown".`,
    parsed.userNote ? `User's note: ${parsed.userNote}` : null,
    "Analyse the attached photograph using the IDDSI framework. Return the structured object only.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages: CoreMessage[] = [
    {
      role: "system",
      content: IDDSI_SCAN_SYSTEM_PROMPT,
      providerOptions: ANTHROPIC_CACHE_EPHEMERAL,
    } as CoreMessage,
    {
      role: "user",
      content: [
        { type: "image", image: Buffer.from(base64, "base64"), mimeType },
        { type: "text", text: userTextParts },
      ],
    },
  ];

  let result;
  try {
    result = await generateObject({
      model: models.default,
      schema: ScanResult,
      messages,
      // No temperature override — Claude Opus 4.7 rejects an explicit
      // temperature param. Default (1.0) is fine for structured output
      // because the Zod schema constrains the response shape.
    });
  } catch (err) {
    console.error("[scan] model call failed", err);
    return Response.json(
      { error: "model-failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }

  const analysis = result.object;

  /* Persist image + analysis ------------------------------------------- */
  const admin = createAdminClient();
  const ext = mimeType.split("/")[1]?.split("+")[0] ?? "jpg";
  const scanId = crypto.randomUUID();
  const imagePath = `${user.id}/${scanId}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("food-scans")
    .upload(imagePath, Buffer.from(base64, "base64"), {
      contentType: mimeType,
      upsert: false,
    });
  if (uploadError) {
    console.error("[scan] storage upload failed", uploadError);
    // Continue without persisting — return the analysis the user paid for.
    return Response.json({ id: null, analysis, prescribed });
  }

  await db.insert(foodScans).values({
    id: scanId,
    userId: user.id,
    imagePath,
    predictedLevel: analysis.predictedLevel ?? null,
    levelName: analysis.levelName,
    visualReasoning: analysis.visualReasoning,
    matchesPrescribed: analysis.matchesPrescribed,
    caveats: analysis.caveats,
    redFlags: analysis.redFlagIds,
    suggestion: analysis.suggestion,
    confidence: analysis.confidence,
    prescribedLevelAtScan: prescribed,
    modelId: MODEL_IDS.default,
  });

  return Response.json({ id: scanId, analysis, prescribed });
}
