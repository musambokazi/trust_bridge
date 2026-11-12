import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { createClient, processLock } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

// Native sessions and account caches remain in OS-backed encrypted storage.
// Web uses sessionStorage so closing the browser session removes credentials.
const keyFor = (key: string) => key.replace(/[^a-zA-Z0-9._-]/g, "_");
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    key = keyFor(key);
    if (Platform.OS === "web") return typeof sessionStorage === "undefined" ? null : sessionStorage.getItem(key);
    const pointer = await SecureStore.getItemAsync(key);
    if (!pointer) return null;
    const [generation, countText] = pointer.split(":");
    const count = Number(countText);
    if (!generation || !Number.isInteger(count) || count < 1 || count > 500) throw Error("Saved secure storage is unreadable; existing data has been preserved.");
    const chunks = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${generation}.${i}`)));
    if (chunks.some(chunk => chunk === null)) throw Error("Saved secure storage is incomplete; existing data has been preserved.");
    return chunks.join("");
  },
  async setItem(key: string, value: string): Promise<void> {
    key = keyFor(key);
    if (Platform.OS === "web") { sessionStorage.setItem(key, value); return; }
    if (value.length > 400000) throw Error("Device cache is full. Connect and sync before adding more checks.");
    const old = await SecureStore.getItemAsync(key);
    const generation = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const chunks = value.match(/[\s\S]{1,900}/g) ?? [""];
    try {
      for (let i = 0; i < chunks.length; i++) {
        await SecureStore.setItemAsync(`${key}.${generation}.${i}`, chunks[i]!, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
      }
      await SecureStore.setItemAsync(key, `${generation}:${chunks.length}`, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    } catch (error) {
      await Promise.all(chunks.map((_, i) => SecureStore.deleteItemAsync(`${key}.${generation}.${i}`)));
      throw error;
    }
    if (old) {
      const [oldGeneration, count] = old.split(":");
      await Promise.all(Array.from({ length: Math.min(500, Number(count) || 0) }, (_, i) => SecureStore.deleteItemAsync(`${key}.${oldGeneration}.${i}`)));
    }
  },
  async removeItem(key: string): Promise<void> {
    key = keyFor(key);
    if (Platform.OS === "web") { sessionStorage.removeItem(key); return; }
    const old = await SecureStore.getItemAsync(key);
    await SecureStore.deleteItemAsync(key);
    if (old) {
      const [generation, count] = old.split(":");
      await Promise.all(Array.from({ length: Math.min(500, Number(count) || 0) }, (_, i) => SecureStore.deleteItemAsync(`${key}.${generation}.${i}`)));
    }
  },
};
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { storage: secureStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false, lock: processLock },
  global: { fetch: async (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try { return await fetch(input, { ...init, signal: controller.signal }); }
    finally { clearTimeout(timer); }
  } },
});
