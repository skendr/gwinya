import { Stack } from "expo-router";
import { colors } from "@/theme";

export default function LearnLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.linen } }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[slug]"
        options={{
          headerShown: true,
          title: "",
          headerBackTitle: "Learn",
          headerTintColor: colors.clay,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.linen },
        }}
      />
    </Stack>
  );
}
