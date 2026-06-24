import * as React from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import type { MatchListItem } from "@knotwise/api-client";
import { getAuthedClient } from "@/lib/api";
import { LoadingView } from "@/components/LoadingView";
import { colors, spacing } from "@/lib/theme";

function statusLabel(status: string) {
  switch (status) {
    case "sent":
      return "New intro";
    case "viewed":
      return "Awaiting response";
    case "accepted":
      return "Interested";
    case "declined":
      return "Declined";
    case "mutual":
      return "Mutual match";
    default:
      return status;
  }
}

export default function MatchesScreen() {
  const [items, setItems] = React.useState<MatchListItem[] | null>(null);

  React.useEffect(() => {
    void getAuthedClient()
      ?.matches()
      .then((data) => setItems(data.items))
      .catch(() => setItems([]));
  }, []);

  if (items === null) return <LoadingView />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Introduced matches</Text>
      <Text style={styles.subtitle}>Contact details unlock after you both accept.</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No matches introduced yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              {item.candidate.photoUrl ? (
                <Image source={{ uri: item.candidate.photoUrl }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoPlaceholder]} />
              )}
              <View style={styles.body}>
                <Text style={styles.name}>
                  {item.candidate.firstName}
                  {item.revealLevel === "full" && item.candidate.lastName ? ` ${item.candidate.lastName}` : ""}
                </Text>
                <Text style={styles.meta}>
                  {item.candidate.city} · {item.bucket}
                </Text>
                <Text style={styles.status}>{statusLabel(item.status)}</Text>
                <Link href={`/(tabs)/matches/${item.id}`} asChild>
                  <Pressable style={styles.link}>
                    <Text style={styles.linkText}>View intro</Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, paddingTop: 16 },
  title: { fontSize: 24, fontWeight: "600", color: colors.ink, paddingHorizontal: spacing.screen },
  subtitle: { marginTop: 8, fontSize: 14, color: colors.inkMuted, paddingHorizontal: spacing.screen },
  list: { padding: spacing.screen, gap: 16 },
  card: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 },
  row: { flexDirection: "row", gap: 12 },
  photo: { width: 72, height: 72, backgroundColor: colors.paperQuiet },
  photoPlaceholder: { borderWidth: 1, borderColor: colors.border },
  body: { flex: 1 },
  name: { fontSize: 20, fontWeight: "600", color: colors.ink },
  meta: { marginTop: 4, fontSize: 14, color: colors.inkWarm },
  status: { marginTop: 8, fontSize: 11, color: colors.inkMuted, textTransform: "uppercase", letterSpacing: 1 },
  link: { marginTop: 10 },
  linkText: { color: colors.vermilion, fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  empty: { fontStyle: "italic", color: colors.inkMuted, marginTop: 24 },
});
