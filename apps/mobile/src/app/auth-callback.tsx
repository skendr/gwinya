import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Body, Screen } from "@/components/ui";
import { colors, spacing } from "@/theme";

/**
 * Deep-link target for the Supabase magic link (gwinya://auth-callback?code=…).
 * Exchanges the PKCE code for a session, mirroring the web auth callback at
 * app/auth/callback/route.ts. Once done, the auth listener has a session and
 * we redirect into the app.
 */
export default function AuthCallback() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
      if (active) setDone(true);
    })();
    return () => {
      active = false;
    };
  }, [code]);

  if (done) return <Redirect href="/" />;

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg }}>
        <ActivityIndicator color={colors.clay} />
        <Body>Signing you in…</Body>
      </View>
    </Screen>
  );
}
