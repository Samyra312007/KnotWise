import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/lib/auth";
import { getAuthedClient } from "@/lib/api";
import { LoadingView } from "@/components/LoadingView";
import { colors, spacing } from "@/lib/theme";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const [profile, setProfile] = React.useState<{
    profile: Record<string, unknown>;
    stage: string;
    pendingRevisions: Array<{ fieldPath: string }>;
  } | null>(null);

  React.useEffect(() => {
    void getAuthedClient()
      ?.profile()
      .then(setProfile)
      .catch(() => undefined);
  }, []);

  if (!profile) return <LoadingView />;

  const biodata = profile.profile;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>
        {String(biodata.firstName ?? "")} {String(biodata.lastName ?? "")}
      </Text>
      <Text style={styles.meta}>
        {String(biodata.city ?? "")} · {profile.stage}
      </Text>
      {profile.pendingRevisions.length > 0 ? (
        <Text style={styles.pending}>{profile.pendingRevisions.length} change(s) awaiting matchmaker review</Text>
      ) : null}

      <View style={styles.links}>
        <Link href="/(tabs)/profile/edit" asChild>
          <Pressable style={styles.link}>
            <Text style={styles.linkText}>Edit profile</Text>
          </Pressable>
        </Link>
        <Link href="/(tabs)/profile/notifications" asChild>
          <Pressable style={styles.link}>
            <Text style={styles.linkText}>Notification settings</Text>
          </Pressable>
        </Link>
        <Link href="/(tabs)/profile/messages" asChild>
          <Pressable style={styles.link}>
            <Text style={styles.linkText}>Matchmaker messages</Text>
          </Pressable>
        </Link>
        <Pressable style={styles.logout} onPress={() => void signOut()}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.screen, paddingTop: 24 },
  title: { fontSize: 28, fontWeight: "600", color: colors.ink },
  meta: { marginTop: 8, fontSize: 15, color: colors.inkWarm },
  pending: { marginTop: 12, fontSize: 14, color: colors.vermilion },
  links: { marginTop: 32, gap: 16 },
  link: { paddingVertical: 8 },
  linkText: { color: colors.vermilion, fontSize: 14, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  logout: { marginTop: 24, paddingVertical: 12 },
  logoutText: { color: colors.inkMuted, fontSize: 14, textTransform: "uppercase", letterSpacing: 1 },
});
