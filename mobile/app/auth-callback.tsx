import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Heading, Input, Muted, Page, ScreenHeader, Txt } from "../src/components/ui";
import { supabase } from "../src/backend/client";

export default function Callback() {
  const url = Linking.useURL();
  const [notice, setNotice] = useState("Checking your email link…");
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!url) return;
    void (async () => {
      const parsed = new URL(url);
      const params = new URLSearchParams(parsed.hash.slice(1) || parsed.search.slice(1));
      const access = params.get("access_token"), refresh = params.get("refresh_token");
      if (!access || !refresh) { setNotice("This link is incomplete or expired. Request a new email from Sign in."); return; }
      const result = await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
      if (result.error) { setNotice("This link could not be verified. Request a new one."); return; }
      if (params.get("type") === "recovery") { setRecovery(true); setNotice(""); }
      else { setNotice("Email confirmed. Continue to sign in and finish account setup."); }
    })().catch(() => setNotice("Unable to process this link. Check your connection."));
  }, [url]);
  return <SafeAreaView style={{ flex: 1 }}>
    <ScreenHeader />
    <Page>
      <Heading>{recovery ? "Choose a new password" : "Email confirmation"}</Heading>
      {!!notice && <Txt accessibilityRole="alert">{notice}</Txt>}
      {recovery && <>
        <Input dark label="New password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
        <Input dark label="Confirm new password" value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" />
        <Muted>At least 8 characters, uppercase and lowercase letters, a number and a special character.</Muted>
        <Button title="Save password" loading={busy} onPress={async () => {
          if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^\p{L}\p{N}\s]/u.test(password) || password !== confirm) { setNotice("Meet all password requirements and make both fields match."); return; }
          setBusy(true);
          try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setPassword(""); setConfirm(""); setRecovery(false); setNotice("Password changed.");
          } catch { setNotice("Could not change the password. Request a new reset link."); }
          finally { setBusy(false); }
        }} />
      </>}
      <Button secondary title="Continue to account" onPress={() => router.replace("/sign-in")} />
    </Page>
  </SafeAreaView>;
}
