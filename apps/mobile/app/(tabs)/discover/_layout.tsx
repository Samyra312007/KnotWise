import { Stack } from "expo-router";

export default function DiscoverLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#f7f4ef" },
        headerTintColor: "#1a1a1a",
        contentStyle: { backgroundColor: "#f7f4ef" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Discover" }} />
    </Stack>
  );
}
