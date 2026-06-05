import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts, radius, spacing, TAP_TARGET } from "@/theme";

/** Full-screen linen background with safe-area insets + optional scroll. */
export function Screen({
  children,
  scroll = true,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const inner = (
    <View style={[styles.screenInner, style]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Body({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.primaryBtn,
        pressed && styles.pressed,
        off && styles.btnDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.paper} />
      ) : (
        <Text style={styles.primaryBtnText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.secondaryBtn,
        pressed && styles.pressed,
        disabled && styles.btnDisabled,
      ]}
    >
      <Text style={styles.secondaryBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.linen },
  scrollContent: { flexGrow: 1 },
  screenInner: { padding: spacing.xl, gap: spacing.lg, flex: 1 },
  eyebrow: {
    fontFamily: fonts.bodySemibold,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.clay,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.inkSoft,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 25,
    color: colors.inkSoft,
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.md,
  },
  primaryBtn: {
    minHeight: TAP_TARGET,
    borderRadius: radius.pill,
    backgroundColor: colors.clay,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  primaryBtnText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 17,
    color: colors.paper,
  },
  secondaryBtn: {
    minHeight: TAP_TARGET,
    borderRadius: radius.pill,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  secondaryBtnText: {
    fontFamily: fonts.bodySemibold,
    fontSize: 16,
    color: colors.ink,
  },
  pressed: { opacity: 0.85, transform: [{ translateY: 1 }] },
  btnDisabled: { opacity: 0.5 },
});
