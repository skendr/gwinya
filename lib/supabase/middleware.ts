import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware helper. Called on every request to refresh the Supabase auth
 * cookie before any Server Component or Route Handler runs. Without this
 * pages can read a stale session.
 *
 * The actual middleware.ts file just calls this and returns the response.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the access token if it's about to expire. Read at least one
  // user attribute so the session-touch happens.
  await supabase.auth.getUser();

  return response;
}
