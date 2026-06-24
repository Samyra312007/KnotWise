import * as React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { ScheduleItem } from "@knotwise/api-client";
import { getAuthedClient } from "@/lib/api";
import { LoadingView } from "@/components/LoadingView";
import { colors, spacing } from "@/lib/theme";

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = React.useState<ScheduleItem | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const api = await getAuthedClient();
    if (!api || !id) return;
    const data = await api.scheduleDetail(id);
    setEvent(data.event);
  }, [id]);

  React.useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  async function respond(action: "accept" | "decline" | "cancel") {
    const api = await getAuthedClient();
    if (!api || !id) return;
    setBusy(true);
    try {
      const data = await api.respondSchedule(id, action);
      setEvent(data.event);
    } finally {
      setBusy(false);
    }
  }

  if (!event) return <LoadingView />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.sub}>
        with {event.counterpart.firstName} {event.counterpart.lastName}
      </Text>
      <Text style={styles.meta}>{new Date(event.startsAt).toLocaleString()} · {event.status}</Text>
      {event.location ? <Text style={styles.location}>{event.location}</Text> : null}

      {event.status === "accepted" && event.videoLink ? (
        <Pressable style={styles.button} onPress={() => Linking.openURL(event.videoLink!)}>
          <Text style={styles.buttonText}>Join video call</Text>
        </Pressable>
      ) : null}

      {event.status === "proposed" && !event.mine ? (
        <View style={styles.row}>
          <Pressable style={styles.button} disabled={busy} onPress={() => respond("accept")}>
            <Text style={styles.buttonText}>Accept</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.buttonQuiet]} disabled={busy} onPress={() => respond("decline")}>
            <Text style={styles.buttonQuietText}>Decline</Text>
          </Pressable>
        </View>
      ) : null}

      {(event.status === "accepted" || (event.status === "proposed" && event.mine)) ? (
        <Pressable style={[styles.button, styles.buttonQuiet, { marginTop: 12 }]} disabled={busy} onPress={() => respond("cancel")}>
          <Text style={styles.buttonQuietText}>{event.status === "proposed" ? "Withdraw" : "Cancel"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, padding: spacing.screen },
  title: { fontSize: 22, fontWeight: "600", color: colors.ink },
  sub: { marginTop: 8, fontSize: 15, color: colors.inkMuted },
  meta: { marginTop: 12, fontSize: 12, color: colors.inkMuted, textTransform: "uppercase" },
  location: { marginTop: 8, fontSize: 14, color: colors.ink },
  row: { flexDirection: "row", gap: 10, marginTop: 24 },
  button: { marginTop: 24, backgroundColor: colors.vermilion, padding: 14 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600", textTransform: "uppercase", fontSize: 12 },
  buttonQuiet: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
  buttonQuietText: { color: colors.ink, textAlign: "center", fontWeight: "600", textTransform: "uppercase", fontSize: 12 },
});
