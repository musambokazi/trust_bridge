import React, { useEffect, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePathname } from "expo-router";
import { Button, Heading, Input, Muted, Page, Txt } from "../components/ui";
import { useDeviceSecurity } from "../security/DeviceSecurity";
import { color as c } from "../theme";
import { extractInvoiceText } from "./extract";
import type { InvoiceImport } from "./importer";

type Props = { visible: boolean; onClose: () => void; onApply: (result: InvoiceImport) => void };
export function InvoiceImportDialog({ visible, onClose, onApply }: Props) {
  const { locked } = useDeviceSecurity();
  const pathname = usePathname();
  const [raw, setRaw] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { if (!visible) { setRaw(""); setNotice(""); } }, [visible]);
  return <Modal visible={visible && !locked && pathname === "/check"} animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ padding: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Txt style={{ fontSize: 18, fontWeight: "600" }}>Invoice text</Txt>
        <Pressable accessibilityRole="button" accessibilityLabel="Close invoice import" onPress={onClose} style={{ minHeight: 44, justifyContent: "center", padding: 10 }}><Txt>Close</Txt></Pressable>
      </View>
      <Page style={{ paddingBottom: 32 }}>
        <Heading>Paste, then review.</Heading>
        <Muted>Paste text copied from your invoice. We’ll suggest the details on the next screen for you to check and edit.</Muted>
        <Input dark label="Copied invoice text" value={raw} onChangeText={setRaw} multiline maxLength={50000} style={{ minHeight: 200, textAlignVertical: "top" }} />
        <Button title="Extract invoice fields" disabled={!raw.trim()} onPress={() => {
          try { onApply({ ...extractInvoiceText(raw), pages: 1, source: "Pasted invoice text" }); }
          catch (error) { setNotice(error instanceof Error ? error.message : "Unable to extract fields."); }
        }} />
        {!!notice && <Txt accessibilityRole="alert">{notice}</Txt>}
      </Page>
    </SafeAreaView>
  </Modal>;
}
