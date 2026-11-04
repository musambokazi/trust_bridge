import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Icon, Input, Muted, Page, Txt } from "../../src/components/ui";
import { isSetting, settingDetails, settings } from "../../src/settings";
import { legalDetails, legalDocuments, legalExamples } from "../../src/legal";
import { useDemo } from "../../src/state/DemoState";
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
  const { name, setName, scale, setScale } = useDemo();
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
            {legalExamples[id].map(([title, body]) => (
              <View key={title} style={layout.section}>
                <Txt accessibilityRole="header" style={layout.sectionTitle}>{title}</Txt>
                <Muted>{body}</Muted>
              </View>
            ))}
            {legalDocuments[id].map(([title, body], index) => (
              <View key={title} style={layout.section}>
                <Txt accessibilityRole="header" style={layout.sectionTitle}>{index + 1}. {title}</Txt>
                <Txt>{body}</Txt>
                <Muted>{legalDetails[id][index]}</Muted>
              </View>
            ))}
          </>
        )}
        {id === "account" && (
          <>
            <Input dark label="Preview display name" value={name} onChangeText={setName} maxLength={40} autoComplete="off" />
            <Muted>Sample username: @demo-member</Muted>
            <Muted>Sample email: member@example.com</Muted>
            <Muted>Display-name changes apply to this session only.</Muted>
          </>
        )}
        {id === "display" && (
          <>
            <Muted>Adjust the body text to suit you.</Muted>
            <View style={layout.scale}>
              <Button secondary title="A−" disabled={scale <= 0.85} onPress={() => setScale(Math.max(0.85, +(scale - 0.05).toFixed(2)))} />
              <Txt accessibilityLiveRegion="polite">{Math.round(scale * 100)}%</Txt>
              <Button secondary title="A+" disabled={scale >= 1.3} onPress={() => setScale(Math.min(1.3, +(scale + 0.05).toFixed(2)))} />
            </View>
            <Txt>Text preview: Review invoice details before making a payment.</Txt>
          </>
        )}
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
