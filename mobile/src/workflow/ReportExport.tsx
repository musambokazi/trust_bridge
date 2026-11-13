import {SignedExport} from "../reports/SignedExport";
import React, { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Directory, File, Paths } from "expo-file-system";
import { Button, Muted, Txt } from "../components/ui";
import { useDemo } from "../state/DemoState";
import type { Assessment } from "../domain/demo";
import { reportHTML } from "./report";
import { color as c } from "../theme";
export function ReportExport({ item }: { item: Assessment }) {
 const { reviews, operations, pending } = useDemo();
 const [notes, setNotes] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState("");
 async function exportPDF() {
  if (busy) return; setBusy(true); setNotice(""); let uri: string | undefined;
  try {
   const html = reportHTML(item, reviews.find(r => r.assessment_id === item.id), { includeNotes: notes, pendingReview: operations.some(o => o.kind === "review" && o.entityId === item.id), pendingCheck: pending.some(p => p.id === item.id), generatedAt: new Date().toISOString() });
   if (Platform.OS === "web") {
    // Use an isolated same-origin print document. Never inject unescaped notes
    // into the app DOM, and never upload a PDF to create a public share URL.
    const printWindow = window.open("", "_blank");
    if (!printWindow) throw Error("Allow the report window to open, then choose Save as PDF in your print dialog.");
    printWindow.document.open(); printWindow.document.write(html); printWindow.document.close(); printWindow.focus(); printWindow.print();
    setNotice("Choose Save as PDF in the report window. Close that window when finished.");
   } else {
    // Android's chooser can resolve before the destination has read its URI.
    // Retain each export in app-private cache for an hour; prune at next export.
    const exports = new Directory(Paths.cache, "review-exports");
    exports.create({ idempotent: true, intermediates: true });
    for (const entry of exports.list()) {
     if (entry instanceof File && entry.name.endsWith(".pdf")) {
      const created = Number(entry.name.split("-")[0]);
      if (created > 0 && Date.now() - created > 3600000) { try { entry.delete(); } catch { /* Try on the next export. */ } }
     }
    }
    if (!await Sharing.isAvailableAsync()) throw Error("File sharing is unavailable on this device.");
    const result = await Print.printToFileAsync({ html, width: 595, height: 842, base64: false }); uri = result.uri;
    const retained = new File(exports, `${Date.now()}-${item.id}.pdf`);
    new File(uri).copy(retained);
    await Sharing.shareAsync(retained.uri, { mimeType: "application/pdf", UTI: ".pdf", dialogTitle: "Share TrustBridge review report" });
    setNotice("The share dialog has closed. Check your chosen destination to confirm the report was saved or sent.");
   }
  } catch(e) { setNotice(e instanceof Error ? e.message : "Unable to export this report."); }
  finally { if (uri) { try { const file = new File(uri); if (file.exists) file.delete(); } catch { /* OS cache cleanup may already have removed it. */ } } setBusy(false); }
 }
 return <View style={{ gap: 14, borderTopWidth: 1, borderColor: c.line, paddingTop: 20 }}>
  <Txt style={{ fontSize: 22, fontWeight: "600" }}>Review report</Txt>
  <Muted>Export comparison findings and the last synced checklist. Bank fields are masked. Pending work is clearly labelled; export does not sync it.</Muted>
  <Pressable accessibilityRole="checkbox" accessibilityLabel="Include synced reviewer notes in the report" accessibilityState={{ checked: notes }} onPress={() => setNotes(!notes)} style={{ paddingVertical: 12 }}><Txt>{notes ? "✓" : "○"} Include synced reviewer notes</Txt></Pressable>
  <Muted>Temporary native exports stay in app-private cache and are pruned on a later export after an hour, or by the operating system. Notes are omitted by default. If included, they may contain personal information you typed; check them before sharing.</Muted>
  <Button secondary title={Platform.OS === "web" ? "Print or save unsigned draft PDF" : "Export unsigned draft PDF"} loading={busy} onPress={() => { void exportPDF(); }} />
  <SignedExport id={item.id} includeNotes={notes}/>
  {!!notice && <Txt accessibilityRole="alert">{notice}</Txt>}
 </View>;
}
