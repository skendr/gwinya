import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { SymptomLog } from "@gwinya/shared/domain/types";
import { isoDay } from "@gwinya/shared/format/dates";
import { useSession } from "@/lib/auth";
import { appendLog, recordCheckIn } from "@/lib/data";
import { CheckRow } from "@/components/check-row";
import {
  Body,
  Card,
  Eyebrow,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/theme";

export default function After() {
  const { session } = useSession();
  const [coughing, setCoughing] = useState(false);
  const [wetVoice, setWetVoice] = useState(false);
  const [tired, setTired] = useState(false);
  const [usedStrategy, setUsedStrategy] = useState(false);
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [saving, setSaving] = useState(false);
  const [savedStreak, setSavedStreak] = useState<number | null>(null);

  async function save() {
    if (!session) return;
    setSaving(true);
    const log: SymptomLog = {
      date: isoDay(),
      coughing,
      wetVoice,
      fatigue: tired ? 2 : 0,
      confidence,
      usedStrategy,
    };
    try {
      await appendLog(session.user.id, log);
      const streak = await recordCheckIn(session.user.id);
      setSavedStreak(streak.count);
    } finally {
      setSaving(false);
    }
  }

  if (savedStreak !== null) {
    return (
      <Screen>
        <View style={{ gap: spacing.sm }}>
          <Eyebrow>After I ate</Eyebrow>
          <Title>Logged. Thank you.</Title>
        </View>
        <Card style={{ backgroundColor: colors.honeySoft, borderColor: colors.honey }}>
          <Body style={{ color: colors.clayDeep }}>
            That's {savedStreak} {savedStreak === 1 ? "day" : "days"} of checking in.
            Small, steady notes are what reveal the patterns over time.
          </Body>
        </Card>
        <PrimaryButton label="Log another" onPress={() => setSavedStreak(null)} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>After I ate</Eyebrow>
        <Title>How did that go?</Title>
        <Subtitle>Just a quick note — patterns over time are what matter.</Subtitle>
      </View>

      <Link href={{ pathname: "/companion", params: { mode: "after" } }} asChild>
        <Pressable style={styles.voiceLink}>
          <Ionicons name="mic-outline" size={18} color={colors.clay} />
          <Text style={styles.voiceLinkText}>Talk it through instead</Text>
        </Pressable>
      </Link>

      <View style={{ gap: spacing.md }}>
        <CheckRow label="I coughed during the meal" checked={coughing} onToggle={() => setCoughing((v) => !v)} />
        <CheckRow label="My voice felt wet or gurgly" checked={wetVoice} onToggle={() => setWetVoice((v) => !v)} />
        <CheckRow label="I felt tired before finishing" checked={tired} onToggle={() => setTired((v) => !v)} />
        <CheckRow label="I used at least one of my strategies" checked={usedStrategy} onToggle={() => setUsedStrategy((v) => !v)} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={styles.confLabel}>How did the meal feel?</Text>
        <View style={styles.confRow}>
          {([1, 2, 3, 4, 5] as const).map((n) => {
            const active = confidence === n;
            return (
              <Pressable
                key={n}
                accessibilityRole="button"
                onPress={() => setConfidence(n)}
                style={[styles.confDot, active && styles.confDotActive]}
              >
                <Text style={[styles.confDotText, active && styles.confDotTextActive]}>{n}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.confScale}>
          <Text style={styles.confHint}>Hard</Text>
          <Text style={styles.confHint}>Good</Text>
        </View>
      </View>

      <PrimaryButton label="Save this note" onPress={save} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  confLabel: { fontFamily: fonts.bodySemibold, fontSize: 16, color: colors.ink },
  confRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  confDot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  confDotActive: { backgroundColor: colors.clay, borderColor: colors.clay },
  confDotText: { fontFamily: fonts.bodySemibold, fontSize: 18, color: colors.inkSoft },
  confDotTextActive: { color: colors.paper },
  confScale: { flexDirection: "row", justifyContent: "space-between" },
  confHint: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  voiceLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: colors.claySoft,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  voiceLinkText: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.clayDeep },
});
