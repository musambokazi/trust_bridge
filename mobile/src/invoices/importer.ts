import { Platform } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Directory, File, Paths } from "expo-file-system";
import { randomUUID } from "expo-crypto";
import native from "../../modules/trustbridge-documents/src/TrustBridgeDocumentsModule";
import { extractInvoiceText, type Extraction } from "./extract";

export const nativeImportAvailable = Platform.OS === "android" && !!native;
export type InvoiceImport = Extraction & { pages: number; source: string };
export function cancelInvoiceImport() { native?.cancel(); }

export async function importInvoice(kind: "photo" | "file", signal: AbortSignal): Promise<InvoiceImport | null> {
  if (!nativeImportAvailable || !native) throw Error("Photo and PDF recognition requires the installed Android app. You can paste invoice text instead.");
  let sourceUri: string | undefined;
  let isPdf = false;
  const cleanup: string[] = [];
  try {
    if (kind === "photo") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) throw Error("Camera permission is off. Choose a saved image/PDF or enter details manually.");
      if (signal.aborted) return null;
      const selection = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.9, exif: false, base64: false });
      if (selection.canceled || !selection.assets[0]) return null;
      sourceUri = selection.assets[0].uri;
    } else {
      const selection = await DocumentPicker.getDocumentAsync({ type: ["application/pdf", "image/jpeg", "image/png", "image/heic", "image/webp"], copyToCacheDirectory: true, multiple: false });
      if (selection.canceled || !selection.assets[0]) return null;
      sourceUri = selection.assets[0].uri;
      isPdf = selection.assets[0].mimeType === "application/pdf" || selection.assets[0].name.toLowerCase().endsWith(".pdf");
    }
    // These picker-created copies belong to this app; never delete a provider's
    // original or any file outside the app cache.
    if (sourceUri.startsWith(Paths.cache.uri)) cleanup.push(sourceUri);
    if (signal.aborted) return null;
    const source = new File(sourceUri);
    if (!source.exists || source.size <= 0 || source.size > 20 * 1024 * 1024) throw Error("Choose a non-empty image or PDF smaller than 20 MB.");
    const pdf = isPdf || source.extension.toLowerCase() === ".pdf";
    const dir = new Directory(Paths.cache, "invoice-imports");
    dir.create({ intermediates: true, idempotent: true });
    const temporary = new File(dir, randomUUID() + (pdf ? ".pdf" : ".jpg"));
    cleanup.push(temporary.uri);
    await source.copy(temporary);
    if (signal.aborted) return null;
    // Keep the temporary file alive until native reading settles, even after
    // cancellation. The native reader bounds pages, pixels, file size and time.
    const read = await native.read(temporary.uri, pdf);
    if (signal.aborted) return null;
    return { ...extractInvoiceText(read.text), pages: read.pages, source: kind === "photo" ? "Invoice photograph" : pdf ? "PDF invoice" : "Invoice image" };
  } finally {
    for (const uri of new Set(cleanup)) {
      try { const file = new File(uri); if (file.exists) file.delete(); } catch { /* OS cache eviction can race cleanup. */ }
    }
  }
}
