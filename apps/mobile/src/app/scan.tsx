import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { visualRedFlags, type PlanVerdict } from "@gwinya/shared/content/iddsi";
import { captureFromCamera, captureFromLibrary, type CapturedImage } from "@/lib/scan-image";
import { useFoodScan, type ScanState } from "@/lib/use-food-scan";
import { useSession } from "@/lib/auth";
import { saveMeal } from "@/lib/data";
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

const VERDICT: Record<PlanVerdict, { label: string; bg: string; fg: string }> = {
  within: { label: "Within your plan", bg: colors.mossSoft, fg: colors.mossDeep },
  outside: { label: "Outside your plan", bg: colors.roseSoft, fg: colors.rose },
  unknown: { label: "No plan to compare against", bg: colors.linen2, fg: colors.inkSoft },
};

export default function Scan() {
  const { session } = useSession();
  const { scanning, error, result, scan, reset } = useFoodScan();
  const [captured, setCaptured] = useState<CapturedImage | null>(null);
  const [note, setNote] = useState("");

  const pick = async (fn: () => Promise<CapturedImage | null>) => {
    reset();
    const img = await fn();
    if (img) setCaptured(img);
  };

  const startOver = () => {
    reset();
    setCaptured(null);
    setNote("");
  };

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.close} hitSlop={12}>
        <Ionicons name="close" size={26} color={colors.muted} />
      </Pressable>

      <View style={{ gap: spacing.sm }}>
        <Eyebrow>Food check</Eyebrow>
        <Title>Check your plate</Title>
        <Subtitle>Take a photo and Gwinya will compare it to your plan.</Subtitle>
      </View>

      {captured && (
        <Image source={{ uri: captured.localUri }} style={styles.preview} resizeMode="cover" />
      )}

      {!captured && (
        <View style={{ gap: spacing.md }}>
          <PrimaryButton label="Take a photo" onPress={() => pick(captureFromCamera)} />
          <SecondaryButton label="Choose from library" onPress={() => pick(captureFromLibrary)} />
        </View>
      )}

      {captured && !result && !scanning && (
        <View style={{ gap: spacing.md }}>
          <TextInput
            style={styles.note}
            placeholder="Add a note (optional)"
            placeholderTextColor={colors.muted}
            value={note}
            onChangeText={setNote}
            multiline
          />
          <PrimaryButton label="Check this food" onPress={() => scan(captured.dataUrl, note)} />
          <SecondaryButton label="Retake" onPress={startOver} />
        </View>
      )}

      {scanning && (
        <View style={{ alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl }}>
          <ActivityIndicator color={colors.clay} size="large" />
          <Body>Looking carefully…</Body>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result && (
        <>
          <ResultCard result={result} />
          {result.verdict === "within" && result.id && session ? (
            <SaveMealCard
              userId={session.user.id}
              scanId={result.id}
              defaultName={result.analysis.suggestedItemName}
            />
          ) : null}
          <SecondaryButton label="Check another" onPress={startOver} />
        </>
      )}
    </Screen>
  );
}

function ResultCard({ result }: { result: ScanState }) {
  const v = VERDICT[result.verdict];
  const flags = result.analysis.redFlagIds
    .map((id) => visualRedFlags.find((f) => f.id === id)?.label)
    .filter(Boolean) as string[];
  return (
    <Card>
      <View style={styles.levelRow}>
        <Text style={styles.levelName}>{result.analysis.levelName}</Text>
        <Text style={styles.confidence}>{result.analysis.confidence} confidence</Text>
      </View>
      <View style={[styles.verdict, { backgroundColor: v.bg }]}>
        <Text style={[styles.verdictText, { color: v.fg }]}>{v.label}</Text>
      </View>
      <Body>{result.analysis.visualReasoning}</Body>
      {flags.length > 0 ? (
        <View style={{ gap: 2 }}>
          {flags.map((f) => (
            <Text key={f} style={styles.flag}>
              ⚠ {f}
            </Text>
          ))}
        </View>
      ) : null}
      {result.analysis.caveats.length > 0 ? (
        <View style={{ gap: 2 }}>
          {result.analysis.caveats.map((c) => (
            <Text key={c} style={styles.caveat}>
              • {c}
            </Text>
          ))}
        </View>
      ) : null}
      <Body style={{ color: colors.inkSoft }}>{result.analysis.suggestion}</Body>
    </Card>
  );
}

function SaveMealCard({
  userId,
  scanId,
  defaultName,
}: {
  userId: string;
  scanId: string;
  defaultName: string;
}) {
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <Card style={{ backgroundColor: colors.mossSoft, borderColor: colors.moss }}>
        <Body style={{ color: colors.mossDeep }}>Saved to your meals.</Body>
      </Card>
    );
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    const ok = await saveMeal(userId, scanId, name, new Date());
    setSaving(false);
    setSaved(ok);
  }

  return (
    <Card>
      <Eyebrow>Save this meal</Eyebrow>
      <TextInput
        style={styles.note}
        value={name}
        onChangeText={setName}
        placeholder="Meal name"
        placeholderTextColor={colors.muted}
      />
      <PrimaryButton label="Save meal" onPress={save} loading={saving} />
    </Card>
  );
}

const styles = StyleSheet.create({
  close: { alignSelf: "flex-end", padding: spacing.xs },
  preview: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    backgroundColor: colors.linen2,
  },
  note: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  error: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.rose },
  levelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  levelName: { fontFamily: fonts.display, fontSize: 19, color: colors.ink, flex: 1 },
  confidence: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  verdict: { borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  verdictText: { fontFamily: fonts.bodySemibold, fontSize: 16 },
  flag: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.rose },
  caveat: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted },
});
