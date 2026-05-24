import { NextRequest } from "next/server";

/**
 * TEMPORARY one-shot route: configure Supabase Auth to send via Resend SMTP.
 *
 * Posts to Supabase's Management API:
 *   PATCH https://api.supabase.com/v1/projects/{ref}/config/auth
 *
 * Requires the caller to supply a Supabase Personal Access Token (PAT) —
 * the Management API doesn't accept service-role keys for project config.
 *
 * Project ref is derived from NEXT_PUBLIC_SUPABASE_URL.
 * Resend API key comes from RESEND_API_KEY env.
 *
 * DELETE THIS FILE after the first successful run.
 */

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token || !process.env.SMTP_SETUP_TOKEN || token !== process.env.SMTP_SETUP_TOKEN) {
    return Response.json({ error: "unauthorised" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { pat?: string };
  const pat = body.pat?.trim();
  if (!pat || !pat.startsWith("sbp_")) {
    return Response.json(
      { error: "supabase PAT missing or malformed (expected sbp_…)" },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const resendKey = process.env.RESEND_API_KEY;
  if (!supabaseUrl || !resendKey) {
    return Response.json(
      {
        error: "missing env",
        have: {
          NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
          RESEND_API_KEY: !!resendKey,
        },
      },
      { status: 500 },
    );
  }

  // https://abcdefgh.supabase.co  →  abcdefgh
  const refMatch = supabaseUrl.match(/^https?:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i);
  const ref = refMatch?.[1];
  if (!ref) {
    return Response.json({ error: "couldn't parse project ref from SUPABASE_URL" }, { status: 500 });
  }

  const payload = {
    smtp_admin_email: "onboarding@resend.dev",
    smtp_host: "smtp.resend.com",
    smtp_port: 465,
    smtp_user: "resend",
    smtp_pass: resendKey,
    smtp_sender_name: "Gwinya",
    smtp_max_frequency: 60,
    external_email_enabled: true,
    mailer_autoconfirm: false,
  };

  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await res.text();
  return Response.json(
    {
      ok: res.ok,
      status: res.status,
      ref,
      // Echo a redacted version of what we sent so we can verify the fields.
      sent: { ...payload, smtp_pass: "<redacted>" },
      response: responseBody.slice(0, 2000),
    },
    { status: res.ok ? 200 : 502 },
  );
}
