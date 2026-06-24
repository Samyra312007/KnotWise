import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { getAuthedClient } from "@/lib/api";
import { LoadingView } from "@/components/LoadingView";
import { colors, spacing } from "@/lib/theme";

export default function NotificationsScreen() {
  const [prefs, setPrefs] = React.useState<{
    introPush: boolean;
    messagePush: boolean;
    reminderPush: boolean;
  } | null>(null);

  React.useEffect(() => {
    void getAuthedClient()
      ?.notificationPreferences()
      .then((data) => setPrefs(data.preferences))
      .catch(() => undefined);
  }, []);

  async function save(next: NonNullable<typeof prefs>) {
    const api = await getAuthedClient();
    if (!api) return;
    const updated = await api.updateNotificationPreferences(next);
    setPrefs(updated.preferences);
  }

  if (!prefs) return <LoadingView />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PreferenceRow
        label="New intros"
        value={prefs.introPush}
        onChange={(introPush) => save({ ...prefs, introPush })}
      />
      <PreferenceRow
        label="Chat messages"
        value={prefs.messagePush}
        onChange={(messagePush) => save({ ...prefs, messagePush })}
      />
      <PreferenceRow
        label="Date reminders"
        value={prefs.reminderPush}
        onChange={(reminderPush) => save({ ...prefs, reminderPush })}
      />
    </ScrollView>
  );
}

function PreferenceRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.vermilion }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.screen },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  rowLabel: { fontSize: 16, color: colors.ink },
});
