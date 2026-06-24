import * as React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors, spacing } from "@/lib/theme";

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const { signIn } = useAuth();
  const [token, setToken] = React.useState(params.token ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (params.token && typeof params.token === "string") {
      void verify(params.token);
    }
  }, [params.token]);

  async function verify(value?: string) {
    const magicToken = (value ?? token).trim();
    if (!magicToken) return;
    setBusy(true);
    setError("");
    try {
      await signIn(magicToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired link.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify sign-in</Text>
      <Text style={styles.subtitle}>Paste the token from your magic link email if it did not open automatically.</Text>
      <TextInput
        value={token}
        onChangeText={setToken}
        placeholder="Magic link token"
        autoCapitalize="none"
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={[styles.button, busy && styles.buttonDisabled]} disabled={busy} onPress={() => verify()}>
        <Text style={styles.buttonText}>{busy ? "Verifying…" : "Continue"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, padding: spacing.screen, paddingTop: 80 },
  title: { fontSize: 28, fontWeight: "600", color: colors.ink },
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
});
