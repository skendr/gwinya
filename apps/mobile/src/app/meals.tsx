import { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { planVerdict, type MatchesPrescribed } from "@gwinya/shared/content/iddsi";
import { relativeDay } from "@gwinya/shared/format/dates";
import { useSession } from "@/lib/auth";
import { getSavedMeals, signMealThumbs, deleteMeal, type SavedMeal } from "@/lib/data";
import { Body, Card, Eyebrow, Screen, Subtitle, Title } from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/theme";

const BADGE = {
  within: { label: "within plan", bg: colors.mossSoft, fg: colors.mossDeep },
  outside: { label: "outside plan", bg: colors.roseSoft, fg: colors.rose },
  unknown: { label: "no plan", bg: colors.linen2, fg: colors.muted },
} as const;

export default function Meals() {
  const { session } = useSession();
  const [meals, setMeals] = useState<SavedMeal[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string | null>>({});
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    const rows = await getSavedMeals(session.user.id);
    setMeals(rows);
    setThumbs(await signMealThumbs(rows.map((m) => m.imagePath)));
    setLoaded(true);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (session) {
        getSavedMeals(session.user.id).then(async (rows) => {
          if (!active) return;
          setMeals(rows);
          setThumbs(await signMealThumbs(rows.map((m) => m.imagePath)));
          setLoaded(true);
        });
      }
      return () => {
        active = false;
      };
    }, [session]),
  );

  const remove = async (m: SavedMeal) => {
    if (!session) return;
    setMeals((prev) => prev.filter((x) => x.id !== m.id));
    await deleteMeal(session.user.id, m.id);
  };

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back} hitSlop={12}>
        <Ionicons name="chevron-back" size={26} color={colors.clay} />
      </Pressable>

      <View style={{ gap: spacing.sm }}>
        <Eyebrow>Meals</Eyebrow>
        <Title>Your meals</Title>
        <Subtitle>What you've saved, most recent first.</Subtitle>
      </View>

      {loaded && meals.length === 0 ? (
        <Card>
          <Body>
            No saved meals yet. Use “Check your food” to photo a plate and save it here.
          </Body>
        </Card>
      ) : (
        <View style={{ gap: spacing.md }}>
          {meals.map((m) => (
            <MealRow key={m.id} meal={m} thumb={thumbs[m.imagePath] ?? null} onDelete={() => remove(m)} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function MealRow({
  meal,
  thumb,
  onDelete,
}: {
  meal: SavedMeal;
  thumb: string | null;
  onDelete: () => void;
}) {
  const verdict = planVerdict((meal.matchesPrescribed as MatchesPrescribed) ?? null);
  const badge = BADGE[verdict];
  const when = relativeDay((meal.eatenAt ?? meal.createdAt).slice(0, 10));
  return (
    <View style={styles.row}>
      {thumb ? (
        <Image source={{ uri: thumb }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbBlank]}>
          <Ionicons name="image-outline" size={20} color={colors.muted} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.name} numberOfLines={1}>
          {meal.mealName ?? "Meal"}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.fg }]}>{badge.label}</Text>
          </View>
          <Text style={styles.when}>{when}</Text>
        </View>
      </View>
      <Pressable onPress={onDelete} hitSlop={10} accessibilityRole="button">
        <Ionicons name="trash-outline" size={20} color={colors.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: "flex-start", padding: spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  thumb: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.linen2 },
  thumbBlank: { alignItems: "center", justifyContent: "center" },
  name: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.ink },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { fontFamily: fonts.bodySemibold, fontSize: 11, letterSpacing: 0.3 },
  when: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});
