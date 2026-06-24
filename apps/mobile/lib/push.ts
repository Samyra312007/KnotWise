import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import type { ClientApi } from "@knotwise/api-client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(apiBaseUrl: string, api: ClientApi): Promise<string | null> {
  if (!Device.isDevice) return null;

  const permission = await Notifications.getPermissionsAsync();
  const finalStatus =
    permission.status === "granted"
      ? permission.status
      : (await Notifications.requestPermissionsAsync()).status;

  if (finalStatus !== "granted") return null;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await api.registerDevice(
    token,
    Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web"
  );

  void apiBaseUrl;
  return token;
}

export function listenForNotificationNavigation(onNavigate: (path: string) => void) {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as { url?: string; deepLink?: string };
    if (data.url) {
      const match = data.url.match(/\/portal(\/.*)$/);
      onNavigate(match?.[1] ?? "/");
      return;
    }
    if (data.deepLink) {
      const match = data.deepLink.match(/portal(\/.*)$/);
      onNavigate(match?.[1] ?? "/");
    }
  });
  return () => subscription.remove();
}
