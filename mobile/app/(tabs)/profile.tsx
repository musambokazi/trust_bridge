import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import {
  Button,
  DemoNote,
  Eyebrow,
  Heading,
  Icon,
  Input,
  Muted,
  Page,
  ScreenHeader,
  SectionTitle,
  Txt,
  styles,
} from "../../src/components/ui";
import { useDemo } from "../../src/state/DemoState";
import { color as c } from "../../src/theme";
const info: Record<string, { title: string; body: string }> = {
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
export default function Profile() {
  const { name, setName, scale, setScale, reset } = useDemo();
  const [open, setOpen] = useState<string | null>(null),
    [resetConfirm, setResetConfirm] = useState(false);
  return (
    <>
      <ScreenHeader />
      <Page>
        <View style={{ gap: 12 }}>
          <Eyebrow>YOUR WORKSPACE, YOUR WAY</Eyebrow>
          <Heading>Make yourself{"\n"}at home.</Heading>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 15,
            paddingVertical: 7,
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 20,
              backgroundColor: c.orange,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Txt style={{ color: c.ink, fontSize: 23, fontWeight: "600" }}>
              {name.charAt(0).toUpperCase() || "T"}
            </Txt>
          </View>
          <View style={{ gap: 4 }}>
            <Txt style={{ fontSize: 21, fontWeight: "600" }}>
              {name || "Demo user"}
            </Txt>
            <Muted>ACME Traders · Demo member</Muted>
          </View>
        </View>
        <View style={styles.paper}>
          <Input
            label="Preview display name"
            value={name}
            onChangeText={setName}
            maxLength={40}
            autoComplete="off"
          />
          <Txt style={styles.mutedOnPaper}>
            Changes apply to this session only.
          </Txt>
        </View>
        <View>
          <SectionTitle title="Reading & display" />
          <Muted>Adjust the body text to suit you.</Muted>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 16,
            }}
          >
            <Button
              secondary
              title="A−"
              disabled={scale <= 0.85}
              onPress={() =>
                setScale(Math.max(0.85, +(scale - 0.05).toFixed(2)))
              }
            />
            <Txt accessibilityLiveRegion="polite">
              {Math.round(scale * 100)}%
            </Txt>
            <Button
              secondary
              title="A+"
              disabled={scale >= 1.3}
              onPress={() =>
                setScale(Math.min(1.3, +(scale + 0.05).toFixed(2)))
              }
            />
          </View>
        </View>
        <View>
          <SectionTitle title="Workspace & information" />
          {Object.entries(info).map(([key, item]) => (
            <View
              key={key}
              style={{ borderBottomWidth: 1, borderColor: c.line }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open === key }}
                onPress={() => setOpen(open === key ? null : key)}
                style={{
                  minHeight: 66,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Txt>{item.title}</Txt>
                <Icon
                  name={open === key ? "chevron-up" : "chevron-forward"}
                  color={c.muted}
                  size={16}
                />
              </Pressable>
              {open === key && (
                <View style={{ paddingBottom: 20 }}>
                  <Muted>{item.body}</Muted>
                </View>
              )}
            </View>
          ))}
        </View>
        <Button
          secondary
          title="View sign-in design"
          icon="arrow-forward"
          onPress={() => router.push("/sign-in")}
        />
        {resetConfirm ? (
          <View style={{ gap: 14 }}>
            <Txt>Remove checks created in this demo session?</Txt>
            <Button
              title="Reset demo checks"
              onPress={() => {
                reset();
                setResetConfirm(false);
              }}
            />
            <Button
              secondary
              title="Keep my checks"
              onPress={() => setResetConfirm(false)}
            />
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => setResetConfirm(true)}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Txt style={{ color: c.orange }}>Reset demo checks</Txt>
          </Pressable>
        )}
        <DemoNote />
      </Page>
    </>
  );
}
