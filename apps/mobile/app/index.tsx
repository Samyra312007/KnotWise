import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth";

export default function IndexScreen() {
  const { token, needsOnboarding } = useAuth();

  if (!token) return <Redirect href="/login" />;
  if (needsOnboarding) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
