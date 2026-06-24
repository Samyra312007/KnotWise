import * as React from "react";
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import type { ScheduleItem } from "@knotwise/api-client";
import { getAuthedClient } from "@/lib/api";
import { LoadingView } from "@/components/LoadingView";
import { colors, spacing } from "@/lib/theme";

export default function ScheduleScreen() {
  const [items, setItems] = React.useState<ScheduleItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      const api = await getAuthedClient();
      if (!api) return;
      const data = await api.schedules();
      setItems(data.items.filter((i) => i.status === "proposed" || i.status === "accepted"));
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingView />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dates & calls</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No upcoming dates.</Text>}
        renderItem={({ item }) => (
          <Link href={`/(tabs)/schedule/${item.id}`} asChild>
            <Pressable style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSub}>
                {item.counterpart.firstName} {item.counterpart.lastName} · {item.status}
              </Text>
              <Text style={styles.cardMeta}>{new Date(item.startsAt).toLocaleString()}</Text>
              {item.status === "accepted" && item.videoLink ? (
                <Pressable onPress={() => Linking.openURL(item.videoLink!)}>
                  <Text style={styles.videoLink}>Join video</Text>
                </Pressable>
              ) : null}
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, padding: spacing.screen },
  title: { fontSize: 22, fontWeight: "600", color: colors.ink, marginBottom: 16 },
  list: { gap: 12, paddingBottom: 40 },
  empty: { fontStyle: "italic", color: colors.inkMuted },
  card: { borderWidth: 1, borderColor: colors.border, padding: 14, backgroundColor: "#fff" },
  cardTitle: { fontSize: 16, fontWeight: "600", color: colors.ink },
  cardSub: { marginTop: 4, fontSize: 13, color: colors.inkMuted },
  cardMeta: { marginTop: 8, fontSize: 12, color: colors.inkMuted, textTransform: "uppercase" },
  videoLink: { marginTop: 10, color: colors.vermilion, fontWeight: "600", fontSize: 12, textTransform: "uppercase" },
});
