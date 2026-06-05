import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/env";
import {
  Body,
  Eyebrow,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Subtitle,
  Title,
} from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/theme";

type Mode = "sign-in" | "sign-up";

export default function SignIn() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setMessage(null);
  };

  async function submit() {
    reset();
    if (!email.trim() || !password) {
      setError("Enter your email and a password.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) setError(error.message);
        // On success the auth listener updates the session and the (auth)
        // layout redirects into the app — nothing more to do here.
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) setError(error.message);
        else if (!data.session) {
          setMessage("Check your email to confirm your account, then sign in.");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function sendMagicLink() {
    reset();
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: Linking.createURL("/auth-callback") },
      });
      if (error) setError(error.message);
      else setMessage("We've emailed you a link. Open it on this device to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ gap: spacing.xl }}
      >
        <View style={{ gap: spacing.sm }}>
          <Eyebrow>Gwinya</Eyebrow>
          <Title>
            {mode === "sign-in" ? "Welcome back" : "Create your account"}
          </Title>
          <Subtitle>
            Your gentle companion for safer, calmer mealtimes.
          </Subtitle>
        </View>

        {!isSupabaseConfigured && (
          <View style={styles.notice}>
            <Body style={{ color: colors.clayDeep }}>
              Supabase isn't configured. Set EXPO_PUBLIC_SUPABASE_URL and
              EXPO_PUBLIC_SUPABASE_ANON_KEY in apps/mobile/.env and restart.
            </Body>
          </View>
        )}

        <View style={{ gap: spacing.md }}>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}
        {message && <Text style={styles.message}>{message}</Text>}

        <View style={{ gap: spacing.md }}>
          <PrimaryButton
            label={mode === "sign-in" ? "Sign in" : "Create account"}
            onPress={submit}
            loading={busy}
          />
          <SecondaryButton label="Email me a link instead" onPress={sendMagicLink} disabled={busy} />
        </View>

        <Pressable
          onPress={() => {
            reset();
            setMode((m) => (m === "sign-in" ? "sign-up" : "sign-in"));
          }}
          style={{ alignSelf: "center", paddingVertical: spacing.sm }}
        >
          <Text style={styles.toggle}>
            {mode === "sign-in"
              ? "New here? Create an account"
              : "Already have an account? Sign in"}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  notice: {
    backgroundColor: colors.claySoft,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  error: { fontFamily: fonts.bodyMedium, color: colors.rose, fontSize: 15 },
  message: { fontFamily: fonts.bodyMedium, color: colors.mossDeep, fontSize: 15 },
  toggle: { fontFamily: fonts.bodySemibold, color: colors.clay, fontSize: 15 },
});
