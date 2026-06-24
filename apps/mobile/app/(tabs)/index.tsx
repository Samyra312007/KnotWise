import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/lib/auth";
import { getAuthedClient } from "@/lib/api";
import type { ClientHome } from "@knotwise/api-client";
import { LoadingView } from "@/components/LoadingView";
import { colors, spacing } from "@/lib/theme";

export default function HomeScreen() {
  const { client } = useAuth();
  const [home, setHome] = React.useState<ClientHome | null>(null);

  React.useEffect(() => {
    void getAuthedClient()
      ?.home()
      .then(setHome)
      .catch(() => undefined);
  }, []);

  if (!home) return <LoadingView />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Hello, {home.customer.firstName}.</Text>
      <Text style={styles.stage}>Journey stage: {home.customer.stage}</Text>
      <Text style={styles.meta}>Matchmaker: {home.customer.matchmakerName}</Text>

      <View style={styles.links}>
        <Link href="/(tabs)/matches" asChild>
          <Pressable style={styles.link}>
            <Text style={styles.linkText}>View introduced matches</Text>
          </Pressable>
        </Link>
        <Link href="/(tabs)/profile" asChild>
          <Pressable style={styles.linkQuiet}>
            <Text style={styles.linkQuietText}>Your profile</Text>
          </Pressable>
        </Link>
        <Link href="/(tabs)/profile/messages" asChild>
          <Pressable style={styles.linkQuiet}>
            <Text style={styles.linkQuietText}>Message matchmaker</Text>
          </Pressable>
        </Link>
      </View>

      <Text style={styles.footer}>{client?.email}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.screen, paddingTop: 24 },
  greeting: { fontSize: 28, fontWeight: "600", color: colors.ink },
  stage: { marginTop: 12, fontSize: 16, color: colors.inkWarm },
  meta: { marginTop: 8, fontSize: 14, color: colors.inkMuted },
  links: { marginTop: 32, gap: 12 },
  link: { paddingVertical: 12 },
  linkText: { color: colors.vermilion, fontSize: 14, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  linkQuiet: { paddingVertical: 8 },
  linkQuietText: { color: colors.inkMuted, fontSize: 14, textTransform: "uppercase", letterSpacing: 1 },
  footer: { marginTop: 40, fontSize: 12, color: colors.inkMuted },
});
