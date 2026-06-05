import type { ColorValue } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "@/lib/auth";
import { colors, fonts } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} color={color as string} size={size} />
  );
}

export default function TabsLayout() {
  const { session, loading } = useSession();

  if (loading) return null; // native splash still showing on cold start
  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.clay,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Today", tabBarIcon: tabIcon("today-outline") }}
      />
      <Tabs.Screen
        name="learn"
        options={{ title: "Learn", tabBarIcon: tabIcon("book-outline") }}
      />
      <Tabs.Screen
        name="before"
        options={{ title: "Before", tabBarIcon: tabIcon("checkbox-outline") }}
      />
      <Tabs.Screen
        name="after"
        options={{ title: "After", tabBarIcon: tabIcon("create-outline") }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: "Progress", tabBarIcon: tabIcon("stats-chart-outline") }}
      />
    </Tabs>
  );
}
