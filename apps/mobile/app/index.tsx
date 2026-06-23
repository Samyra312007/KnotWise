import * as React from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import * as SecureStore from "expo-secure-store";
import { createApiClient } from "@knotwise/api-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export default function HomeScreen() {
  const [token, setToken] = React.useState<string | null>(null);
  const [username, setUsername] = React.useState("riya");
  const [password, setPassword] = React.useState("password123");
  const [customers, setCustomers] = React.useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [clientMatches, setClientMatches] = React.useState<Array<{ id: string; status: string }>>([]);
  const [mode, setMode] = React.useState<"matchmaker" | "client">("matchmaker");

  React.useEffect(() => {
    SecureStore.getItemAsync("kw_token").then(setToken);
  }, []);

  async function loginMatchmaker() {
    const client = createApiClient({ baseUrl: API_URL });
    const { token: t } = await client.login(username, password);
    await SecureStore.setItemAsync("kw_token", t);
    setToken(t);
    setMode("matchmaker");
    const data = await createApiClient({ baseUrl: API_URL, token: t }).customers();
    setCustomers(data.items);
  }

  return (
    <View style={{ flex: 1, padding: 24, paddingTop: 48 }}>
      {!token ? (
        <>
          <Text style={{ fontSize: 24, marginBottom: 16 }}>KnotWise Mobile</Text>
          <TextInput value={username} onChangeText={setUsername} placeholder="Username" style={{ borderWidth: 1, marginBottom: 8, padding: 8 }} />
          <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={{ borderWidth: 1, marginBottom: 16, padding: 8 }} />
          <Pressable onPress={loginMatchmaker} style={{ backgroundColor: "#c41e1e", padding: 12 }}>
            <Text style={{ color: "white", textAlign: "center" }}>Sign in (matchmaker)</Text>
          </Pressable>
        </>
      ) : mode === "matchmaker" ? (
        <>
          <Text style={{ fontSize: 20, marginBottom: 12 }}>Customers</Text>
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Text style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: "#eee" }}>
                {item.firstName} {item.lastName}
              </Text>
            )}
          />
        </>
      ) : (
        <FlatList
          data={clientMatches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Text>{item.status}</Text>}
        />
      )}
    </View>
  );
}
