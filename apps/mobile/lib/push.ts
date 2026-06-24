import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(apiBaseUrl: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  const permission = await Notifications.getPermissionsAsync();
  const finalStatus =
    permission.status === "granted"
      ? permission.status
      : (await Notifications.requestPermissionsAsync()).status;

  if (finalStatus !== "granted") return null;

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  await fetch(`${apiBaseUrl}/api/client/devices`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      token,
      platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web",
    }),
  });

  return token;
}

export function listenForNotificationNavigation(onNavigate: (url: string) => void) {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as { url?: string; deepLink?: string };
    if (data.url) onNavigate(data.url);
    else if (data.deepLink) onNavigate(data.deepLink);
  });
  return () => subscription.remove();
}
