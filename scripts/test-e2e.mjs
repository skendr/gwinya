#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * End-to-end smoke test for production.
 *
 * Coverage:
 *   1. signInWithOtp via anon client — should accept ANY email after the
 *      revert to Supabase's default SMTP.
 *   2. Admin-create a test user via service-role and mint a session token.
 *   3. Call /api/scan with that session, a synthetic JPEG, and assert the
 *      IDDSI structured response shape.
 *   4. Clean up the test user.
 *
 * Run:
 *   node scripts/test-e2e.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gwinya.vercel.app";
const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_BASE || !ANON_KEY || !SERVICE_ROLE) {
  console.error("Missing Supabase env. Have:", {
    url: !!URL_BASE,
    anon: !!ANON_KEY,
    service: !!SERVICE_ROLE,
  });
  process.exit(1);
}

const anonClient = createClient(URL_BASE, ANON_KEY);
const adminClient = createClient(URL_BASE, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let exitCode = 0;
const log = (...a) => console.log(`[e2e] ${a.join(" ")}`);
const fail = (msg) => {
  console.error(`[e2e] ❌ ${msg}`);
  exitCode = 1;
};
const pass = (msg) => console.log(`[e2e] ✅ ${msg}`);

// ────────────────────────────────────────────────────────────────────────
// 1. Magic-link to an arbitrary email
// ────────────────────────────────────────────────────────────────────────
async function testMagicLinkAnyEmail() {
  log("== test 1: signInWithOtp to arbitrary email ==");
  // example.com is RFC-2606 reserved for documentation, so syntactically
  // valid but never actually delivers. Supabase accepts it.
  const email = `e2e-test+${Date.now()}@example.com`;
  const { error } = await anonClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${SITE_URL}/auth/callback`,
      shouldCreateUser: true,
    },
  });
  if (error) {
    fail(`signInWithOtp returned error: ${error.message}`);
    return;
  }
  pass(`signInWithOtp accepted for ${email}`);

  // Clean up the auth.users row that signInWithOtp may have created.
  const { data: list } = await adminClient.auth.admin.listUsers({ perPage: 200 });
  const created = list.users.find((u) => u.email === email);
  if (created) {
    await adminClient.auth.admin.deleteUser(created.id);
    log(`   cleaned up ${created.id.slice(0, 8)}…`);
  }
}

// ────────────────────────────────────────────────────────────────────────
// 2. Admin-create a user + mint a session token for /api/scan auth
// ────────────────────────────────────────────────────────────────────────
async function ensureTestUser() {
  const email = `e2e-scan+${Date.now()}@gwinya.test`;
  const password = `pw-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return { user: data.user, email, password };
}

async function getAccessTokenFor({ email, password }) {
  const { data, error } = await anonClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

// ────────────────────────────────────────────────────────────────────────
// 3. Call /api/scan with a synthetic image
// ────────────────────────────────────────────────────────────────────────
async function testScanRoute(session) {
  log("== test 2: /api/scan with a synthetic 200×200 JPEG as authed user ==");
  // Build a small but legibly-sized JPEG via sharp. The colour is
  // deliberately food-like (warm brown) so the model has something to
  // describe; we just need a non-trivial image, not a real meal photo.
  const { default: sharp } = await import("sharp");
  const buf = await sharp({
    create: { width: 200, height: 200, channels: 3, background: { r: 168, g: 124, b: 74 } },
  })
    .jpeg({ quality: 80 })
    .toBuffer();
  const tinyJpegBase64 = buf.toString("base64");
  log(`   synthetic JPEG: ${buf.length} bytes, ${tinyJpegBase64.length} base64 chars`);

  const cookieJar = `sb-${URL_BASE.match(/^https?:\/\/([a-z0-9]+)\./)[1]}-auth-token=${encodeURIComponent(
    JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      token_type: "bearer",
      user: session.user,
    }),
  )}`;

  const res = await fetch(`${SITE_URL}/api/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      Cookie: cookieJar,
    },
    body: JSON.stringify({
      imageDataUrl: `data:image/jpeg;base64,${tinyJpegBase64}`,
      userNote: "e2e smoke test — 1x1 white pixel",
    }),
  });

  log(`   status: ${res.status}`);
  const body = await res.text();
  try {
    const json = JSON.parse(body);
    if (res.status === 200 && json.analysis) {
      pass("scan route returned structured analysis");
      log(`   analysis.predictedLevel = ${json.analysis.predictedLevel}`);
      log(`   analysis.confidence = ${json.analysis.confidence}`);
      log(`   analysis.levelName = ${json.analysis.levelName}`);
    } else {
      fail(`scan route returned non-200 or no analysis: ${body.slice(0, 300)}`);
    }
  } catch {
    fail(`scan route returned non-JSON: ${body.slice(0, 300)}`);
  }
}

// ────────────────────────────────────────────────────────────────────────
// 4. /api/chat — streaming Anthropic response with cached system prompt
// ────────────────────────────────────────────────────────────────────────
async function testChatRoute() {
  log("== test 3: /api/chat streaming (anonymous OK) ==");
  const res = await fetch(`${SITE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { id: "1", role: "user", content: "In one sentence, what is dysphagia?" },
      ],
      mode: "coach",
    }),
  });
  if (res.status !== 200) {
    fail(`/api/chat returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return;
  }
  // Read the AI-SDK data-stream and capture text chunks.
  const reader = res.body.getReader();
  let buf = "";
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    if (buf.length > 600) break; // we just want the first sentence
  }
  // AI SDK streams in `0:"..."` lines for text deltas.
  const text = [...buf.matchAll(/0:"((?:\\.|[^"\\])*)"/g)]
    .map((m) => m[1].replace(/\\n/g, " ").replace(/\\"/g, '"'))
    .join("");
  if (text.length > 10) {
    pass(`/api/chat streamed: "${text.slice(0, 110).trim()}…"`);
  } else {
    fail(`/api/chat streamed nothing parseable; raw=${buf.slice(0, 200)}`);
  }
}

// ────────────────────────────────────────────────────────────────────────
// 5. Red-flag detector unit smoke (defence-in-depth client logic)
// ────────────────────────────────────────────────────────────────────────
async function testRedFlagDetector() {
  log("== test 4: client-side red-flag detector ==");
  const { detectRedFlag } = await import("../lib/domain/red-flags.js")
    .catch(async () => await import("../lib/domain/red-flags.ts"))
    .catch(() => null);
  if (!detectRedFlag) {
    log("   skipping — couldn't import the TS source from a JS test");
    return;
  }
  const emergency = detectRedFlag("I'm choking right now");
  const ok = detectRedFlag("Lovely lunch today");
  if (emergency?.severity === "emergency" && ok === null) {
    pass("red-flag detector correctly emergency/null");
  } else {
    fail(`red-flag detector unexpected: emergency=${JSON.stringify(emergency)} ok=${ok}`);
  }
}

// ────────────────────────────────────────────────────────────────────────
// run
// ────────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await testMagicLinkAnyEmail();

    log("== test 2a: admin create user ==");
    const { user, email, password } = await ensureTestUser();
    pass(`created test user ${email}`);
    log(`   user id: ${user.id}`);

    log("== test 2b: sign in with password to get session ==");
    const session = await getAccessTokenFor({ email, password });
    pass("got session access_token");

    await testScanRoute(session);
    await testChatRoute();

    log("== cleanup ==");
    await adminClient.auth.admin.deleteUser(user.id);
    pass("deleted test user");
  } catch (err) {
    console.error("[e2e] unhandled:", err);
    exitCode = 1;
  }
  process.exit(exitCode);
})();
