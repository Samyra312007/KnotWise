import * as React from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { DiscoverItem } from "@knotwise/api-client";
import { getAuthedClient, runWithAuthedClient } from "@/lib/api";
import { LoadingView } from "@/components/LoadingView";
import { colors, spacing } from "@/lib/theme";

export default function DiscoverScreen() {
  const [items, setItems] = React.useState<DiscoverItem[] | null>(null);
  const [q, setQ] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");

  const load = React.useCallback(() => {
    return runWithAuthedClient((api) => api.discover({ q: q.trim() || undefined }))
      .then((data) => setItems(data?.items ?? []))
      .catch(() => setItems([]));
  }, [q]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function expressInterest(poolProfileId: string) {
    const api = await getAuthedClient();
    if (!api) return;
    setBusyId(poolProfileId);
    setMessage("");
    try {
      await api.expressDiscoverInterest(poolProfileId);
      setItems((prev) =>
        (prev ?? []).map((item) =>
          item.poolProfileId === poolProfileId ? { ...item, interestStatus: "pending" } : item
        )
      );
      setMessage("Your matchmaker has been notified.");
    } catch {
      setMessage("Could not express interest.");
    } finally {
      setBusyId(null);
    }
  }

  if (items === null) return <LoadingView />;

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>Expressing interest notifies your matchmaker. Chat opens only after a formal intro.</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search"
        style={styles.search}
        onSubmitEditing={() => void load()}
      />
        <FlatList
          data={items}
          keyExtractor={(item) => item.poolProfileId}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No profiles match your filters.</Text>}
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
                    {item.candidate.firstName}, {item.candidate.age}
                  </Text>
                  <Text style={styles.meta}>
                    {item.candidate.city} · {item.bucket}
                    {item.verified ? " · verified" : ""}
                  </Text>
                  {item.candidate.bioHeadline ? (
                    <Text style={styles.bio}>{item.candidate.bioHeadline}</Text>
                  ) : null}
                  {item.interestStatus ? (
                    <Text style={styles.interest}>Interest {item.interestStatus}</Text>
                  ) : (
                    <Pressable
                      style={[styles.button, busyId === item.poolProfileId && styles.buttonDisabled]}
                      disabled={busyId === item.poolProfileId}
                      onPress={() => expressInterest(item.poolProfileId)}
                    >
                      <Text style={styles.buttonText}>Interested</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          )}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  hint: { paddingHorizontal: spacing.screen, paddingTop: 12, fontSize: 13, color: colors.inkMuted, lineHeight: 20 },
  message: { paddingHorizontal: spacing.screen, paddingTop: 8, fontSize: 14, color: colors.vermilion },
  search: {
    margin: spacing.screen,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    padding: 12,
    fontSize: 16,
  },
  list: { paddingHorizontal: spacing.screen, paddingBottom: 24 },
  card: { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 16 },
  row: { flexDirection: "row", gap: 12 },
  photo: { width: 72, height: 72, backgroundColor: colors.paperQuiet },
  photoPlaceholder: { borderWidth: 1, borderColor: colors.border },
  body: { flex: 1 },
  name: { fontSize: 20, fontWeight: "600", color: colors.ink },
  meta: { marginTop: 4, fontSize: 14, color: colors.inkWarm },
  bio: { marginTop: 8, fontSize: 14, fontStyle: "italic", color: colors.inkWarm },
  interest: { marginTop: 12, fontSize: 11, color: colors.vermilion, textTransform: "uppercase" },
  button: { marginTop: 12, backgroundColor: colors.vermilion, paddingVertical: 10, paddingHorizontal: 14, alignSelf: "flex-start" },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  empty: { fontStyle: "italic", color: colors.inkMuted, marginTop: 24 },
});
