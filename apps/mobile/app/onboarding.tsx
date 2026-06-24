import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { getAuthedClient } from "@/lib/api";
import type { OnboardingState } from "@knotwise/api-client";
import { LoadingView } from "@/components/LoadingView";
import { colors, spacing } from "@/lib/theme";
import { useAuth } from "@/lib/auth";

export default function OnboardingScreen() {
  const { refresh } = useAuth();
  const [state, setState] = React.useState<OnboardingState | null>(null);
  const [city, setCity] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    void getAuthedClient()
      ?.onboarding()
      .then((data) => {
        setState(data);
        setCity(String(data.biodata.city ?? ""));
        setBio(String(data.biodata.bio ?? ""));
        setPhone(String(data.biodata.phone ?? ""));
      })
      .catch(() => undefined);
  }, []);

  async function saveStep(complete?: boolean) {
    const api = await getAuthedClient();
    if (!api || !state) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.updateOnboarding({
        step: Math.min((state.progress.step ?? 0) + 1, 6),
        biodata: { city, bio, phone },
        complete,
      });
      if (result.progress.completed || complete) {
        await refresh();
        router.replace("/(tabs)");
        return;
      }
      const next = await api.onboarding();
      setState(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  if (!state) return <LoadingView />;

  const completeness = state.progress.completeness;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Complete your profile</Text>
      <Text style={styles.subtitle}>
        Step {(state.progress.step ?? 0) + 1} · {completeness}% complete (need {state.progress.minCompleteness}%)
      </Text>

      <Text style={styles.label}>City</Text>
      <TextInput value={city} onChangeText={setCity} style={styles.input} />

      <Text style={styles.label}>Phone</Text>
      <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={styles.input} />

      <Text style={styles.label}>Bio</Text>
      <TextInput value={bio} onChangeText={setBio} multiline style={[styles.input, styles.textarea]} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={[styles.button, busy && styles.buttonDisabled]} disabled={busy} onPress={() => saveStep(false)}>
        <Text style={styles.buttonText}>Save & continue</Text>
      </Pressable>

      {completeness >= state.progress.minCompleteness ? (
        <Pressable style={[styles.buttonOutline, busy && styles.buttonDisabled]} disabled={busy} onPress={() => saveStep(true)}>
          <Text style={styles.buttonOutlineText}>Finish onboarding</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.screen, paddingTop: 48, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "600", color: colors.ink },
  subtitle: { marginTop: 8, fontSize: 14, color: colors.inkMuted },
  label: { marginTop: 20, fontSize: 11, color: colors.inkMuted, textTransform: "uppercase", letterSpacing: 1 },
  input: { marginTop: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", padding: 12, fontSize: 16 },
  textarea: { minHeight: 120, textAlignVertical: "top" },
  error: { marginTop: 12, color: colors.vermilion },
  button: { marginTop: 24, backgroundColor: colors.vermilion, padding: 14 },
  buttonOutline: { marginTop: 12, borderWidth: 1, borderColor: colors.vermilion, padding: 14 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  buttonOutlineText: { color: colors.vermilion, textAlign: "center", fontWeight: "600" },
});
