import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Icon, Input, Muted, Page, Txt } from "../../src/components/ui";
import { isSetting, settingDetails, settings } from "../../src/settings";
import { useDemo } from "../../src/state/DemoState";
import { color as c } from "../../src/theme";

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/profile");
}

export default function SettingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { name, setName, scale, setScale, reset } = useDemo();
  if (!isSetting(id)) return <Redirect href="/profile" />;
  if (id === "sign-in") return <Redirect href="/sign-in" />;
  if (id === "welcome") return <Redirect href="/welcome" />;
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
        {"body" in setting && <Muted>{setting.body}</Muted>}
        {id === "account" && (
          <>
            <Input dark label="Preview display name" value={name} onChangeText={setName} maxLength={40} autoComplete="off" />
            <Muted>Changes apply to this session only.</Muted>
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
        {id === "reset" && (
          <>
            <Muted>Remove checks created in this demo session?</Muted>
            <Button title="Confirm reset" onPress={() => { reset(); goBack(); }} />
            <Button secondary title="Keep my checks" onPress={goBack} />
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
  section: { gap: 6, borderTopWidth: 1, borderColor: c.line, paddingTop: 16 },
  sectionTitle: { fontWeight: "600" },
  scale: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
});
