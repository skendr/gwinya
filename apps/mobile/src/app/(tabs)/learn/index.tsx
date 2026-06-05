import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { lessons } from "@gwinya/shared/content/lessons";
import type { LessonLevel } from "@gwinya/shared/domain/types";
import { Eyebrow, Screen, Subtitle, Title } from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/theme";

const LEVEL_LABEL: Record<LessonLevel, string> = {
  awareness: "Awareness",
  everyday: "Everyday",
  confidence: "Confidence",
};

const LEVEL_COLOR: Record<LessonLevel, { bg: string; fg: string }> = {
  awareness: { bg: colors.honeySoft, fg: colors.clayDeep },
  everyday: { bg: colors.mossSoft, fg: colors.mossDeep },
  confidence: { bg: colors.claySoft, fg: colors.clayDeep },
};

export default function LearnIndex() {
  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>Learn</Eyebrow>
        <Title>Short lessons</Title>
        <Subtitle>Two-minute reads, in plain language. Take them at your pace.</Subtitle>
      </View>

      <View style={{ gap: spacing.md }}>
        {lessons.map((lesson) => {
          const tone = LEVEL_COLOR[lesson.level];
          return (
            <Link
              key={lesson.slug}
              href={{ pathname: "/learn/[slug]", params: { slug: lesson.slug } }}
              asChild
            >
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <View style={styles.metaRow}>
                  <View style={[styles.chip, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.chipText, { color: tone.fg }]}>
                      {LEVEL_LABEL[lesson.level]}
                    </Text>
                  </View>
                  <Text style={styles.minutes}>{lesson.minutes} min</Text>
                </View>
                <Text style={styles.cardTitle}>{lesson.title}</Text>
                <Text style={styles.cardBlurb}>{lesson.blurb}</Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.9, transform: [{ translateY: 1 }] },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chip: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  chipText: { fontFamily: fonts.bodySemibold, fontSize: 12, letterSpacing: 0.5 },
  minutes: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
  cardTitle: { fontFamily: fonts.display, fontSize: 21, color: colors.ink },
  cardBlurb: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.inkSoft },
});
