import * as React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { getAuthedClient } from "@/lib/api";
import { LoadingView } from "@/components/LoadingView";
import { colors, spacing } from "@/lib/theme";

type DelegateRow = {
  id: string;
  email: string;
  role: string;
  status: string;
};

export default function FamilyScreen() {
  const [delegates, setDelegates] = React.useState<DelegateRow[]>([]);
  const [maxDelegates, setMaxDelegates] = React.useState(3);
  const [optIn, setOptIn] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"observer" | "approver">("observer");
  const [loading, setLoading] = React.useState(true);

  async function reload() {
    const client = await getAuthedClient();
    if (!client) return;
    const data = await client.familyDelegates();
    setDelegates(data.delegates);
    setMaxDelegates(data.maxDelegates);
    setOptIn(data.delegateApproverOptIn);
    setLoading(false);
  }

  React.useEffect(() => {
    void reload().catch(() => setLoading(false));
  }, []);

  async function invite() {
    const client = await getAuthedClient();
    if (!client || !email.trim()) return;
    try {
      await client.inviteFamilyDelegate(email.trim(), role);
      setEmail("");
      await reload();
      Alert.alert("Invite sent");
    } catch (err) {
      Alert.alert("Could not invite", err instanceof Error ? err.message : "Try again.");
    }
  }

  async function revoke(id: string) {
    const client = await getAuthedClient();
    if (!client) return;
    await client.revokeFamilyDelegate(id);
    await reload();
  }

  async function toggleOptIn(next: boolean) {
    const client = await getAuthedClient();
    if (!client) return;
    const data = await client.updateFamilyDelegateSettings(next);
    setOptIn(data.delegateApproverOptIn);
  }

  if (loading) return <LoadingView />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.copy}>
        Invite a parent or guardian to view intros. Approvers can respond on your behalf.
      </Text>

      <View style={styles.row}>
        <Text style={styles.label}>Allow approver for age 35+</Text>
        <Switch value={optIn} onValueChange={(v) => void toggleOptIn(v)} />
      </View>

      {delegates.length < maxDelegates ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Delegate email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <View style={styles.roleRow}>
            {(["observer", "approver"] as const).map((r) => (
              <Pressable
                key={r}
                style={[styles.roleChip, role === r && styles.roleChipActive]}
                onPress={() => setRole(r)}
              >
                <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.primary} onPress={() => void invite()}>
            <Text style={styles.primaryText}>Send invite</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.meta}>Maximum {maxDelegates} delegates reached.</Text>
      )}

      <View style={styles.list}>
        {delegates.map((d) => (
          <View key={d.id} style={styles.card}>
            <Text style={styles.email}>{d.email}</Text>
            <Text style={styles.meta}>
              {d.role} · {d.status}
            </Text>
            <Pressable onPress={() => void revoke(d.id)}>
              <Text style={styles.remove}>Remove</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.screen, paddingTop: 16, gap: 16 },
  copy: { fontSize: 15, color: colors.inkWarm, lineHeight: 22 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  label: { flex: 1, fontSize: 14, color: colors.ink, marginRight: 12 },
  form: { marginTop: 8, gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(26,26,26,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  roleRow: { flexDirection: "row", gap: 8 },
  roleChip: {
    borderWidth: 1,
    borderColor: "rgba(26,26,26,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  roleChipActive: { borderColor: colors.vermilion, backgroundColor: "rgba(180,58,42,0.08)" },
  roleText: { fontSize: 12, textTransform: "uppercase", letterSpacing: 1, color: colors.inkMuted },
  roleTextActive: { color: colors.vermilion },
  primary: {
    backgroundColor: colors.ink,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryText: { color: colors.paper, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, fontSize: 12 },
  list: { marginTop: 16, gap: 12 },
  card: { borderWidth: 1, borderColor: "rgba(26,26,26,0.12)", padding: 12, gap: 4 },
  email: { fontSize: 15, color: colors.ink },
  meta: { fontSize: 12, color: colors.inkMuted, textTransform: "uppercase", letterSpacing: 1 },
  remove: { marginTop: 8, color: colors.vermilion, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
});
