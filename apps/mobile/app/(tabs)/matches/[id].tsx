import * as React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import type { IntroReveal, MatchDetail } from "@knotwise/api-client";
import { getAuthedClient } from "@/lib/api";
import { LoadingView } from "@/components/LoadingView";
import { colors, spacing } from "@/lib/theme";

function Field({ label, value }: { label: string; value?: string | number }) {
  if (value == null || value === "") return null;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = React.useState<MatchDetail | null>(null);
  const [fullReveal, setFullReveal] = React.useState<IntroReveal | null>(null);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const load = React.useCallback(async () => {
    const api = await getAuthedClient();
    if (!api || !id) return;
    const data = await api.matchDetail(id);
    setDetail(data);
    if (data.mutualMatchId) {
      const mutual = await api.mutualDetail(data.mutualMatchId);
      setFullReveal(mutual.candidate);
      setConversationId(mutual.conversationId ?? null);
    }
  }, [id]);

  React.useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function respond(decision: "accept" | "decline") {
    const api = await getAuthedClient();
    if (!api || !id) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await api.matchFeedback(id, decision, reason.trim() || undefined);
      if (result.status === "mutual") setMessage("Mutual match! Contact details unlocked.");
      else if (result.status === "accepted") setMessage("Marked as interested.");
      else setMessage("Intro declined.");
      await load();
      if (result.mutualMatchId) {
        const mutual = await api.mutualDetail(result.mutualMatchId);
        setFullReveal(mutual.candidate);
        setConversationId(mutual.conversationId ?? null);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save response.");
    } finally {
      setBusy(false);
    }
  }

  if (!detail) return <LoadingView />;

  const reveal = fullReveal ?? detail.candidate;
  const canRespond = detail.status === "sent" || detail.status === "viewed";
  const isMutual = detail.status === "mutual" || !!fullReveal;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {reveal.photoUrl ? <Image source={{ uri: reveal.photoUrl }} style={styles.photo} /> : null}
        <View style={styles.headerBody}>
          <Text style={styles.name}>
            {reveal.firstName}
            {reveal.lastName ? ` ${reveal.lastName}` : ""}
          </Text>
          <Text style={styles.meta}>
            {reveal.age} · {reveal.city} · {detail.bucket} ({detail.score})
          </Text>
        </View>
      </View>

      {reveal.bioHeadline ? <Text style={styles.bio}>{reveal.bioHeadline}</Text> : null}

      {isMutual ? (
        <View style={styles.grid}>
          <Field label="Company" value={reveal.currentCompany} />
          <Field label="Role" value={reveal.designation} />
          <Field label="Education" value={reveal.educationLevel} />
          <Field label="Email" value={reveal.email} />
          <Field label="Phone" value={reveal.phone} />
        </View>
      ) : (
        <Text style={styles.note}>Limited preview until mutual match.</Text>
      )}

      {isMutual && conversationId ? (
        <Link href={`/(tabs)/chat/${conversationId}`} asChild>
          <Pressable style={styles.chatButton}>
            <Text style={styles.chatButtonText}>Open chat</Text>
          </Pressable>
        </Link>
      ) : null}

      {canRespond ? (
        <View style={styles.response}>
          <Text style={styles.responseTitle}>Your response</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Optional note to matchmaker"
            multiline
            style={styles.input}
          />
          <View style={styles.actions}>
            <Pressable style={styles.accept} disabled={busy} onPress={() => respond("accept")}>
              <Text style={styles.acceptText}>Accept</Text>
            </Pressable>
            <Pressable style={styles.decline} disabled={busy} onPress={() => respond("decline")}>
              <Text style={styles.declineText}>Decline</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.screen, paddingBottom: 40 },
  header: { flexDirection: "row", gap: 16 },
  photo: { width: 96, height: 96, backgroundColor: colors.paperQuiet },
  headerBody: { flex: 1 },
  name: { fontSize: 24, fontWeight: "600", color: colors.ink },
  meta: { marginTop: 6, fontSize: 14, color: colors.inkWarm },
  bio: { marginTop: 20, fontSize: 16, fontStyle: "italic", color: colors.inkWarm, lineHeight: 24 },
  note: { marginTop: 20, fontSize: 14, color: colors.inkMuted },
  grid: { marginTop: 20, gap: 12 },
  field: { marginBottom: 8 },
  fieldLabel: { fontSize: 10, color: colors.inkMuted, textTransform: "uppercase", letterSpacing: 1 },
  fieldValue: { marginTop: 4, fontSize: 14, color: colors.ink },
  chatButton: { marginTop: 20, borderWidth: 1, borderColor: colors.vermilion, padding: 12 },
  chatButtonText: { color: colors.vermilion, textAlign: "center", fontWeight: "600", textTransform: "uppercase", fontSize: 12 },
  response: { marginTop: 28, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 20 },
  responseTitle: { fontSize: 11, color: colors.inkMuted, textTransform: "uppercase", letterSpacing: 1 },
  input: { marginTop: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", padding: 12, minHeight: 80, textAlignVertical: "top" },
  actions: { flexDirection: "row", gap: 12, marginTop: 12 },
  accept: { flex: 1, backgroundColor: colors.vermilion, padding: 12 },
  acceptText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  decline: { flex: 1, borderWidth: 1, borderColor: colors.border, padding: 12 },
  declineText: { color: colors.ink, textAlign: "center" },
  message: { marginTop: 16, fontSize: 14, color: colors.inkWarm },
});
