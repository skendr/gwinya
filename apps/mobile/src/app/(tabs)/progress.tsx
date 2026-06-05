import { View } from "react-native";
import { Body, Card, Eyebrow, Screen, Subtitle, Title } from "@/components/ui";
import { spacing } from "@/theme";

export default function Progress() {
  return (
    <Screen>
      <View style={{ gap: spacing.sm }}>
        <Eyebrow>Progress</Eyebrow>
        <Title>Your patterns</Title>
        <Subtitle>Gentle trends over time — not scores, just signal.</Subtitle>
      </View>

      <Card>
        <Body>
          As you check in after meals, your streak, confidence trend, and the
          days you noticed coughing or a wet voice will appear here.
        </Body>
      </Card>
    </Screen>
  );
}
