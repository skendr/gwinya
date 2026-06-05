import { StyleSheet, Text, View } from "react-native";
import { afterMeal } from "@gwinya/shared/content/checklists";
import { Body, Eyebrow, Screen, Subtitle, Title } from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/theme";

export default function After() {
  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>After I ate</Eyebrow>
        <Title>{afterMeal.title}</Title>
        <Subtitle>{afterMeal.intro}</Subtitle>
      </View>

      <View style={{ gap: spacing.md }}>
        {afterMeal.items.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.bullet} />
            <Text style={styles.prompt}>{item.prompt}</Text>
          </View>
        ))}
      </View>

      <Body style={{ color: colors.muted }}>
        Logging your meal and tracking your streak arrive in the next update.
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  bullet: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  prompt: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink, flex: 1 },
});
