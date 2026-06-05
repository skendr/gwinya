import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getLesson } from "@gwinya/shared/content/lessons";
import { Body, Eyebrow, Screen, Title } from "@/components/ui";
import { spacing } from "@/theme";

export default function LessonReader() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const lesson = slug ? getLesson(slug) : undefined;

  if (!lesson) {
    return (
      <Screen>
        <Title>Lesson not found</Title>
        <Body>This lesson may have moved. Head back to Learn to pick another.</Body>
      </Screen>
    );
  }

  // Body is plain text with \n\n between paragraphs (incl. bullet blocks).
  const paragraphs = lesson.body.split("\n\n");

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
    </Screen>
  );
}
