import React, { useEffect, useRef, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Heading, Input, Muted, Page, Txt } from "../components/ui";
import { usePathname } from "expo-router";
import { useDeviceSecurity } from "../security/DeviceSecurity";
import { color as c } from "../theme";
import { emptyDraft, extractInvoiceText, type DraftFields } from "./extract";
import { cancelInvoiceImport, importInvoice, nativeImportAvailable, type InvoiceImport } from "./importer";

type Props = { visible: boolean; onClose: () => void; onApply: (draft: DraftFields) => void };
export function InvoiceImportDialog({ visible, onClose, onApply }: Props) {
  const { locked } = useDeviceSecurity();
  const pathname = usePathname();
  const [stage, setStage] = useState<"choose" | "paste" | "review">("choose");
  const [raw, setRaw] = useState(""), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
  const [result, setResult] = useState<InvoiceImport | null>(null);
  const [draft, setDraft] = useState<DraftFields>({ ...emptyDraft });
  const [confirmed, setConfirmed] = useState(false);
  const task = useRef<AbortController | null>(null);
  const open = useRef(visible); open.current = visible;
  const stop = () => { task.current?.abort(); cancelInvoiceImport(); };
  useEffect(() => {
    if (!visible) {
      task.current?.abort(); cancelInvoiceImport(); setRaw(""); setResult(null); setDraft({ ...emptyDraft }); setConfirmed(false); setStage("choose"); setNotice("");
    }
    return () => { task.current?.abort(); cancelInvoiceImport(); };
  }, [visible]);
  const review = (next: InvoiceImport) => { setRaw(""); setResult(next); setDraft(next.fields); setConfirmed(false); setStage("review"); };
  async function read(kind: "photo" | "file") {
    if (task.current) return;
    const controller = new AbortController(); task.current = controller; setBusy(true); setNotice("");
    try {
      const next = await importInvoice(kind, controller.signal);
      if (next && !controller.signal.aborted && open.current) review(next);
    } catch (error) {
      if (!controller.signal.aborted && open.current) setNotice(error instanceof Error ? error.message : "Unable to read this invoice. Enter details manually.");
    } finally { if (task.current === controller) task.current = null; setBusy(false); }
  }
  const close = () => { stop(); onClose(); };
  return <Modal visible={visible && !locked && pathname === "/check"} animationType="slide" onRequestClose={close}>
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ padding: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Txt style={{ fontSize: 18, fontWeight: "600" }}>Import invoice</Txt>
        <Pressable accessibilityRole="button" accessibilityLabel="Close invoice import" onPress={close} style={{ minHeight: 44, justifyContent: "center", padding: 10 }}><Txt>Close</Txt></Pressable>
      </View>
      <Page style={{ paddingBottom: 32 }}>
        {stage === "choose" && <>
          <Heading>Less typing. More checking.</Heading>
          <Muted>Take a clear photograph or choose an image/PDF. Recognition runs on this device; the invoice file and raw text are not uploaded to Supabase.</Muted>
          <Button title="Take invoice photo" disabled={!nativeImportAvailable || busy} loading={busy} onPress={() => { void read("photo"); }} />
          <Button secondary title="Choose invoice image or PDF" disabled={!nativeImportAvailable || busy} onPress={() => { void read("file"); }} />
          <Button secondary title="Paste invoice text" disabled={busy} onPress={() => { setStage("paste"); setNotice(""); }} />
          {!nativeImportAvailable && <Muted>Photo/PDF recognition is available in the installed Android app. Paste copied invoice text here, or continue with manual entry.</Muted>}
          <Muted>Maximum 20 MB and five PDF pages. Use an unlocked PDF. Clear Latin-script text works best; faint, handwritten or complex layouts can be misread.</Muted>
        </>}
        {stage === "paste" && <>
          <Heading>Paste, then review.</Heading>
          <Input dark label="Copied invoice text" value={raw} onChangeText={setRaw} multiline maxLength={50000} style={{ minHeight: 200, textAlignVertical: "top" }} />
          <Button title="Extract invoice fields" disabled={!raw.trim()} onPress={() => {
            try { review({ ...extractInvoiceText(raw), pages: 1, source: "Pasted invoice text" }); }
            catch (error) { setNotice(error instanceof Error ? error.message : "Unable to extract fields."); }
          }} />
        </>}
        {stage === "review" && <>
          <Heading>Check every detail.</Heading>
          <Muted>{result?.source} · {result?.pages} {result?.pages === 1 ? "page" : "pages"}. These are suggestions, not verified invoice details.</Muted>
          {result?.warnings.map(w => <Txt key={w} style={{ color: c.orange }}>{w}</Txt>)}
          {([ ["invoiceNumber", "Extracted invoice number"], ["supplierName", "Extracted supplier name"], ["amount", "Extracted amount (ZAR)"], ["bankReference", "Extracted bank reference"],["taxReference","Extracted tax reference"],["branchCode","Extracted branch code"] ] as const).map(([key, label]) => <Input key={key} dark label={label} value={draft[key]} onChangeText={value => { setDraft(old => ({ ...old, [key]: value })); setConfirmed(false); }} keyboardType={key === "amount" ? "decimal-pad" : key==="branchCode"?"number-pad":"default"} maxLength={key === "supplierName" ? 160 : key === "amount" ? 14 : key==="branchCode"?20:key==="taxReference"?100:80} />)}
          <Muted>Using these fields replaces the four invoice fields currently on Check, including blanks. Your chosen supplier reference is never changed. Select the correct supplier separately.</Muted>
          <Pressable accessibilityRole="checkbox" accessibilityLabel="I checked these details against the original invoice" accessibilityState={{ checked: confirmed }} onPress={() => setConfirmed(!confirmed)} style={{ paddingVertical: 16, borderTopWidth: 1, borderColor: c.line }}><Txt style={{ color: confirmed ? c.orange : c.white }}>{confirmed ? "✓ " : "○ "}I checked these details against the original invoice</Txt></Pressable>
          <Button title="Use reviewed invoice fields" disabled={!confirmed || !Object.values(draft).some(v => v.trim())} onPress={() => { if (confirmed) { onApply(draft); close(); } }} />
          <Button secondary title="Discard import" onPress={close} />
        </>}
        {busy && <>
          <Txt accessibilityLiveRegion="polite">Reading on this device… You can cancel without changing your current invoice.</Txt>
          <Button secondary title="Cancel invoice reading" onPress={() => { stop(); setNotice("Cancelling. The current page may take a moment to finish."); }} />
        </>}
        {!!notice && <Txt accessibilityRole="alert">{notice}</Txt>}
      </Page>
    </SafeAreaView>
  </Modal>;
}
