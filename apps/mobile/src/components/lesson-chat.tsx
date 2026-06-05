import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { detectRedFlag } from "@gwinya/shared/domain/red-flags";
import { useLessonChat, type ChatMessage } from "@/lib/use-lesson-chat";
import { RedFlagBanner } from "./red-flag-banner";
import { colors, fonts, radius, spacing, TAP_TARGET } from "@/theme";

/**
 * Inline "ask about this lesson" chat. Streams from the web /api/chat route
 * (lesson mode) and runs the shared red-flag detector on what the user types,
 * showing an escalation banner before anything is even sent.
 */
export function LessonChat({ lessonContext }: { lessonContext: string }) {
  const { messages, streaming, error, send } = useLessonChat(lessonContext);
  const [input, setInput] = useState("");
  const flag = useMemo(() => detectRedFlag(input), [input]);

  const onSend = () => {
    const text = input;
    setInput("");
    send(text);
  };

  const disabled = streaming || input.trim().length === 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Ask about this lesson</Text>

      {flag && <RedFlagBanner flag={flag} />}

      {messages.map((m) => (
        <Bubble key={m.id} message={m} streaming={streaming} />
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a question…"
          placeholderTextColor={colors.muted}
          value={input}
          onChangeText={setInput}
          multiline
          editable={!streaming}
        />
        <Pressable
          accessibilityRole="button"
          onPress={onSend}
          disabled={disabled}
          style={({ pressed }) => [
            styles.sendBtn,
            disabled && styles.sendDisabled,
            pressed && styles.pressed,
          ]}
        >
          {streaming ? (
            <ActivityIndicator color={colors.paper} />
          ) : (
            <Text style={styles.sendText}>Send</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function Bubble({ message, streaming }: { message: ChatMessage; streaming: boolean }) {
  const isUser = message.role === "user";
  const text = message.content || (streaming ? "…" : "");
  return (
    <View style={[styles.bubble, isUser ? styles.user : styles.assistant]}>
      <Text style={[styles.bubbleText, isUser && styles.userText]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xl,
  },
  heading: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  bubble: {
    maxWidth: "88%",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  user: { alignSelf: "flex-end", backgroundColor: colors.clay },
  assistant: {
    alignSelf: "flex-start",
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.ink },
  userText: { color: colors.paper },
  error: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.rose },
  inputRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" },
  input: {
    flex: 1,
    minHeight: TAP_TARGET,
    maxHeight: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
  sendBtn: {
    minHeight: TAP_TARGET,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.clay,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.paper },
  pressed: { opacity: 0.85, transform: [{ translateY: 1 }] },
});
