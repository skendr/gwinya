import { Redirect, Stack } from "expo-router";
import { useSession } from "@/lib/auth";

export default function AuthLayout() {
  const { session, loading } = useSession();

  if (loading) return null; // native splash still showing on cold start
  if (session) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
