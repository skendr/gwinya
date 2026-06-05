import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, TAP_TARGET } from "@/theme";

/** A tappable checklist/toggle row used by the Before and After screens. */
export function CheckRow({
  label,
  helper,
  checked,
  onToggle,
}: {
  label: string;
  helper?: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={({ pressed }) => [styles.row, checked && styles.rowChecked, pressed && styles.pressed]}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Ionicons name="checkmark" size={16} color={colors.paper} /> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.label}>{label}</Text>
        {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
    minHeight: TAP_TARGET,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  rowChecked: { borderColor: colors.moss, backgroundColor: colors.mossSoft },
  pressed: { opacity: 0.9 },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  boxChecked: { backgroundColor: colors.moss, borderColor: colors.moss },
  label: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink },
  helper: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted },
});
