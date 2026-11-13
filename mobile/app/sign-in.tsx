import React, { useRef, useState } from "react";
import { Pressable, TextInput, View, Platform } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { Button, Heading, Icon, Input, Muted, Page, ScreenHeader, Txt } from "../src/components/ui";
import { useAuth } from "../src/backend/AuthState";
import { secureStorage, supabase } from "../src/backend/client";
import type { AccountDraft } from "../src/backend/types";

export default function SignIn() {
  const { session, profile, workspace, completeAccount, signOut, refresh, message } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const pass = useRef<React.ComponentRef<typeof TextInput>>(null);
  async function finish() {
    const saved = await secureStorage.getItem("registration-draft");
    if (saved) {
      const draft = JSON.parse(saved) as AccountDraft;
      const { data } = await supabase.auth.getUser();
      if (data.user?.email?.toLowerCase() === draft.email.toLowerCase()) await completeAccount(draft);
    }
    await refresh();
  }
  async function login() {
    if (busy) return;
    setBusy(true); setNotice("");
    try {
      const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setPassword("");
      if (result.error) throw Error("Unable to sign in. Check your credentials and confirm your email first.");
      const aal=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if(aal.data?.nextLevel==="aal2"&&aal.data.currentLevel!=="aal2"){router.replace("/two-factor");return;}
      await finish();
      router.replace("/");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to sign in."); }
    finally { setBusy(false); }
  }
  async function resetPassword() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setNotice("Enter your email address first."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: Linking.createURL("auth-callback") });
      setNotice(error ? "Could not request a reset. Try again later." : "If an account exists, check your email for the password reset link.");
    } catch { setNotice("Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenHeader title="Your account" />
      <Page>
        <Heading>{session ? "Finish setting up your account." : "Welcome back."}</Heading>
        {!!message && <Muted>{message}</Muted>}
        {session ? <>
          <Muted>You are signed in as {session.user.email}. A profile and workspace are required before you can continue.</Muted>
          <Button title="Finish saved registration" loading={busy} onPress={async () => {
            setBusy(true);
            try { await finish(); if (profile && workspace) router.replace("/"); else setNotice("If setup is still incomplete, select Complete account details."); }
            catch (error) { setNotice(error instanceof Error ? error.message : "Unable to finish setup."); }
            finally { setBusy(false); }
          }} />
          <Button secondary title="Complete account details" onPress={() => router.push("/sign-up")} />
          <Button secondary title="Sign out" onPress={() => { void signOut().catch(() => setNotice("Unable to sign out.")); }} />
        </> : <>
          <Input dark label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => pass.current?.focus()} />
          <Input ref={pass} dark label="Password" value={password} onChangeText={setPassword} autoCapitalize="none" autoComplete="current-password" captureSensitive secureTextEntry={!visible} returnKeyType="go" onSubmitEditing={login}
            suffix={<Pressable onPointerDown={event=>{if(Platform.OS==="web")event.preventDefault();}} accessibilityRole="button" accessibilityLabel={visible ? "Hide password" : "Show password"} onPress={() => { pass.current?.focus(); setVisible(!visible); }} style={{ padding: 12 }}><Icon name={visible ? "eye-off-outline" : "eye-outline"} /></Pressable>}
          />
          <Button title="Sign in" loading={busy} onPress={login} />
          <Button secondary title="Create an account" onPress={() => router.push("/sign-up")} />
          <Pressable accessibilityRole="button" onPress={() => { if (!busy) void resetPassword(); }} style={{ minHeight: 44, justifyContent: "center" }}><Txt>Forgot password?</Txt></Pressable>
          <Muted>First sign-in requires a connection. After sign-in, your last saved workspace can be opened offline on this device.</Muted>
        </>}
        {!!notice && <Txt accessibilityRole="alert">{notice}</Txt>}
      </Page>
    </SafeAreaView>
  );
}
