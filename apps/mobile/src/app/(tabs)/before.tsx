import { useState } from "react";
import { View } from "react-native";
import { beforeMeal } from "@gwinya/shared/content/checklists";
import { CheckRow } from "@/components/check-row";
import { Body, Card, Eyebrow, Screen, Subtitle, Title } from "@/components/ui";
import { colors, spacing } from "@/theme";

export default function Before() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setChecked((c) => ({ ...c, [id]: !c[id] }));
  const allReady = beforeMeal.items.every((i) => checked[i.id]);

  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>Before I eat</Eyebrow>
        <Title>{beforeMeal.title}</Title>
        <Subtitle>{beforeMeal.intro}</Subtitle>
      </View>

      <View style={{ gap: spacing.md }}>
        {beforeMeal.items.map((item) => (
          <CheckRow
            key={item.id}
            label={item.prompt}
            helper={item.helper}
            checked={!!checked[item.id]}
            onToggle={() => toggle(item.id)}
          />
        ))}
      </View>

      {allReady ? (
        <Card style={{ backgroundColor: colors.mossSoft, borderColor: colors.moss }}>
          <Body style={{ color: colors.mossDeep }}>
            You're ready. Take it slow, small mouthfuls, and enjoy your meal.
          </Body>
        </Card>
      ) : null}
    </Screen>
  );
}
