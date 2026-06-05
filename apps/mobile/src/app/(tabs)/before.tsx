import { StyleSheet, Text, View } from "react-native";
import { beforeMeal } from "@gwinya/shared/content/checklists";
import { Body, Eyebrow, Screen, Subtitle, Title } from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/theme";

export default function Before() {
  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>Before I eat</Eyebrow>
        <Title>{beforeMeal.title}</Title>
        <Subtitle>{beforeMeal.intro}</Subtitle>
      </View>

      <View style={{ gap: spacing.md }}>
        {beforeMeal.items.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.bullet} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.prompt}>{item.prompt}</Text>
              {item.helper ? <Text style={styles.helper}>{item.helper}</Text> : null}
            </View>
          </View>
        ))}
      </View>

      <Body style={{ color: colors.muted }}>
        Ticking and your personalised plan strategies arrive in the next update.
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
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
    marginTop: 2,
  },
  prompt: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.ink },
  helper: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted },
});
