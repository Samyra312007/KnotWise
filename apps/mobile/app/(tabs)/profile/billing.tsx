import * as React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { getAuthedClient } from "@/lib/api";
import { LoadingView } from "@/components/LoadingView";
import { colors, spacing } from "@/lib/theme";

type PlanRow = {
  id: string;
  label: string;
  priceInr: number;
};

export default function BillingScreen() {
  const [plan, setPlan] = React.useState("");
  const [plans, setPlans] = React.useState<PlanRow[]>([]);
  const [introRemaining, setIntroRemaining] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  async function reload() {
    const client = await getAuthedClient();
    if (!client) return;
    const data = await client.billing();
    setPlan(data.plan);
    setPlans(data.plans);
    setIntroRemaining(data.introRequestsRemaining);
    setLoading(false);
  }

  React.useEffect(() => {
    void reload().catch(() => setLoading(false));
  }, []);

  async function upgrade(target: "plus" | "premium") {
    const client = await getAuthedClient();
    if (!client) return;
    try {
      const key = `${target}-${Date.now()}`;
      const result = await client.billingCheckout(target, key);
      Alert.alert("Plan updated", result.dryRun ? `Upgraded to ${target} (dry run).` : "Complete payment in browser.");
      await reload();
    } catch (err) {
      Alert.alert("Checkout failed", err instanceof Error ? err.message : "Try again.");
    }
  }

  if (loading) return <LoadingView />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.meta}>Current plan: {plan}</Text>
      {introRemaining > 0 ? <Text style={styles.meta}>Intro requests left: {introRemaining}</Text> : null}
      <View style={styles.list}>
        {plans
          .filter((p) => p.id !== "included")
          .map((p) => (
            <View key={p.id} style={styles.card}>
              <Text style={styles.title}>{p.label}</Text>
              <Text style={styles.price}>₹{p.priceInr}/mo</Text>
              {plan !== p.id ? (
                <Pressable style={styles.primary} onPress={() => void upgrade(p.id as "plus" | "premium")}>
                  <Text style={styles.primaryText}>Upgrade</Text>
                </Pressable>
              ) : (
                <Text style={styles.active}>Active</Text>
              )}
            </View>
          ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.screen, paddingTop: 16, gap: 12 },
  meta: { fontSize: 15, color: colors.inkWarm },
  list: { marginTop: 16, gap: 12 },
  card: { borderWidth: 1, borderColor: "rgba(26,26,26,0.12)", padding: 16, gap: 8 },
  title: { fontSize: 18, fontWeight: "600", color: colors.ink },
  price: { fontSize: 16, color: colors.inkWarm },
  primary: { marginTop: 8, backgroundColor: colors.ink, paddingVertical: 10, alignItems: "center" },
  primaryText: { color: colors.paper, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, fontSize: 12 },
  active: { marginTop: 8, color: colors.vermilion, textTransform: "uppercase", letterSpacing: 1, fontSize: 12 },
});
