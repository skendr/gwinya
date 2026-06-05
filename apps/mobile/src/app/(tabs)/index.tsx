import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link, useFocusEffect, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { lessons } from "@gwinya/shared/content/lessons";
import { useSession, signOut } from "@/lib/auth";
import { getStreak } from "@/lib/data";
import {
  Body,
  Card,
  Eyebrow,
  Screen,
  SecondaryButton,
  Subtitle,
  Title,
} from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/theme";

export default function Today() {
  const { session } = useSession();
  const [streak, setStreak] = useState(0);
  const nextLesson = lessons[0];
  const name = session?.user.email?.split("@")[0] ?? "there";

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (session) {
        getStreak(session.user.id).then((s) => {
          if (active) setStreak(s.count);
        });
      }
      return () => {
        active = false;
      };
    }, [session]),
  );

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>Today</Eyebrow>
        <Title>Hello, {name}</Title>
        <Subtitle>One small, calm step at a time. You're doing well.</Subtitle>
      </View>

      {streak > 0 ? (
        <View style={styles.streakPill}>
          <Ionicons name="flame" size={18} color={colors.clay} />
          <Text style={styles.streakText}>
            {streak} {streak === 1 ? "day" : "days"} of checking in
          </Text>
        </View>
      ) : null}

      <ActionCard
        icon="mic-outline"
        title="Meal companion"
        subtitle="Talk it through, hands-free"
        href={{ pathname: "/companion", params: { mode: "full" } }}
      />

      <Card>
        <Text style={styles.cardEyebrow}>NEXT LESSON</Text>
        <Text style={styles.cardTitle}>{nextLesson.title}</Text>
        <Body>{nextLesson.blurb}</Body>
        <Link
          href={{ pathname: "/learn/[slug]", params: { slug: nextLesson.slug } }}
          style={styles.cardLink}
        >
          Read it →
        </Link>
      </Card>

      <View style={{ flex: 1 }} />
      <SecondaryButton label="Sign out" onPress={signOut} />
    </Screen>
  );
}

function ActionCard({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  href: Href;
}) {
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
        <View style={styles.actionIcon}>
          <Ionicons name={icon} size={22} color={colors.clayDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSub}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  pressed: { opacity: 0.9, transform: [{ translateY: 1 }] },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.claySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontFamily: fonts.bodySemibold, fontSize: 17, color: colors.ink },
  actionSub: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: colors.honeySoft,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  streakText: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.clayDeep },
  cardEyebrow: {
    fontFamily: fonts.bodySemibold,
    color: colors.clay,
    fontSize: 13,
    letterSpacing: 1,
  },
  cardTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  cardLink: {
    fontFamily: fonts.bodySemibold,
    color: colors.clay,
    fontSize: 16,
    paddingTop: spacing.sm,
  },
});
