import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthState = {
  session: Session | null;
  /** True until the persisted session has been read from the keychain. */
  loading: boolean;
};

const AuthContext = createContext<AuthState>({ session: null, loading: true });

/**
 * Loads the persisted Supabase session once on mount and subscribes to auth
 * changes (sign-in, sign-out, token refresh). Route layouts read `useSession`
 * to gate the (auth) vs (tabs) groups.
 */
export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSession(): AuthState {
  return useContext(AuthContext);
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
