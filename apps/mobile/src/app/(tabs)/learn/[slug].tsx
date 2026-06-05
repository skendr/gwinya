import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getLesson } from "@gwinya/shared/content/lessons";
import { useSession } from "@/lib/auth";
import { markLessonComplete } from "@/lib/data";
import { LessonChat } from "@/components/lesson-chat";
import { Body, Eyebrow, Screen, Title } from "@/components/ui";
import { colors, fonts, radius, spacing, TAP_TARGET } from "@/theme";

export default function LessonReader() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const lesson = slug ? getLesson(slug) : undefined;
  const { session } = useSession();
  const [done, setDone] = useState(false);

  if (!lesson) {
    return (
      <Screen>
        <Title>Lesson not found</Title>
        <Body>This lesson may have moved. Head back to Learn to pick another.</Body>
      </Screen>
    );
  }

  const paragraphs = lesson.body.split("\n\n");

  async function complete() {
    setDone(true); // optimistic
    if (session) {
      try {
        await markLessonComplete(session.user.id, lesson!.slug);
      } catch {
        setDone(false);
      }
    }
  }

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>{lesson.minutes} min read</Eyebrow>
        <Title>{lesson.title}</Title>
      </View>

      <View style={{ gap: spacing.lg }}>
        {paragraphs.map((para, i) => (
          <Body key={i}>{para}</Body>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={complete}
        disabled={done}
        style={({ pressed }) => [
          styles.doneBtn,
          done && styles.doneBtnDone,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name={done ? "checkmark-circle" : "checkmark-circle-outline"}
          size={22}
          color={done ? colors.paper : colors.moss}
        />
        <Text style={[styles.doneText, done && styles.doneTextDone]}>
          {done ? "Marked as done" : "Mark as done"}
        </Text>
      </Pressable>

      <LessonChat lessonContext={lesson.body} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: TAP_TARGET,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.moss,
    backgroundColor: colors.mossSoft,
  },
  doneBtnDone: { backgroundColor: colors.moss, borderColor: colors.moss },
  doneText: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.mossDeep },
  doneTextDone: { color: colors.paper },
  pressed: { opacity: 0.9, transform: [{ translateY: 1 }] },
});
