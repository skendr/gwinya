import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client. Bound to the current request's cookies so
 * `auth.getUser()` returns the signed-in user.
 *
 * Use this in:
 *  - Server Components
 *  - Server Actions
 *  - Route handlers (App Router)
 *
 * For the *service-role* client (bypasses RLS — admin-only operations), see
 * lib/supabase/admin.ts.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll from a Server Component will throw — that's expected,
            // the middleware refresh handles the cookies in that case.
          }
        },
      },
    },
  );
}
