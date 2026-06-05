import { StyleSheet, Text, View } from "react-native";
import type { RedFlag } from "@gwinya/shared/domain/red-flags";
import { colors, fonts, radius, spacing } from "@/theme";

/**
 * Emergency / urgent banner driven by the shared deterministic detector
 * (@gwinya/shared/domain/red-flags) — the same coarse client-side check the
 * web chat runs, so a person in distress sees escalation guidance instantly.
 */
export function RedFlagBanner({ flag }: { flag: RedFlag }) {
  const emergency = flag.severity === "emergency";
  return (
    <View style={styles.banner}>
      <Text style={styles.title}>
        {emergency ? "This sounds like an emergency" : "This needs attention now"}
      </Text>
      <Text style={styles.body}>
        {emergency
          ? "If someone can't breathe, cough, or speak, call 999 (or your local emergency number) right away."
          : "If this is happening now, don't wait it out — tell your clinician, or call 999 if breathing is affected."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.roseSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.rose,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.rose },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.ink },
});
