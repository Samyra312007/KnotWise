import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { getAuthedClient, runWithAuthedClient } from "@/lib/api";
import { LoadingView } from "@/components/LoadingView";
import { colors, spacing } from "@/lib/theme";

export default function ProfileEditScreen() {
  const [bio, setBio] = React.useState("");
  const [city, setCity] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    void runWithAuthedClient((api) => api.profile())
      .then((data) => {
        if (!data) {
          setLoaded(true);
          return;
        }
        setBio(String(data.profile.bio ?? ""));
        setCity(String(data.profile.city ?? ""));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function save() {
    const api = await getAuthedClient();
    if (!api) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await api.updateProfile({ bio: bio.trim(), city: city.trim() });
      if (result.pendingRevision) {
        setMessage("Some fields were queued for matchmaker review.");
      } else {
        setMessage("Profile updated.");
      }
      setTimeout(() => router.back(), 800);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return <LoadingView />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>City</Text>
      <TextInput value={city} onChangeText={setCity} style={styles.input} />
      <Text style={styles.label}>Bio</Text>
      <TextInput value={bio} onChangeText={setBio} multiline style={[styles.input, styles.textarea]} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Pressable style={[styles.button, busy && styles.buttonDisabled]} disabled={busy} onPress={save}>
        <Text style={styles.buttonText}>{busy ? "Saving…" : "Save changes"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.screen },
  label: { marginTop: 16, fontSize: 11, color: colors.inkMuted, textTransform: "uppercase", letterSpacing: 1 },
  input: { marginTop: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", padding: 12, fontSize: 16 },
  textarea: { minHeight: 120, textAlignVertical: "top" },
  message: { marginTop: 16, fontSize: 14, color: colors.inkWarm },
  button: { marginTop: 24, backgroundColor: colors.vermilion, padding: 14 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
