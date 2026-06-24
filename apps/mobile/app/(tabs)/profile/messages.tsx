import * as React from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { ThreadMessage } from "@knotwise/api-client";
import { getAuthedClient } from "@/lib/api";
import { LoadingView } from "@/components/LoadingView";
import { colors, spacing } from "@/lib/theme";

export default function MatchmakerMessagesScreen() {
  const [messages, setMessages] = React.useState<ThreadMessage[]>([]);
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    void getAuthedClient()
      ?.threadMessages()
      .then((data) => setMessages(data.messages))
      .catch(() => undefined)
      .finally(() => setLoaded(true));
    const timer = setInterval(() => {
      void getAuthedClient()
        ?.threadMessages()
        .then((data) => setMessages(data.messages))
        .catch(() => undefined);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  async function send() {
    const text = body.trim();
    const api = await getAuthedClient();
    if (!text || !api) return;
    setBusy(true);
    try {
      const result = await api.sendThreadMessage(text);
      setMessages((prev) => [...prev, result.message]);
      setBody("");
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return <LoadingView />;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.message}>
            <Text style={styles.meta}>{item.authorType === "client" ? "You" : "Matchmaker"}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />
      <View style={styles.composer}>
        <TextInput value={body} onChangeText={setBody} placeholder="Message your matchmaker" multiline style={styles.input} />
        <Pressable style={[styles.send, busy && styles.sendDisabled]} disabled={busy || !body.trim()} onPress={send}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  list: { padding: spacing.screen, gap: 16 },
  message: { borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: 12 },
  meta: { fontSize: 10, color: colors.inkMuted, textTransform: "uppercase", letterSpacing: 1 },
  body: { marginTop: 6, fontSize: 15, color: colors.ink, lineHeight: 22 },
  composer: { borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.screen, gap: 10 },
  input: { borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", padding: 12, minHeight: 80, textAlignVertical: "top" },
  send: { backgroundColor: colors.vermilion, padding: 12 },
  sendDisabled: { opacity: 0.6 },
  sendText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
