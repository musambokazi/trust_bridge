import React, { useEffect, useRef, useState } from "react";
import { router, usePathname } from "expo-router";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useDeviceSecurity } from "../../src/security/DeviceSecurity";
import { Button, Eyebrow, Heading, Muted, Page, ScreenHeader, Txt } from "../../src/components/ui";
import { InvoiceImportDialog } from "../../src/invoices/InvoiceImportDialog";
import { useInvoiceDraft } from "../../src/invoices/InvoiceDraftState";
import { cancelInvoiceImport, importInvoice, nativeImportAvailable, type InvoiceImport } from "../../src/invoices/importer";

export default function CheckInvoice() {
  const { supplier } = useLocalSearchParams<{ supplier?: string }>();
  const { start } = useInvoiceDraft();
  const { locked } = useDeviceSecurity();
  const pathname = usePathname();
  const [paste, setPaste] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const task = useRef<AbortController | null>(null);
  useEffect(() => () => { task.current?.abort(); cancelInvoiceImport(); }, []);
  useEffect(() => { if (locked || pathname !== "/check") { task.current?.abort(); cancelInvoiceImport(); } }, [locked, pathname]);
  const openDetails = (result: InvoiceImport) => {
    start({ ...result, supplierId: supplier || "" });
    setPaste(false);
    router.push("/invoice-details");
  };
  async function read(kind: "file" | "photo") {
    if (task.current) return;
    const controller = new AbortController();
    task.current = controller; setBusy(true); setError("");
    try {
      const result = await importInvoice(kind, controller.signal);
      if (result && !controller.signal.aborted) openDetails(result);
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Unable to read this invoice. Try a clearer copy or paste its text.");
    } finally {
      if (task.current === controller) task.current = null;
      setBusy(false);
    }
  }
  return <>
    <ScreenHeader />
    <Page>
      <View style={{ gap: 12 }}>
        <Eyebrow>COMPARE, THEN CONFIRM</Eyebrow>
        <Heading>Your invoice.{"\n"}A clearer picture.</Heading>
        <Muted>Upload a saved invoice or photograph a physical copy. We’ll read its details, then open them for you to review and correct.</Muted>
      </View>
      <Button title="Upload invoice" icon="document-attach-outline" disabled={busy || !nativeImportAvailable} loading={busy} onPress={() => { void read("file"); }} />
      <Button secondary title="Scan physical invoice" icon="camera-outline" disabled={busy || !nativeImportAvailable} onPress={() => { void read("photo"); }} />
      <Muted>Recognition runs on this device, including offline. The original file and raw text are not uploaded. Image or unlocked PDF · maximum 20 MB and five pages.</Muted>
      {busy && <><Txt accessibilityLiveRegion="polite">Reading your invoice…</Txt><Button secondary title="Cancel invoice reading" onPress={() => { task.current?.abort(); cancelInvoiceImport(); }} /></>}
      {!!error && <Txt accessibilityRole="alert">{error}</Txt>}
      {!nativeImportAvailable && <Muted>Camera and file recognition need the installed Android app. You can paste copied invoice text here.</Muted>}
      <Button secondary title="Paste invoice text" disabled={busy} onPress={() => setPaste(true)} />
    </Page>
    <InvoiceImportDialog visible={paste} onClose={() => setPaste(false)} onApply={openDetails} />
  </>;
}
