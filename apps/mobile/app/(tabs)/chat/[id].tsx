import * as React from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { ChatMessage, ConversationListItem } from "@knotwise/api-client";
import { getAuthedClient } from "@/lib/api";
import { LoadingView } from "@/components/LoadingView";
import { colors, spacing } from "@/lib/theme";

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [meta, setMeta] = React.useState<ConversationListItem | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const listRef = React.useRef<FlatList>(null);

  const load = React.useCallback(async () => {
    const api = await getAuthedClient();
    if (!api || !id) return;
    const [conversation, messageData] = await Promise.all([
      api.conversation(id),
      api.conversationMessages(id),
    ]);
    setMeta(conversation);
    setMessages(messageData.messages);
  }, [id]);

  React.useEffect(() => {
    void load().catch(() => undefined);
    const timer = setInterval(() => {
      void getAuthedClient()
        ?.conversationMessages(id!)
        .then((data) => setMessages(data.messages))
        .catch(() => undefined);
    }, 4000);
    return () => clearInterval(timer);
  }, [id, load]);

  async function send() {
    const text = body.trim();
    const api = await getAuthedClient();
    if (!text || !api || !id || meta?.blocked) return;
    setBusy(true);
    try {
      const result = await api.sendConversationMessage(id, text);
      setMessages((prev) => [...prev, result.message]);
      setBody("");
      listRef.current?.scrollToEnd({ animated: true });
    } finally {
      setBusy(false);
    }
  }

  if (!meta) return <LoadingView />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <Text style={styles.title}>
        {meta.counterpart.firstName} {meta.counterpart.lastName}
      </Text>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubbleWrap, item.mine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs]}>
            <View style={[styles.bubble, item.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
              <Text style={styles.bubbleText}>{item.body}</Text>
            </View>
          </View>
        )}
      />
      {meta.blocked ? (
        <Text style={styles.blocked}>Messaging disabled.</Text>
      ) : (
        <View style={styles.composer}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Write a message…"
            multiline
            style={styles.input}
          />
          <Pressable style={[styles.send, busy && styles.sendDisabled]} disabled={busy || !body.trim()} onPress={send}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  title: { fontSize: 18, fontWeight: "600", color: colors.ink, padding: spacing.screen, paddingBottom: 8 },
  messages: { padding: spacing.screen, gap: 10, flexGrow: 1 },
  bubbleWrap: { maxWidth: "85%" },
  bubbleWrapMine: { alignSelf: "flex-end" },
  bubbleWrapTheirs: { alignSelf: "flex-start" },
  bubble: { padding: 12 },
  bubbleMine: { backgroundColor: "rgba(196,30,30,0.1)" },
  bubbleTheirs: { backgroundColor: colors.paperQuiet, borderWidth: 1, borderColor: colors.border },
  bubbleText: { fontSize: 15, color: colors.ink, lineHeight: 22 },
  composer: { borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.screen, gap: 10 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", padding: 12, minHeight: 80, textAlignVertical: "top" },
  send: { backgroundColor: colors.vermilion, padding: 12 },
  sendDisabled: { opacity: 0.6 },
  sendText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  blocked: { padding: spacing.screen, fontStyle: "italic", color: colors.inkMuted },
});
