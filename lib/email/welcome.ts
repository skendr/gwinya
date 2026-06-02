import { Resend } from "resend";

const FROM = process.env.RESEND_FROM ?? "Gwinya <onboarding@resend.dev>";

/**
 * Welcome email after first sign-in. Plain text, no HTML — the
 * audience reads on a small screen, plain text is fine and renders
 * predictably across clients.
 */
export async function sendWelcomeEmail({ to }: { to: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping welcome email");
    return;
  }
  const resend = new Resend(apiKey);

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Welcome to Gwinya",
      text: [
        "Hi,",
        "",
        "Welcome to Gwinya. We'll keep this short.",
        "",
        "Gwinya is a quiet companion for living with dysphagia. It doesn't",
        "replace your SLT — it helps you remember strategies, talk through",
        "meals with a calm voice companion, take photos of food when you're",
        "unsure, and notice patterns over time.",
        "",
        "Three small things to try in the first week:",
        "",
        "  1. Open the app once a day. Even a 30-second check-in builds",
        "     the habit.",
        "  2. Read one lesson — they're 2 minutes each.",
        "  3. Take a photo of a meal where you're unsure of texture.",
        "     Gwinya will compare it to your prescribed level.",
        "",
        "We're glad you're here. Slow and steady.",
        "",
        "— Gwinya",
      ].join("\n"),
    });
  } catch (err) {
    console.error("[email] welcome email failed", err);
  }
}
