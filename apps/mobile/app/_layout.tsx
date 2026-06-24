import * as React from "react";
import { Linking } from "react-native";
import { Redirect, Stack, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "@/lib/auth";
import { listenForNotificationNavigation } from "@/lib/push";
import { LoadingView } from "@/components/LoadingView";

function RootNavigator() {
  const { loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      const parsed = Linking.parse(url);
      const token = parsed.queryParams?.token;
      if (typeof token === "string") {
        router.push({ pathname: "/verify", params: { token } });
      }
    });

    void Linking.getInitialURL().then((url) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      const token = parsed.queryParams?.token;
      if (typeof token === "string") {
        router.push({ pathname: "/verify", params: { token } });
      }
    });

    return () => sub.remove();
  }, [router]);

  React.useEffect(() => {
    return listenForNotificationNavigation((path) => {
      if (path.startsWith("/matches/")) {
        router.push(`/(tabs)/matches/${path.replace("/matches/", "")}` as never);
      } else if (path.startsWith("/chat/")) {
        router.push(`/(tabs)/chat/${path.replace("/chat/", "")}` as never);
      }
    });
  }, [router]);

  if (loading) return <LoadingView />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f7f4ef" } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
