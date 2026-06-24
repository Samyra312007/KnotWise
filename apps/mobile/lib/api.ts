import * as SecureStore from "expo-secure-store";
import { createClientApi, type ClientApi, type ClientSessionInfo } from "@knotwise/api-client";

const TOKEN_KEY = "kw_client_token";
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

let unauthorizedHandler: (() => void) | undefined;

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

export async function getStoredToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function storeToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function createMobileClient(token?: string): ClientApi {
  return createClientApi({
    baseUrl: API_URL,
    token,
    onUnauthorized: () => unauthorizedHandler?.(),
  });
}

export async function getAuthedClient() {
  const token = await getStoredToken();
  if (!token) return null;
  return createMobileClient(token);
}

export async function runWithAuthedClient<T>(
  fn: (client: ClientApi) => Promise<T>
): Promise<T | undefined> {
  const client = await getAuthedClient();
  if (!client) return undefined;
  return fn(client);
}

export type { ClientSessionInfo };
