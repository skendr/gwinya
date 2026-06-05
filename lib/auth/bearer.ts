import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

/**
 * Resolve the signed-in user from either a Bearer access token (the mobile app,
 * which sends no cookies) or the request cookies (web). The token is validated
 * against Supabase Auth via getUser(token), so the returned id is trustworthy.
 *
 * Used by the API routes the mobile client calls (/api/chat, /api/scan,
 * /api/plan/scan). The web cookie path is unchanged when no Bearer is present.
 */
export async function resolveUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token) {
      const supabase = createSupabaseJsClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) return data.user.id;
    }
  }
  // Fall back to the cookie-based session (web).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
