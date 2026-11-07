import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Icon, Input, Muted, Page, Txt } from "../../src/components/ui";
import { isSetting, settingDetails, settings } from "../../src/settings";
import { legalDocuments } from "../../src/legal";
import { useAuth } from "../../src/backend/AuthState";
import { chooseAvatar } from "../../src/backend/avatar";
import { useDemo } from "../../src/state/DemoState";
import { useDeviceSecurity } from "../../src/security/DeviceSecurity";
import { color as c } from "../../src/theme";

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/profile");
}

function TextLink({ title, description, onPress }: { title: string; description: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={title}
      accessibilityHint={description}
      onPress={onPress}
      style={({ pressed }) => [layout.textLink, pressed && { opacity: 0.7 }]}
    >
      <Txt style={layout.linkLabel}>{title}</Txt>
      <Muted>{description}</Muted>
    </Pressable>
  );
}

export default function SettingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const security = useDeviceSecurity();
  const { scale, pendingCount } = useDemo();
  const { profile, session, workspace, saveProfile, signOut } = useAuth();
  const [first, setFirst] = useState(""), [last, setLast] = useState(""), [username, setUsername] = useState("");
  const [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => { setFirst(profile?.first_name ?? ""); setLast(profile?.last_name ?? ""); setUsername(profile?.username ?? ""); }, [profile?.id]);
  async function act(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setNotice("");
    try { await task(); setNotice("Saved to your account."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Unable to save."); }
    finally { setBusy(false); }
  }
  if (!isSetting(id)) return <Redirect href="/profile" />;
  const setting = settings[id];

  return (
    <SafeAreaView style={layout.screen}>
      <View style={layout.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={goBack} style={layout.back}>
          <Icon name="arrow-back" />
        </Pressable>
        <Txt accessibilityRole="header" style={layout.title}>{setting.title}</Txt>
      </View>
      <Page style={layout.page}>
        <Muted>{setting.description}</Muted>
        {id === "workspace" && (
          <>
            <TextLink title="Supplier directory" description="Browse the supplier references used for invoice checks." onPress={() => router.push("/suppliers")} />
            <TextLink title="Company or individual" description="See what each workspace type is for." onPress={() => router.push("/settings/workspace-type")} />
            <TextLink title="Team access" description="Learn how invitations and permissions work." onPress={() => router.push("/settings/team-access")} />
          </>
        )}
        {id === "privacy" && (
          <>
            <TextLink title="Privacy notice" description="See what information the app uses and what stays on your device." onPress={() => router.push("/settings/privacy-notice")} />
            <TextLink title="Terms of service" description="Understand how to use TrustBridge and interpret check results." onPress={() => router.push("/settings/terms")} />
          </>
        )}
        {(id === "privacy-notice" || id === "terms") && (
          <>
            <Txt>Draft · applies to the current app build only</Txt>
            {legalDocuments[id].map(([title, body], index) => (
              <View key={title} style={layout.section}>
                <Txt accessibilityRole="header" style={layout.sectionTitle}>{index + 1}. {title}</Txt>
                <Txt>{body}</Txt>
              </View>
            ))}
          </>
        )}
        {id === "account" && (
          <>
            <Input dark label="First name" value={first} onChangeText={setFirst} maxLength={100} />
            <Input dark label="Surname" value={last} onChangeText={setLast} maxLength={100} />
            <Input dark label="Username" value={username} onChangeText={setUsername} maxLength={30} autoCapitalize="none" />
            <Muted>{session?.user.email}</Muted>
            <Muted>{profile?.phone}</Muted>
            <Button title="Save profile" loading={busy} onPress={() => { void act(async () => {
              if (!first.trim() || !last.trim() || !/^[a-z0-9_]{3,30}$/.test(username)) throw Error("Enter your names and a valid lowercase username.");
              await saveProfile({ first_name: first.trim(), last_name: last.trim(), username });
            }); }} />
            <Button secondary title="Upload profile photo" disabled={busy || !session} onPress={() => { void act(async () => {
              if (!session) throw Error("Sign in first.");
              const path = await chooseAvatar(session.user.id);
              if (path) await saveProfile({ avatar_path: path });
            }); }} />
            <Muted>{workspace?.name} · {workspace?.kind}</Muted>
            <Button secondary title="Sign out on this device" disabled={busy} onPress={() => { void act(async () => {
              if (pendingCount) throw Error("Sync your pending checks before signing out so they are not lost.");
              await signOut(); router.replace("/sign-in");
            }); }} />
          </>
        )}
        {id === "security" && <>
          <Txt style={layout.sectionTitle}>Biometric unlock on this device</Txt>
          <Muted>{security.enabled ? "Enabled. Your saved account locks when the app goes into the background." : "Off. Enable fingerprint or Face ID to protect your saved account when reopening the app."}</Muted>
          <Button secondary title={security.enabled ? "Disable biometric unlock" : "Enable biometric unlock"} loading={security.busy} onPress={() => { void security.setEnabled(!security.enabled); }} />
          {!!security.message && <Txt accessibilityRole="alert">{security.message}</Txt>}
          <Muted>Only the system confirmation uses capture protection. Recording works normally again when confirmation closes. Biometrics stay with your device and are never sent to TrustBridge or Supabase.</Muted>
          <Muted>Password and confirm-password fields also block capture only while focused. Tap another field or dismiss the keyboard to restore recording. Web browsers do not offer this protection.</Muted>
        </>}
        {id === "display" && (
          <>
            <Muted>Adjust the body text to suit you.</Muted>
            <View style={layout.scale}>
              <Button secondary title="A−" disabled={busy || scale <= 0.85} onPress={() => { void act(() => saveProfile({ text_scale: Math.max(0.85, +(scale - 0.05).toFixed(2)) })); }} />
              <Txt accessibilityLiveRegion="polite">{Math.round(scale * 100)}%</Txt>
              <Button secondary title="A+" disabled={busy || scale >= 1.3} onPress={() => { void act(() => saveProfile({ text_scale: Math.min(1.3, +(scale + 0.05).toFixed(2)) })); }} />
            </View>
            <Txt>Sample text: Review invoice details before making a payment.</Txt>
          </>
        )}
        {!!notice && <Txt accessibilityRole="alert">{notice}</Txt>}
        {settingDetails[id]?.map(([title, body]) => (
          <View key={title} style={layout.section}>
            <Txt accessibilityRole="header" style={layout.sectionTitle}>{title}</Txt>
            <Muted>{body}</Muted>
          </View>
        ))}
      </Page>
    </SafeAreaView>
  );
}

const layout = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  header: { width: "100%", maxWidth: 640, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 21, lineHeight: 28, fontWeight: "600" },
  page: { paddingTop: 16, paddingBottom: 32 },
  textLink: { minHeight: 48, justifyContent: "center", gap: 4 },
  linkLabel: { fontWeight: "600" },
  section: { gap: 6, borderTopWidth: 1, borderColor: c.line, paddingTop: 16 },
  sectionTitle: { fontWeight: "600" },
  scale: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
});
