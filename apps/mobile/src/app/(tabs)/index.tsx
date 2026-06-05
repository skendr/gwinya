import { View } from "react-native";
import { Link } from "expo-router";
import { lessons } from "@gwinya/shared/content/lessons";
import { useSession, signOut } from "@/lib/auth";
import {
  Body,
  Card,
  Eyebrow,
  Screen,
  SecondaryButton,
  Subtitle,
  Title,
} from "@/components/ui";
import { colors, fonts, spacing } from "@/theme";
import { Text } from "react-native";

export default function Today() {
  const { session } = useSession();
  const nextLesson = lessons[0];
  const name = session?.user.email?.split("@")[0] ?? "there";

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>Today</Eyebrow>
        <Title>Hello, {name}</Title>
        <Subtitle>One small, calm step at a time. You're doing well.</Subtitle>
      </View>

      <Card>
        <Text style={{ fontFamily: fonts.bodySemibold, color: colors.clay, fontSize: 13, letterSpacing: 1 }}>
          NEXT LESSON
        </Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>
          {nextLesson.title}
        </Text>
        <Body>{nextLesson.blurb}</Body>
        <Link
          href={{ pathname: "/learn/[slug]", params: { slug: nextLesson.slug } }}
          style={{ fontFamily: fonts.bodySemibold, color: colors.clay, fontSize: 16, paddingTop: spacing.sm }}
        >
          Read it →
        </Link>
      </Card>

      <View style={{ flex: 1 }} />
      <SecondaryButton label="Sign out" onPress={signOut} />
    </Screen>
  );
}
