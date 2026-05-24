import { generateObject, type CoreMessage } from "ai";
import { z } from "zod";
import {
  models,
  SLT_SLIP_SYSTEM_PROMPT,
  ANTHROPIC_CACHE_EPHEMERAL,
  SLTSlipResult,
} from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db/client";
import { clinicalPlan } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 30;

const RequestBody = z.object({
  imageDataUrl: z.string().startsWith("data:image/"),
});

const MAX_BASE64_BYTES = Math.floor(5 * 1024 * 1024 * 4 / 3); // ~5 MiB decoded

/**
 * Parses an SLT slip photograph into structured fields. Uploads the
 * original image to the clinical-plans bucket so /plan can render it
 * later as the audit trail. Does NOT persist to clinical_plan — the
 * caller hands the parse to /plan/review/[scanId], the user edits any
 * fields the model got wrong, and saveClinicalPlan() writes the row.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "unauthorised" }, { status: 401 });
  }

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

  // Existing prescribed level — surfaced so the review UI can show
  // "you're changing from L5 → L7" if the slip prescribes a new level.
  const [existing] = await db
    .select({
      textureLevel: clinicalPlan.textureLevel,
      fluidLevel: clinicalPlan.fluidLevel,
    })
    .from(clinicalPlan)
    .where(eq(clinicalPlan.userId, user.id))
    .limit(1);

  const messages: CoreMessage[] = [
    {
      role: "system",
      content: SLT_SLIP_SYSTEM_PROMPT,
      providerOptions: ANTHROPIC_CACHE_EPHEMERAL,
    } as CoreMessage,
    {
      role: "user",
      content: [
        { type: "image", image: Buffer.from(base64, "base64"), mimeType },
        {
          type: "text",
          text:
            "Extract the structured plan from this Eating and Drinking Recommendations slip. " +
            "Preserve every clinician word verbatim. Return only the structured object.",
        },
      ],
    },
  ];

  let result;
  try {
    result = await generateObject({
      model: models.default,
      schema: SLTSlipResult,
      messages,
    });
  } catch (err) {
    console.error("[plan-scan] model call failed", err);
    return Response.json(
      { error: "model-failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }

  const analysis = result.object;

  // Upload the original to clinical-plans so /plan can render it. We do
  // this even before save — if the user abandons review, the orphan is
  // pruned by a future cleanup job (not implemented for v1).
  const admin = createAdminClient();
  const ext = mimeType.split("/")[1]?.split("+")[0] ?? "jpg";
  const scanId = crypto.randomUUID();
  const imagePath = `${user.id}/${scanId}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("clinical-plans")
    .upload(imagePath, Buffer.from(base64, "base64"), {
      contentType: mimeType,
      upsert: false,
    });
  if (uploadError) {
    console.error("[plan-scan] storage upload failed", uploadError);
    // The parse is still valid — return it without an image path so the
    // user can still edit and save. /plan won't render the source image.
    return Response.json({
      scanId,
      imagePath: null,
      parsed: analysis,
      prescribedNow: existing ?? null,
    });
  }

  return Response.json({
    scanId,
    imagePath,
    parsed: analysis,
    prescribedNow: existing ?? null,
  });
}
