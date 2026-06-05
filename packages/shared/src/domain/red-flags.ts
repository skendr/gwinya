/**
 * Defence-in-depth red-flag detector.
 *
 * The AI route's system prompt also handles this, but doing a fast,
 * deterministic pre-check on the *client* gives us two safety properties:
 *
 *   1. We can surface an "emergency? call 999" banner immediately, before
 *      the model has even started streaming, so a person in distress sees
 *      help in <100ms.
 *   2. If the model ever drifts, we still showed the escalation message.
 *
 * This is intentionally a *coarse* filter — false positives are fine
 * (we just show a banner), false negatives are caught by the model.
 *
 * Pure and framework-agnostic so both the web chat and the mobile chat run
 * the identical check.
 */

const PATTERNS: Array<{ keyword: RegExp; severity: "emergency" | "urgent" }> = [
  { keyword: /\bchoking\b/i, severity: "emergency" },
  { keyword: /can'?t\s+breathe/i, severity: "emergency" },
  { keyword: /\bblue\s+(lips|face)\b/i, severity: "emergency" },
  { keyword: /\bgasping\b/i, severity: "emergency" },
  { keyword: /\b(stuck|lodged)\b.*\b(throat|chest)\b/i, severity: "urgent" },
  { keyword: /\bwon'?t\s+stop\s+coughing\b/i, severity: "urgent" },
  { keyword: /\bchest\s+pain\b/i, severity: "urgent" },
  { keyword: /\bfever\b.*\bcough/i, severity: "urgent" },
];

export type RedFlag = { severity: "emergency" | "urgent"; match: string };

export function detectRedFlag(text: string): RedFlag | null {
  for (const p of PATTERNS) {
    const m = text.match(p.keyword);
    if (m) return { severity: p.severity, match: m[0] };
  }
  return null;
}
