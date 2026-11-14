import React from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Brand, Txt } from "../components/ui";
import { color as c } from "../theme";

type Props = {
  title: string;
  description: string;
  eyebrow: string;
  back?: boolean;
  action?: { label: string; accessibilityLabel?: string; onPress: () => void };
  progress?: { current: number; total: number };
  children: React.ReactNode;
};

/** One scroll surface keeps the hero and focused fields together on small phones. */
export function AuthFrame({ title, description, eyebrow, back, action, progress, children }: Props) {
  const insets = useSafeAreaInsets();
  return <SafeAreaView edges={["top", "left", "right"]} style={auth.screen}>
    <KeyboardAvoidingView style={auth.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[auth.scroll, { paddingBottom: insets.bottom + 20 }]}>
        <View style={auth.canvas}>
          <View style={auth.bar}>
            <Brand />
            {action && <Pressable accessibilityRole="button" accessibilityLabel={action.accessibilityLabel ?? action.label} onPress={action.onPress} style={({ pressed }) => [auth.textAction, pressed && { opacity: 0.65 }]}><Txt style={auth.actionLabel}>{action.label}</Txt></Pressable>}
          </View>
          <View style={auth.hero}>
            <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={auth.orbit} />
            <View style={auth.heroTop}>
              <Txt style={auth.eyebrow}>{eyebrow}</Txt>
              {back && <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace("/sign-in")} style={auth.back}><Txt style={auth.backText}>Back</Txt></Pressable>}
            </View>
            <Txt accessibilityRole="header" style={auth.title}>{title}</Txt>
            <Txt style={auth.description}>{description}</Txt>
          </View>
          <View style={auth.body}>
            {progress && <View style={auth.progressBlock}>
              <View style={auth.progressText}><Txt style={auth.sectionLabel}>YOUR ACCOUNT</Txt><Txt accessibilityLiveRegion="polite" style={auth.step}>Step {progress.current} of {progress.total}</Txt></View>
              <View accessibilityRole="progressbar" accessibilityLabel="Account setup progress" accessibilityValue={{ min: 1, max: progress.total, now: progress.current, text: `Step ${progress.current} of ${progress.total}` }} style={auth.track}>
                {Array.from({ length: progress.total }, (_, index) => <React.Fragment key={index}>
                  <View accessible={false} style={[auth.stepCircle, index < progress.current && auth.stepCircleActive]}><Txt style={[auth.stepNumber, index < progress.current && { color: c.ink }]}>{index + 1}</Txt></View>
                  {index < progress.total - 1 && <View style={[auth.segment, index < progress.current - 1 && auth.segmentActive]} />}
                </React.Fragment>)}
              </View>
            </View>}
            {children}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export const auth = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: c.bg },
  scroll: { flexGrow: 1, alignItems: "center" },
  canvas: { width: "100%", maxWidth: 560, flexGrow: 1 },
  bar: { minHeight: 72, paddingHorizontal: 24, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  textAction: { minHeight: 44, justifyContent: "center", paddingLeft: 8 },
  actionLabel: { color: c.orange, fontSize: 13, fontWeight: "600" },
  hero: { backgroundColor: c.orange, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 44, minHeight: 214, overflow: "hidden", borderTopLeftRadius: 30, borderBottomRightRadius: 76, gap: 10 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  eyebrow: { color: c.ink, fontSize: 10, lineHeight: 16, letterSpacing: 1.8, fontWeight: "700", flex: 1, paddingRight: 54 },
  back: { position: "absolute", right: 0, top: -14, minHeight: 44, minWidth: 44, justifyContent: "center", alignItems: "flex-end" },
  backText: { color: c.ink, fontSize: 13, fontWeight: "600" },
  title: { color: c.ink, fontSize: 38, lineHeight: 40, letterSpacing: -1.6, fontWeight: "700", maxWidth: 440 },
  description: { color: c.ink, fontSize: 13, lineHeight: 19, maxWidth: 390 },
  orbit: { position: "absolute", width: 260, height: 260, borderRadius: 130, borderWidth: 42, borderColor: "rgba(16,17,18,0.055)", right: -125, bottom: -158 },
  body: { backgroundColor: c.bg, marginTop: -29, borderTopLeftRadius: 34, borderTopRightRadius: 34, paddingHorizontal: 28, paddingTop: 24, gap: 18, flexGrow: 1 },
  formTitle: { color: c.white, fontSize: 22, lineHeight: 29, fontWeight: "600", letterSpacing: -0.5 },
  sectionLabel: { color: c.muted, fontSize: 10, lineHeight: 16, letterSpacing: 1.5, fontWeight: "600" },
  progressBlock: { gap: 12, marginBottom: 3 },
  progressText: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  step: { color: c.white, fontSize: 12, fontWeight: "500" },
  track: { flexDirection: "row", alignItems: "center", gap: 5, height: 24 },
  segment: { flex: 1, height: 2, backgroundColor: c.line, borderRadius: 1 },
  stepCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" },
  stepCircleActive: { backgroundColor: c.orange, borderColor: c.orange },
  stepNumber: { fontSize: 10, lineHeight: 14, color: c.muted, fontWeight: "700" },
  segmentActive: { backgroundColor: c.orange },
  fields: { gap: 18 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: 4, paddingTop: 5 },
  footerLink: { minHeight: 44, justifyContent: "center", paddingHorizontal: 5 },
  footerLinkText: { color: c.orange, fontWeight: "600", fontSize: 13 },
  footnote: { color: c.muted, fontSize: 11, lineHeight: 17, textAlign: "center" },
  notice: { color: c.white, borderLeftWidth: 3, borderColor: c.orange, paddingLeft: 12, fontSize: 13, lineHeight: 20 },
  nav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingTop: 10 },
  navItem: { minWidth: 105, maxWidth: "65%" },
  choice: { borderRadius: 20, padding: 18, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, gap: 8, minHeight: 106 },
  choiceSelected: { borderColor: c.orange, backgroundColor: "#261E19" },
  choiceTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  choiceTitle: { color: c.white, fontSize: 20, fontWeight: "600" },
  choiceDescription: { color: c.muted, fontSize: 13, lineHeight: 20, maxWidth: 380 },
  choiceMarker: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: c.muted, alignItems: "center", justifyContent: "center" },
  choiceDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.orange },
});
