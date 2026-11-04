import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import {
  DemoNote,
  Icon,
  type IconName,
  Muted,
  Page,
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
      <View style={layout.header}>
        <View style={layout.copy}>
          <Txt accessibilityRole="header" style={layout.title}>{name.trim() || "Demo user"}</Txt>
          <Muted>Settings · ACME Traders</Muted>
        </View>
      </View>
      <Page style={layout.page}>
        {Object.keys(settings).filter(isSetting).map((id) => (
          <SettingsRow
            key={id}
            title={settings[id].title}
            description={id === "display" ? `Body text size · ${Math.round(scale * 100)}%` : settings[id].description}
            icon={settings[id].icon}
            onPress={() => router.push(id === "sign-in" ? "/sign-in" : { pathname: "/settings/[id]", params: { id } })}
          />
        ))}
        <View style={layout.footer}><DemoNote /></View>
      </Page>
    </>
  );
}

const layout = StyleSheet.create({
  header: { width: "100%", maxWidth: 640, alignSelf: "center", paddingHorizontal: 24, paddingVertical: 16 },
  title: { fontSize: 24, lineHeight: 32, fontWeight: "600" },
  page: { gap: 0, paddingTop: 0, paddingHorizontal: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 16, minHeight: 76, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12 },
  icon: { width: 32, alignItems: "center" },
  copy: { flex: 1, gap: 3 },
  pressed: { backgroundColor: c.surface },
  footer: { paddingHorizontal: 12, marginTop: 12 },
});
