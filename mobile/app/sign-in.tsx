import React, { useRef, useState } from "react";
import { Pressable, TextInput, View, Platform } from "react-native";
import { router } from "expo-router";
import { AuthFrame, auth } from "../src/auth/AuthFrame";
import * as Linking from "expo-linking";
import { Button, Icon, Input, Muted, Txt } from "../src/components/ui";
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
    <AuthFrame
      eyebrow="VERIFY BEFORE YOU PAY"
      title={session ? "One last step." : "Welcome\nback."}
      description={session ? "Finish your details to open your workspace." : "Your suppliers. Your checks. One clear place."}
      action={!session ? { label: "Sign up", accessibilityLabel: "Create an account", onPress: () => router.push("/sign-up") } : undefined}
    >
      <Txt style={auth.formTitle}>{session ? "Finish setting up your account." : "Sign in to your workspace"}</Txt>
      {!!message && <Txt style={auth.notice}>{message}</Txt>}
      {session ? <>
        <Muted>You are signed in as {session.user.email}. Complete your profile and workspace to continue.</Muted>
        <Button title="Finish saved registration" loading={busy} onPress={async () => {
          setBusy(true);
          try { await finish(); if (profile && workspace) router.replace("/"); else setNotice("If setup is still incomplete, select Complete account details."); }
          catch (error) { setNotice(error instanceof Error ? error.message : "Unable to finish setup."); }
          finally { setBusy(false); }
        }} />
        <Button secondary title="Complete account details" onPress={() => router.push("/sign-up")} />
        <Button secondary title="Sign out" onPress={() => { void signOut().catch(() => setNotice("Unable to sign out.")); }} />
      </> : <>
        <View style={auth.fields}>
          <Input dark label="Email address" placeholder="you@company.co.za" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => pass.current?.focus()} />
          <Input ref={pass} dark label="Password" placeholder="Enter your password" value={password} onChangeText={setPassword} autoCapitalize="none" autoComplete="current-password" captureSensitive secureTextEntry={!visible} returnKeyType="go" onSubmitEditing={login}
            suffix={<Pressable onPointerDown={event=>{if(Platform.OS==="web")event.preventDefault();}} accessibilityRole="button" accessibilityLabel={visible ? "Hide password" : "Show password"} onPress={() => { pass.current?.focus(); setVisible(!visible); }} style={{ padding: 12 }}><Icon name={visible ? "eye-off-outline" : "eye-outline"} /></Pressable>}
          />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Forgot password?" disabled={busy} onPress={() => { void resetPassword(); }} style={{ alignSelf: "flex-end", minHeight: 44, justifyContent: "center", marginTop: -12 }}><Txt style={{ fontSize: 13 }}>Forgot password?</Txt></Pressable>
        <Button title="Sign in" icon="arrow-forward" loading={busy} onPress={login} />
        <View style={auth.footer}><Muted>New to TrustBridge?</Muted><Pressable accessibilityRole="button" accessibilityLabel="Go to sign up" onPress={() => router.push("/sign-up")} style={auth.footerLink}><Txt style={auth.footerLinkText}>Create an account</Txt></Pressable></View>
        <Txt style={auth.footnote}>First sign-in needs a connection. Your saved workspace stays available offline afterwards.</Txt>
      </>}
      {!!notice && <Txt accessibilityRole="alert" style={auth.notice}>{notice}</Txt>}
    </AuthFrame>
  );
}
