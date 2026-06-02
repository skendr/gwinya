import { JORDAN_PROFILE } from "@/lib/content/patient-profile";
import { buildCompanionInstructions, type CompanionMode } from "@/lib/ai/companion";
import { afterMealLogTool } from "@/lib/ai/after-meal-tool";

export const runtime = "nodejs";

/**
 * Mint a short-lived OpenAI Realtime ephemeral credential for the browser.
 *
 * The browser cannot hold OPENAI_API_KEY, so we mint a per-session ephemeral
 * key here (server-side) and hand only that to the client, which then opens a
 * WebRTC peer connection directly to OpenAI. See components/meal-companion.
 *
 * The companion's behaviour (who it's talking to, tone, the meal arc) is baked
 * into the session instructions, derived from the hardcoded patient profile.
 */
const OPENAI_REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL ?? "gpt-realtime";

export async function POST(req: Request) {
  // No auth gate: the companion is driven entirely by the hardcoded profile
  // and reads no per-user data, so it works for anonymous browsing like the
  // rest of the pre-meal flow. (The food check / meal log still require login
  // because they persist per-user rows.) For production you'd rate-limit or
  // re-add an auth gate here so this OpenAI-key-minting endpoint isn't open.
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "missing-openai-key" }, { status: 500 });
  }

  // "full" runs the whole meal arc; "after" jumps straight to the after-meal
  // check (the standalone /after page). Default to the full flow when the body
  // is missing or unparseable.
  let mode: CompanionMode = "full";
  try {
    const body = (await req.json()) as { mode?: unknown };
    if (body?.mode === "after") mode = "after";
  } catch {
    /* no/invalid body — keep the full flow */
  }

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: OPENAI_REALTIME_MODEL,
          instructions: buildCompanionInstructions(JORDAN_PROFILE, mode),
          audio: {
            output: { voice: JORDAN_PROFILE.voice },
          },
          // The companion saves the after-meal check by calling this function;
          // the browser fulfils it via the saveAfterMealCheck server action.
          tools: [afterMealLogTool],
          tool_choice: "auto",
        },
      }),
    });
  } catch (err) {
    console.error("[realtime/session] mint request failed", err);
    return Response.json({ error: "mint-failed" }, { status: 502 });
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[realtime/session] OpenAI returned", res.status, detail);
    return Response.json(
      { error: "mint-rejected", status: res.status, detail: detail.slice(0, 500) },
      { status: 502 },
    );
  }

  const data = (await res.json()) as { value?: string };
  if (!data.value) {
    console.error("[realtime/session] no ephemeral value in response", data);
    return Response.json({ error: "mint-empty" }, { status: 502 });
  }

  return Response.json({ value: data.value, model: OPENAI_REALTIME_MODEL });
}
