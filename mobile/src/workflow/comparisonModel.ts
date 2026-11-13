import { type Assessment, maskReference } from "../domain/demo.ts";
export function comparisonRows(item: Assessment) {
 const rows = item.comparison?.rows ?? [{ field: "bank", label: "Bank reference (last four)", reference: item.approvedReference ?? "", invoice: item.submittedReference, matches: item.findings.find(f => f.field === "bank") ? !item.findings.find(f => f.field === "bank")!.mismatch : undefined }];
 return rows.map(r => ["bank","tax"].includes(r.field) ? { ...r, reference: maskReference(r.reference), invoice: maskReference(r.invoice) } : r);
}
