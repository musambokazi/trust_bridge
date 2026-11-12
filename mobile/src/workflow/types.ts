export type ReviewDraft = { contact_checked: boolean; documents_checked: boolean; discrepancies_resolved: boolean; status: "unresolved" | "reviewed"; notes: string };
export type Review = ReviewDraft & { assessment_id: string; user_id: string; version: number; updated_at: string };
export type SupplierEdit = { name: string; category: string; registration: string; contact: string; bank_reference?: string; reviewed: boolean; reason: string };
export type Operation = { id: string; kind: "supplier" | "review"; entityId: string; version: number; payload: SupplierEdit | ReviewDraft; at: string; status: "waiting" | "failed" | "blocked" | "conflict"; attempts: number; error?: string; serverVersion?: number; lastAttempt?: string };
export type SupplierChange = { id: string; supplier_id: string; actor_id: string | null; version: number; reason: string; before_values: Record<string, string | number | null> | null; after_values: Record<string, string | number | null>; created_at: string };
export type SyncReceipt = { id: string; kind: string; at: string };
export const blankReview: ReviewDraft = { contact_checked: false, documents_checked: false, discrepancies_resolved: false, status: "unresolved", notes: "" };
export function validateReview(draft: ReviewDraft) {
  if (draft.notes.length > 2000) return "Keep notes under 2,000 characters.";
  if (draft.status === "reviewed" && !(draft.contact_checked && draft.documents_checked && draft.discrepancies_resolved)) return "Complete every checklist item before marking reviewed.";
  return "";
}
export function validateSupplierEdit(draft: SupplierEdit) {
  if (!draft.name.trim() || draft.name.length > 160 || draft.category.length > 100 || draft.registration.length > 100 || draft.contact.length > 254) return "Check the supplier fields and their lengths.";
  if (draft.bank_reference !== undefined && (draft.bank_reference.trim().length < 4 || draft.bank_reference.length > 80)) return "Use a bank reference between 4 and 80 characters, or leave it empty to keep the current reference.";
  if (draft.reason.trim().length < 5 || draft.reason.length > 500) return "Explain the change in 5 to 500 characters.";
  return "";
}
export const operationError = (code?: string) => code === "P0001" || code?.startsWith("22") || code?.startsWith("23") || code === "42501" || code === "PGRST202" ? "blocked" as const : "failed" as const;
