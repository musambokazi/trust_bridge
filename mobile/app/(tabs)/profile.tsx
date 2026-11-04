import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import {
  DemoNote,
  Icon,
  type IconName,
  Muted,
  Page,
  ScreenHeader,
  Txt,
} from "../../src/components/ui";
import { useDemo } from "../../src/state/DemoState";
import { color as c } from "../../src/theme";
import { settings, isSetting } from "../../src/settings";

function SettingsRow({
  title, description, icon, onPress,
}: {
  title: string;
  description: string;
  icon: IconName;
  onPress: () => void;
}) {
  const { scale } = useDemo();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      onPress={onPress}
      style={({ pressed }) => [layout.row, pressed && layout.pressed]}
    >
      <View style={layout.icon}>
        <Icon name={icon} color={c.muted} />
      </View>
      <View style={layout.copy}>
        <Txt style={{ fontSize: 17 * scale, lineHeight: 23 * scale }}>
          {title}
        </Txt>
        <Muted>{description}</Muted>
      </View>
      <Icon name="chevron-forward" size={16} color={c.muted} />
    </Pressable>
  );
}

export default function Profile() {
  const { name, scale } = useDemo();
  return (
    <>
      <ScreenHeader />
      <Page style={layout.page}>
        <View style={layout.profile}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profile photo options"
            onPress={() => router.push({ pathname: "/settings/[id]", params: { id: "account" } })}
            style={layout.avatar}
          >
            <Icon name="person-outline" color={c.orange} size={28} />
            <View style={layout.camera}><Icon name="camera-outline" color={c.ink} size={14} /></View>
          </Pressable>
          <View style={layout.copy}>
            <Txt accessibilityRole="header" style={layout.title}>{name.trim() || "Demo user"}</Txt>
            <Txt style={{ color: c.orange }}>@demo-member</Txt>
            <Muted>member@example.com</Muted>
            <Muted>ACME Traders · Preview profile</Muted>
          </View>
        </View>
        {Object.keys(settings).filter(isSetting).map((id) => (
          <SettingsRow
            key={id}
            title={settings[id].title}
            description={id === "display" ? `Body text size · ${Math.round(scale * 100)}%` : settings[id].description}
            icon={settings[id].icon}
            onPress={() => router.push(id === "sign-in" ? "/sign-in" : id === "welcome" ? "/welcome" : { pathname: "/settings/[id]", params: { id } })}
          />
        ))}
        <View style={layout.footer}><DemoNote /></View>
      </Page>
    </>
  );
}

const layout = StyleSheet.create({
  profile: { flexDirection: "row", alignItems: "center", gap: 16, margin: 12, marginBottom: 18, padding: 16, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: 20 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" },
  camera: { position: "absolute", right: -3, bottom: -3, width: 24, height: 24, borderRadius: 12, backgroundColor: c.orange, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "600" },
  page: { gap: 0, paddingTop: 0, paddingHorizontal: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 16, minHeight: 76, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12 },
  icon: { width: 32, alignItems: "center" },
  copy: { flex: 1, gap: 3 },
  pressed: { backgroundColor: c.surface },
  footer: { paddingHorizontal: 12, marginTop: 12 },
});
