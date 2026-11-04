import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import {
  Button,
  DemoNote,
  Icon,
  type IconName,
  Input,
  Muted,
  Page,
  Txt,
} from "../../src/components/ui";
import { useDemo } from "../../src/state/DemoState";
import { color as c } from "../../src/theme";
const info = {
  workspace: {
    title: "Your workspace",
    body: "ACME Traders is a fictional workspace. This UI demonstrates an organisation-specific supplier directory and assessment history. Team invitations, organisation membership and role-based permissions will be supplied by the backend team.",
  },
  privacy: {
    title: "Privacy in this preview",
    body: "This preview uses fictional supplier records. Inputs and newly created demo results stay in memory for the current session and disappear when the app reloads. Do not enter real bank details, passwords or personal information. There is no analytics collection or connection to a verification service in this UI. The production privacy policy, retention rules and deletion process must be agreed before launch.",
  },
  security: {
    title: "Security & access",
    body: "Live authentication and permissions are not connected. Production invoice assessments must run on the backend. The team’s integration needs server-side input validation, organisation isolation using RLS, authorised supplier updates and audit logging. This UI does not certify any of those controls as implemented.",
  },
  about: {
    title: "About TrustBridge",
    body: "TrustBridge helps businesses compare invoice details with approved supplier reference records, understand discrepancies and decide what to independently verify before payment. It does not prove fraud or guarantee an invoice is authentic. Frontend concept 0.1.0 · NEMISA hackathon.",
  },
};

function SettingsRow({
  title, description, icon, onPress, expanded,
}: {
  title: string;
  description: string;
  icon: IconName;
  onPress: () => void;
  expanded?: boolean;
}) {
  const { scale } = useDemo();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      onPress={onPress}
      style={({ pressed }) => [layout.row, pressed && layout.pressed]}
    >
      <View style={layout.icon}>
        <Icon name={icon} color={expanded ? c.orange : c.muted} />
      </View>
      <View style={layout.copy}>
        <Txt style={[{ fontSize: 17 * scale, lineHeight: 23 * scale }, expanded && layout.active]}>
          {title}
        </Txt>
        <Muted>{description}</Muted>
      </View>
    </Pressable>
  );
}

export default function Profile() {
  const { name, setName, scale, setScale, reset } = useDemo();
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (key: string) => setOpen((current) => current === key ? null : key);
  return (
    <>
      <View style={layout.header}>
        <View style={layout.copy}>
          <Txt accessibilityRole="header" style={layout.title}>{name.trim() || "Demo user"}</Txt>
          <Muted>Settings · ACME Traders</Muted>
        </View>
      </View>
      <Page style={layout.page}>
        <SettingsRow
          title="Account"
          description="Edit your preview display name"
          icon="person-outline"
          expanded={open === "account"}
          onPress={() => toggle("account")}
        />
        {open === "account" && (
          <View style={layout.details}>
            <Input
              dark
              label="Preview display name"
              value={name}
              onChangeText={setName}
              maxLength={40}
              autoComplete="off"
            />
            <Muted>Changes apply to this session only.</Muted>
          </View>
        )}
        {([
          ["workspace", "Organisation and team access", "business-outline"],
          ["privacy", "What this demo stores and shares", "lock-closed-outline"],
          ["security", "Authentication and permissions", "shield-checkmark-outline"],
        ] as const).map(([key, description, icon]) => (
          <React.Fragment key={key}>
            <SettingsRow title={info[key].title} description={description} icon={icon} expanded={open === key} onPress={() => toggle(key)} />
            {open === key && <View style={layout.details}><Muted>{info[key].body}</Muted></View>}
          </React.Fragment>
        ))}
        <SettingsRow
          title="Reading & display"
          description={`Body text size · ${Math.round(scale * 100)}%`}
          icon="text-outline"
          expanded={open === "display"}
          onPress={() => toggle("display")}
        />
        {open === "display" && (
          <View style={layout.details}>
            <View style={layout.scale}>
              <Button secondary title="A−" disabled={scale <= 0.85} onPress={() => setScale(Math.max(0.85, +(scale - 0.05).toFixed(2)))} />
              <Txt accessibilityLiveRegion="polite">{Math.round(scale * 100)}%</Txt>
              <Button secondary title="A+" disabled={scale >= 1.3} onPress={() => setScale(Math.min(1.3, +(scale + 0.05).toFixed(2)))} />
            </View>
          </View>
        )}
        <SettingsRow
          title="View sign-in design"
          description="Open the account preview"
          icon="log-in-outline"
          onPress={() => router.push("/sign-in")}
        />
        <SettingsRow
          title="Reset demo checks"
          description="Clear checks created in this session"
          icon="refresh-outline"
          expanded={open === "reset"}
          onPress={() => toggle("reset")}
        />
        {open === "reset" && (
          <View style={layout.details}>
            <Txt>Remove checks created in this demo session?</Txt>
            <Button title="Confirm reset" onPress={() => { reset(); setOpen(null); }} />
            <Button secondary title="Keep my checks" onPress={() => setOpen(null)} />
          </View>
        )}
        <SettingsRow
          title={info.about.title}
          description="What the app does and how to use the preview"
          icon="information-circle-outline"
          expanded={open === "about"}
          onPress={() => toggle("about")}
        />
        {open === "about" && <View style={layout.details}><Muted>{info.about.body}</Muted></View>}
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
  active: { color: c.orange },
  details: { paddingLeft: 60, paddingRight: 12, paddingBottom: 14, gap: 12 },
  scale: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  footer: { paddingHorizontal: 12, marginTop: 12 },
});
