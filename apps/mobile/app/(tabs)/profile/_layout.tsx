import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#f7f4ef" },
        headerTintColor: "#1a1a1a",
        contentStyle: { backgroundColor: "#f7f4ef" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Profile" }} />
      <Stack.Screen name="edit" options={{ title: "Edit profile" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="messages" options={{ title: "Matchmaker" }} />
      <Stack.Screen name="family" options={{ title: "Family delegates" }} />
    </Stack>
  );
}
