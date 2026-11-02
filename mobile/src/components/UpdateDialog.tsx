import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Brand, Button, Icon, Txt } from "./ui";
import { color as c } from "../theme";

type Props = {
  visible: boolean;
  restarting: boolean;
  error: string;
  onLater: () => void;
  onRestart: () => void;
};

export function UpdateDialog({ visible, restarting, error, onLater, onRestart }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => { if (!restarting) onLater(); }}
    >
      <SafeAreaView style={s.backdrop}>
        <ScrollView bounces={false} contentContainerStyle={s.scroll}>
          <View
            role="dialog"
            aria-label="TrustBridge update"
            aria-modal={true}
            accessibilityViewIsModal
            style={s.dialog}
          >
            <Brand />
            <View style={s.symbol}>
              <Icon name="cloud-download-outline" size={27} color={c.orange} />
            </View>
            <View style={s.copy}>
              <Txt style={s.eyebrow}>DOWNLOADED & READY</Txt>
              <Txt accessibilityRole="header" style={s.title}>Your update{"\n"}is ready.</Txt>
              <Txt style={s.description}>Restart TrustBridge to apply the latest update.</Txt>
              <Txt style={s.footnote}>Your current demo session will reset.</Txt>
            </View>
            {error ? <Txt accessibilityRole="alert" style={s.error}>{error}</Txt> : null}
            <Button
              title={restarting ? "Restarting…" : error ? "Try again" : "Restart and apply"}
              icon="refresh-outline"
              loading={restarting}
              onPress={onRestart}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Later"
              accessibilityState={{ disabled: restarting }}
              disabled={restarting}
              onPress={onLater}
              style={({ pressed }) => [s.later, (pressed || restarting) && { opacity: 0.5 }]}
            >
              <Txt style={s.laterText}>Later</Txt>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.78)" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  dialog: { width: "100%", maxWidth: 420, alignSelf: "center", backgroundColor: c.bg, borderColor: c.line, borderWidth: 1, borderRadius: 26, padding: 24, gap: 20 },
  symbol: { width: 56, height: 56, marginTop: 6, borderRadius: 18, backgroundColor: c.surface, justifyContent: "center", alignItems: "center" },
  copy: { gap: 12 },
  eyebrow: { color: c.orange, fontSize: 10, lineHeight: 16, fontWeight: "600", letterSpacing: 1.7 },
  title: { color: c.white, fontSize: 32, lineHeight: 37, fontWeight: "600", letterSpacing: -1.1 },
  description: { color: c.muted },
  footnote: { color: c.muted, fontSize: 12, lineHeight: 18 },
  error: { color: c.orange, fontSize: 13, lineHeight: 20 },
  later: { minHeight: 44, justifyContent: "center", alignItems: "center", marginTop: -12 },
  laterText: { color: c.muted, fontWeight: "500" },
});
