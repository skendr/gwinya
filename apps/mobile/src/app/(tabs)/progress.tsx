import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import type { SymptomLog, StreakState } from "@gwinya/shared/domain/types";
import { useSession } from "@/lib/auth";
import { getLogs, getStreak } from "@/lib/data";
import { Body, Card, Eyebrow, Screen, Subtitle, Title } from "@/components/ui";
import { colors, fonts, radius, spacing } from "@/theme";

function confColor(c: number) {
  if (c >= 4) return colors.moss;
  if (c === 3) return colors.honey;
  return colors.rose;
}

export default function Progress() {
  const { session } = useSession();
  const [streak, setStreak] = useState<StreakState>({ count: 0, lastCheckIn: null });
  const [logs, setLogs] = useState<SymptomLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (session) {
        Promise.all([getStreak(session.user.id), getLogs(session.user.id)]).then(
          ([s, l]) => {
            if (!active) return;
            setStreak(s);
            setLogs(l);
            setLoaded(true);
          },
        );
      }
      return () => {
        active = false;
      };
    }, [session]),
  );

  // logs come back newest-first; show the last 14 chronologically.
  const recent = logs.slice(0, 14).reverse();
  const coughDays = logs.filter((l) => l.coughing).length;
  const strategyDays = logs.filter((l) => l.usedStrategy).length;
  const strategyPct = logs.length ? Math.round((strategyDays / logs.length) * 100) : 0;

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>Progress</Eyebrow>
        <Title>Your patterns</Title>
        <Subtitle>Gentle trends over time — not scores, just signal.</Subtitle>
      </View>

      {loaded && logs.length === 0 ? (
        <Card>
          <Body>
            As you check in after meals, your streak, confidence trend, and the days
            you noticed coughing or a wet voice will appear here.
          </Body>
        </Card>
      ) : (
        <>
          <View style={styles.statsRow}>
            <Stat value={String(streak.count)} label={streak.count === 1 ? "day streak" : "days streak"} />
            <Stat value={String(logs.length)} label="meals logged" />
            <Stat value={`${strategyPct}%`} label="used a strategy" />
          </View>

          <Card>
            <Text style={styles.cardHeading}>Confidence, last {recent.length} {recent.length === 1 ? "meal" : "meals"}</Text>
            <View style={styles.chart}>
              {recent.map((l, i) => (
                <View key={i} style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      { height: `${(l.confidence / 5) * 100}%`, backgroundColor: confColor(l.confidence) },
                    ]}
                  />
                </View>
              ))}
            </View>
            <Body style={{ color: colors.muted, fontSize: 14 }}>
              {coughDays > 0
                ? `You noted coughing on ${coughDays} ${coughDays === 1 ? "meal" : "meals"}. A pattern is worth mentioning to your SLT.`
                : "No coughing noted yet — keep going gently."}
            </Body>
          </Card>
        </>
      )}
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: "row", gap: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 2,
    alignItems: "center",
  },
  statValue: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  statLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: "center" },
  cardHeading: { fontFamily: fonts.bodySemibold, fontSize: 15, color: colors.ink },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.xs,
    height: 96,
    paddingVertical: spacing.sm,
  },
  barTrack: { flex: 1, height: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", borderRadius: radius.sm, minHeight: 6 },
});
