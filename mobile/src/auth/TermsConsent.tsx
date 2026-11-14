import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Icon, Txt } from "../components/ui";
import { color as c } from "../theme";

export function TermsConsent({ accepted, onChange, disabled }: { accepted: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return <View style={s.group}>
    <View style={s.links}>
      <Pressable accessibilityRole="link" accessibilityLabel="Read Terms of Service" onPress={() => router.push("/settings/terms")} style={s.link}><Txt style={s.linkText}>Terms of Service</Txt></Pressable>
      <Pressable accessibilityRole="link" accessibilityLabel="Read Privacy Notice" onPress={() => router.push("/settings/privacy-notice")} style={s.link}><Txt style={s.linkText}>Privacy Notice</Txt></Pressable>
    </View>
    <Pressable accessibilityRole="checkbox" aria-checked={accepted} accessibilityLabel="I accept the Terms of Service and acknowledge the Privacy Notice" accessibilityHint="Required before creating your account." accessibilityState={{ checked: accepted, disabled: !!disabled }} disabled={disabled} onPress={() => onChange(!accepted)} style={({ pressed }) => [s.row, pressed && { opacity: 0.75 }, disabled && { opacity: 0.6 }]}>
      <View accessible={false} style={[s.box, accepted && s.checked]}>{accepted && <Icon name="checkmark" color={c.ink} size={17} />}</View>
      <Txt style={s.label}>I accept the Terms of Service and acknowledge the Privacy Notice.</Txt>
    </Pressable>
  </View>;
}
const s = StyleSheet.create({
  group: { gap: 4, borderTopWidth: 1, borderColor: c.line, paddingTop: 8, marginTop: 8 },
  links: { flexDirection: "row", flexWrap: "wrap", columnGap: 24 },
  link: { minHeight: 44, justifyContent: "center", paddingVertical: 8 },
  linkText: { color: c.orange, fontSize: 13, fontWeight: "600", textDecorationLine: "underline" },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12, minHeight: 52 },
  box: { width: 23, height: 23, borderRadius: 5, borderWidth: 1.5, borderColor: c.muted, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checked: { backgroundColor: c.orange, borderColor: c.orange },
  label: { flex: 1, fontSize: 13, lineHeight: 21, color: c.white },
});
