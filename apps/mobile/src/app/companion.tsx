import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useMealCompanion,
  type CheckResult,
  type CompanionMode,
  type Line,
} from "@/lib/use-meal-companion";
import {
  Body,
  Card,
  Eyebrow,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Subtitle,
  Title,
} from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/theme";

const COPY = {
  full: {
    idleTitle: "Talk it through together",
    idleBody:
      "Tap to start. Gwinya will talk with you, one calm step at a time — and check in after the meal. You can just speak back.",
    startLabel: "Start meal companion",
    endLabel: "End companion",
    endedTitle: "Nice work. Enjoy the rest of your day.",
    endedBody: "Small bites, slow and steady.",
  },
  after: {
    idleTitle: "Let's see how that went",
    idleBody:
      "Tap to start. Gwinya will ask a few gentle questions about your meal, then note it for you. You can just speak back.",
    startLabel: "Start after-meal check",
    endLabel: "Done",
    endedTitle: "All noted. Well done.",
    endedBody: "Patterns over time are what matter.",
  },
} as const;

export default function Companion() {
  const params = useLocalSearchParams<{ mode?: CompanionMode }>();
  const mode: CompanionMode = params.mode === "after" ? "after" : "full";
  const copy = COPY[mode];
  const c = useMealCompanion(mode);

  const close = () => {
    if (c.phase === "live") c.stop();
    router.back();
  };

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={close} style={styles.close} hitSlop={12}>
        <Ionicons name="close" size={26} color={colors.muted} />
      </Pressable>

      {(c.phase === "idle" || c.phase === "error") && (
        <View style={styles.center}>
          <View style={styles.mic}>
            <Ionicons name="mic-outline" size={30} color={colors.clayDeep} />
          </View>
          <Title>{copy.idleTitle}</Title>
          <Subtitle>{copy.idleBody}</Subtitle>
          {c.phase === "error" && c.error ? <Text style={styles.error}>{c.error}</Text> : null}
          <PrimaryButton label={copy.startLabel} onPress={c.start} />
        </View>
      )}

      {c.phase === "connecting" && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.clay} size="large" />
          <Body>Waking your companion…</Body>
        </View>
      )}

      {c.phase === "live" && (
        <View style={{ gap: spacing.lg, flex: 1 }}>
          <Card>
            <View style={styles.liveRow}>
              <View style={styles.dot} />
              <Text style={styles.liveLabel}>Listening — just talk</Text>
            </View>
            <Transcript lines={c.lines} partial={c.partial} />
          </Card>
          {c.check ? <CheckCard check={c.check} /> : null}
          <View style={{ flex: 1 }} />
          <SecondaryButton label={copy.endLabel} onPress={c.stop} />
        </View>
      )}

      {c.phase === "ended" && (
        <View style={{ gap: spacing.lg }}>
          {c.lines.length > 0 && (
            <Card>
              <Eyebrow>What Gwinya said</Eyebrow>
              <Transcript lines={c.lines} partial="" />
            </Card>
          )}
          {c.check ? <CheckCard check={c.check} /> : null}
          <Card style={{ backgroundColor: colors.mossSoft, borderColor: colors.moss }}>
            <Text style={[styles.liveLabel, { color: colors.mossDeep }]}>{copy.endedTitle}</Text>
            <Body style={{ color: colors.mossDeep }}>{copy.endedBody}</Body>
          </Card>
          <PrimaryButton label="Again" onPress={c.start} />
          {c.check ? (
            <SecondaryButton
              label="See your patterns"
              onPress={() => {
                router.back();
                router.push("/(tabs)/progress");
              }}
            />
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function Transcript({ lines, partial }: { lines: Line[]; partial: string }) {
  if (lines.length === 0 && !partial) {
    return <Text style={styles.placeholder}>Gwinya will speak first…</Text>;
  }
  return (
    <View style={{ gap: spacing.sm }}>
      {lines.map((l) => (
        <Text key={l.id} style={styles.line}>
          {l.text}
        </Text>
      ))}
      {partial ? <Text style={[styles.line, { color: colors.inkSoft }]}>{partial}</Text> : null}
    </View>
  );
}

function CheckCard({ check }: { check: CheckResult }) {
  const saving = check.status === "saving";
  return (
    <Card>
      <View style={styles.liveRow}>
        {saving ? (
          <ActivityIndicator color={colors.clay} />
        ) : (
          <Ionicons name="checkmark-circle" size={20} color={colors.moss} />
        )}
        <Text style={styles.liveLabel}>
          {saving ? "Noting your check…" : "After-meal check noted"}
        </Text>
      </View>
      {check.yeses.length > 0 ? (
        <View style={{ gap: 2, paddingLeft: spacing.lg }}>
          {check.yeses.map((y) => (
            <Text key={y} style={styles.line}>
              • {y}
            </Text>
          ))}
        </View>
      ) : (
        <Body style={{ color: colors.inkSoft }}>A smooth meal — nothing to flag.</Body>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  close: { alignSelf: "flex-end", padding: spacing.xs },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg, paddingHorizontal: spacing.lg, textAlign: "center" },
  mic: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.claySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  error: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.rose, textAlign: "center" },
  liveRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.mossDeep },
  liveLabel: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink },
  placeholder: { fontFamily: fonts.body, fontSize: 15, fontStyle: "italic", color: colors.muted },
  line: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.ink },
});
