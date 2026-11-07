import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuth } from "../backend/AuthState";
import { router, usePathname } from "expo-router";
import { secureStorage, supabase } from "../backend/client";
import { captureScopes } from "./capture";
import { color as c } from "../theme";

type Security = { enabled: boolean; busy: boolean; message: string; setEnabled: (enabled: boolean) => Promise<void>; unlockWithPassword: (password: string) => Promise<void> };
const Context = createContext<Security>({ enabled: false, busy: false, message: "", setEnabled: async () => {}, unlockWithPassword: async () => {} });
export const useDeviceSecurity = () => useContext(Context);

export function DeviceSecurity({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const pathname = usePathname();
  const uid = session?.user.id;
  const currentUid = useRef(uid);
  currentUid.current = uid;
  const [state, setState] = useState<{ uid?: string; loaded: boolean; enabled: boolean; locked: boolean }>({ loaded: false, enabled: false, locked: false });
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const prompting = useRef(false);
  const owner = useRef<ReturnType<typeof captureScopes.acquire> | null>(null);
  useEffect(() => {
    let cancelled = false;
    setMessage("");
    if (!uid) { setState({ loaded: true, enabled: false, locked: false }); return; }
    void secureStorage.getItem("biometric-" + uid).then((value) => {
      if (!cancelled) setState({ uid, loaded: true, enabled: value === "enabled", locked: value === "enabled" });
    }).catch(() => {
      // Do not silently bypass a saved lock when device storage cannot be read.
      if (!cancelled) { setState({ uid, loaded: true, enabled: true, locked: true }); setMessage("Unable to read device preferences. Unlock to continue."); }
    });
    return () => { cancelled = true; };
  }, [uid]);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (next) => {
      // Native biometric prompts can themselves make iOS inactive. They must
      // not cause a recursive prompt or re-lock after a successful confirmation.
      if (next === "background") {
        setState((old) => old.enabled ? { ...old, locked: true } : old);
      }
    });
    return () => listener.remove();
  }, []);
  useEffect(() => () => {
    if (Platform.OS === "android") void LocalAuthentication.cancelAuthenticate().catch(() => {});
    void owner.current?.release().catch(() => {});
    owner.current = null;
  }, []);

  const confirm = useCallback(async () => {
    if (Platform.OS === "web") throw Error("Biometric unlock is available in the installed mobile app.");
    if (!await LocalAuthentication.hasHardwareAsync() || !await LocalAuthentication.isEnrolledAsync()) {
      throw Error("Set up a fingerprint or Face ID in your device settings first.");
    }
    const scope = captureScopes.acquire();
    owner.current = scope;
    try {
      await scope.ready;
      if (owner.current !== scope) throw Error("Confirmation cancelled.");
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock TrustBridge",
        promptDescription: "Confirm your identity on this device.",
        cancelLabel: "Cancel",
        disableDeviceFallback: true,
        fallbackLabel: "",
        biometricsSecurityLevel: "strong",
        requireConfirmation: true,
      });
      if (!result.success) throw Error("Biometric confirmation was not completed. Try again, or sign in with your password.");
    } finally {
      await scope.release();
      if (owner.current === scope) owner.current = null;
    }
  }, []);

  async function run(change?: boolean) {
    if (prompting.current || !uid) return;
    const account = uid;
    prompting.current = true; setBusy(true); setMessage("");
    try {
      await confirm();
      if (currentUid.current !== account) return;
      if (change !== undefined) await secureStorage.setItem("biometric-" + account, change ? "enabled" : "disabled");
      setState((old) => ({ ...old, uid: account, loaded: true, enabled: change ?? old.enabled, locked: AppState.currentState === "background" }));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to confirm identity."); }
    finally { prompting.current = false; setBusy(false); }
  }
  // No UI waits for native capture protection after the prompt: finally releases
  // it on success, cancellation, error and unsupported-device paths.
  const waiting = !!uid && (state.uid !== uid || !state.loaded);
  const locked = !!uid && state.uid === uid && state.locked && pathname !== "/device-unlock";
  async function unlockWithPassword(password: string) {
    const account = uid, email = session?.user.email;
    if (!account || !email) throw Error("Sign in again to continue.");
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error || result.data.user?.id !== account || currentUid.current !== account) throw Error("Could not confirm your password. Check your connection and try again.");
    setState((old) => ({ ...old, locked: AppState.currentState === "background" }));
  }
  return <Context.Provider value={{ enabled: state.uid === uid && state.enabled, busy, message, setEnabled: run, unlockWithPassword }}>
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }} accessibilityElementsHidden={waiting || locked} importantForAccessibility={waiting || locked ? "no-hide-descendants" : "auto"} pointerEvents={waiting || locked ? "none" : "auto"}>
        {children}
      </View>
      {(waiting || locked) && <View style={styles.lock} accessibilityViewIsModal>
        <Text style={styles.title}>{waiting ? "Opening your account…" : "TrustBridge is locked"}</Text>
        {!waiting && <>
          <Text style={styles.body}>Use your enrolled fingerprint or Face ID to open your saved workspace. This works offline.</Text>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => { void run(); }} style={styles.button}><Text style={styles.buttonText}>{busy ? "Confirming…" : "Unlock with biometrics"}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push("/device-unlock")} style={{ padding: 14 }}><Text style={styles.body}>Use account password instead (internet required)</Text></Pressable>
          <Text style={styles.body}>Your pending checks remain on this device. Unlocking does not discard them.</Text>
          {!!message && <Text accessibilityRole="alert" style={styles.body}>{message}</Text>}
        </>}
      </View>}
    </View>
  </Context.Provider>;
}
const styles = StyleSheet.create({
  lock: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: c.bg, justifyContent: "center", padding: 28, gap: 22 },
  title: { color: c.white, fontSize: 28, fontWeight: "600" },
  body: { color: c.muted, fontSize: 15, lineHeight: 23 },
  button: { backgroundColor: c.orange, borderRadius: 15, padding: 18 },
  buttonText: { color: c.ink, fontSize: 16, fontWeight: "700", textAlign: "center" },
});
