import * as React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { colors, spacing } from "@/lib/theme";
import { createMobileClient } from "@/lib/api";

export default function LoginScreen() {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  async function submit() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setBusy(true);
    setError("");
    try {
      await createMobileClient().requestMagicLink(trimmed);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>KnotWise</Text>
      <Text style={styles.subtitle}>Sign in with a magic link sent to your email.</Text>

      {sent ? (
        <Text style={styles.success}>Check your email and open the link on this device, or paste the token on the verify screen.</Text>
      ) : (
        <>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={[styles.button, busy && styles.buttonDisabled]} disabled={busy} onPress={submit}>
            <Text style={styles.buttonText}>{busy ? "Sending…" : "Send magic link"}</Text>
          </Pressable>
          <Link href="/verify" asChild>
            <Pressable style={styles.secondary}>
              <Text style={styles.secondaryText}>Already have a token? Verify</Text>
            </Pressable>
          </Link>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, padding: spacing.screen, paddingTop: 80 },
  title: { fontSize: 32, fontWeight: "600", color: colors.ink },
  subtitle: { marginTop: 12, fontSize: 15, color: colors.inkMuted, lineHeight: 22 },
  input: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    padding: 14,
    fontSize: 16,
  },
  button: { marginTop: 16, backgroundColor: colors.vermilion, padding: 14 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", textAlign: "center", fontSize: 15, fontWeight: "600" },
  error: { marginTop: 12, color: colors.vermilion, fontSize: 14 },
  success: { marginTop: 32, fontSize: 15, color: colors.inkWarm, lineHeight: 22 },
  secondary: { marginTop: 20, paddingVertical: 8 },
  secondaryText: { color: colors.inkMuted, fontSize: 14, textAlign: "center" },
});
