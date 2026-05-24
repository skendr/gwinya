import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth helpers for Server Components and Server Actions.
 */

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Require an authenticated user. If absent, redirects to /sign-in with the
 * current path captured as `next=` so post-login we can send them back.
 */
export async function requireUser(currentPath: string) {
  const user = await getUser();
  if (!user) {
    const search = currentPath
      ? `?next=${encodeURIComponent(currentPath)}`
      : "";
    redirect(`/sign-in${search}`);
  }
  return user;
}
