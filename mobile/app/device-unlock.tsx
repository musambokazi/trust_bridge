import React, { useState } from "react";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Heading, Input, Muted, Page, ScreenHeader, Txt } from "../src/components/ui";
import { useAuth } from "../src/backend/AuthState";
import { useDeviceSecurity } from "../src/security/DeviceSecurity";

export default function DeviceUnlock() {
  const { session } = useAuth();
  const { unlockWithPassword } = useDeviceSecurity();
  const [password, setPassword] = useState(""), [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  if (!session) return <Redirect href="/sign-in" />;
  async function unlock() {
    if (busy || !password) return;
    setBusy(true); setNotice("");
    try { await unlockWithPassword(password); setPassword(""); router.replace("/"); }
    catch (error) { setPassword(""); setNotice(error instanceof Error ? error.message : "Unable to unlock."); }
    finally { setBusy(false); }
  }
  return <SafeAreaView style={{ flex: 1 }}>
    <ScreenHeader back title="Unlock account" />
    <Page>
      <Heading>Confirm your password.</Heading>
      <Muted>{session.user.email}</Muted>
      <Muted>This alternative needs an internet connection. It preserves your saved workspace and pending checks.</Muted>
      <Input dark captureSensitive label="Account password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" autoCapitalize="none" returnKeyType="go" onSubmitEditing={() => { void unlock(); }} />
      <Button title="Unlock account" loading={busy} onPress={() => { void unlock(); }} />
      {!!notice && <Txt accessibilityRole="alert">{notice}</Txt>}
    </Page>
  </SafeAreaView>;
}
