import * as React from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import type { ConversationListItem } from "@knotwise/api-client";
import { getAuthedClient } from "@/lib/api";
import { LoadingView } from "@/components/LoadingView";
import { colors, spacing } from "@/lib/theme";

export default function ChatListScreen() {
  const [items, setItems] = React.useState<ConversationListItem[] | null>(null);

  React.useEffect(() => {
    void getAuthedClient()
      ?.conversations()
      .then((data) => setItems(data.items))
      .catch(() => setItems([]));
  }, []);

  if (items === null) return <LoadingView />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chats</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No mutual chats yet.</Text>}
        renderItem={({ item }) => (
          <Link href={`/(tabs)/chat/${item.id}`} asChild>
            <Pressable style={styles.row}>
              {item.counterpart.photoUrl ? (
                <Image source={{ uri: item.counterpart.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]} />
              )}
              <View style={styles.body}>
                <Text style={styles.name}>
                  {item.counterpart.firstName} {item.counterpart.lastName}
                </Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastMessage?.body ?? "Say hello"}
                </Text>
              </View>
              {item.blocked ? <Text style={styles.blocked}>Blocked</Text> : null}
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, paddingTop: 16 },
  title: { fontSize: 24, fontWeight: "600", color: colors.ink, paddingHorizontal: spacing.screen, marginBottom: 12 },
  list: { paddingHorizontal: spacing.screen },
  row: { flexDirection: "row", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 48, height: 48, backgroundColor: colors.paperQuiet },
  avatarPlaceholder: { borderWidth: 1, borderColor: colors.border },
  body: { flex: 1, justifyContent: "center" },
  name: { fontSize: 16, fontWeight: "600", color: colors.ink },
  preview: { marginTop: 4, fontSize: 14, color: colors.inkMuted },
  blocked: { fontSize: 10, color: colors.vermilion, textTransform: "uppercase" },
  empty: { fontStyle: "italic", color: colors.inkMuted, marginTop: 24 },
});
