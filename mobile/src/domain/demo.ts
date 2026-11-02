// Fictional UI fixtures. This module is NOT the trusted production assessment engine.
export type Supplier = {
  id: string;
  name: string;
  initials: string;
  category: string;
  registration: string;
  bankReference: string;
  verified: boolean;
  verifiedOn?: string;
  contact: string;
};
export type InvoiceInput = {
  supplierId: string;
  invoiceNumber: string;
  supplierName: string;
  amount: string;
  bankReference: string;
};
export type Finding = {
  field: string;
  title: string;
  detail: string;
  mismatch: boolean;
};
export type Assessment = {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  amount: number;
  date: string;
  level: "review" | "clear" | "unknown";
  findings: Finding[];
  approvedReference?: string;
  submittedReference: string;
  supplierId: string;
};
export const suppliers: Supplier[] = [
  {
    id: "ubuntu",
    name: "Ubuntu Supplies",
    initials: "US",
    category: "Office supplies",
    registration: "DEMO-2024-001",
    bankReference: "DEMO4318",
    verified: true,
    verifiedOn: "20 Oct 2026",
    contact: "accounts@ubuntu.example",
  },
  {
    id: "cape",
    name: "Cape Office Co.",
    initials: "CO",
    category: "Equipment & furniture",
    registration: "DEMO-2024-002",
    bankReference: "DEMO5120",
    verified: true,
    verifiedOn: "18 Oct 2026",
    contact: "accounts@cape.example",
  },
  {
    id: "mokoena",
    name: "Mokoena Logistics",
    initials: "ML",
    category: "Transport & delivery",
    registration: "DEMO-2024-003",
    bankReference: "DEMO9064",
    verified: false,
    contact: "accounts@mokoena.example",
  },
  {
    id: "karoo",
    name: "Karoo Print Studio",
    initials: "KP",
    category: "Printing & branding",
    registration: "DEMO-2024-004",
    bankReference: "DEMO6712",
    verified: true,
    verifiedOn: "16 Oct 2026",
    contact: "accounts@karoo.example",
  },
];
export const maskReference = (value: string) =>
  value ? `•••• ${value.slice(-4)}` : "Not available";
export function validateInvoice(
  input: InvoiceInput,
): Partial<Record<keyof InvoiceInput, string>> {
  const errors: Partial<Record<keyof InvoiceInput, string>> = {};
  if (!input.supplierId) errors.supplierId = "Select a supplier.";
  if (!input.invoiceNumber.trim() || input.invoiceNumber.trim().length > 80)
    errors.invoiceNumber = "Enter an invoice number (up to 80 characters).";
  if (!input.supplierName.trim() || input.supplierName.trim().length > 160)
    errors.supplierName = "Enter the name shown on the invoice.";
  const amount = Number(input.amount);
  if (
    !/^\d+(\.\d{1,2})?$/.test(input.amount) ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 999999999
  )
    errors.amount = "Enter a valid amount, for example 12450.00.";
  if (
    input.bankReference.trim().length < 4 ||
    input.bankReference.trim().length > 80
  )
    errors.bankReference =
      "Enter a bank reference between 4 and 80 characters.";
  return errors;
}
export function previewAssessment(
  input: InvoiceInput,
  id: string,
  date: string,
): Assessment {
  if (Object.keys(validateInvoice(input)).length)
    throw Error("Invalid invoice input");
  const supplier = suppliers.find((s) => s.id === input.supplierId);
  const findings: Finding[] = [];
  const normalize = (s: string) => s.trim().replace(/\s+/g, "").toLowerCase();
  if (!supplier)
    findings.push({
      field: "supplier",
      title: "Supplier not found",
      detail:
        "There is no approved record to compare with. Independently confirm the supplier’s identity.",
      mismatch: true,
    });
  else {
    const differentBank =
      normalize(input.bankReference) !== normalize(supplier.bankReference);
    findings.push({
      field: "bank",
      title: differentBank
        ? "Bank reference changed"
        : "Bank reference matches",
      detail: differentBank
        ? "The invoice bank reference differs from the approved supplier record."
        : "The reference matches the selected demonstration record.",
      mismatch: differentBank,
    });
    const differentName =
      normalize(input.supplierName) !== normalize(supplier.name);
    findings.push({
      field: "name",
      title: differentName ? "Supplier name differs" : "Supplier name matches",
      detail: differentName
        ? "The submitted name differs from the supplier record. Confirm the reason for the difference."
        : "The submitted name matches the selected record.",
      mismatch: differentName,
    });
    findings.push({
      field: "baseline",
      title: supplier.verified
        ? "Reference record reviewed"
        : "Reference needs verification",
      detail: supplier.verified
        ? "The fictional reference is marked reviewed for this demo."
        : "The reference itself has not been verified. Confirm it before relying on this comparison.",
      mismatch: !supplier.verified,
    });
  }
  return {
    id,
    invoiceNumber: input.invoiceNumber.trim(),
    supplierName: input.supplierName.trim(),
    amount: Number(input.amount),
    date,
    supplierId: input.supplierId,
    approvedReference: supplier?.bankReference,
    submittedReference: input.bankReference.trim(),
    level: !supplier
      ? "unknown"
      : findings.some((f) => f.mismatch)
        ? "review"
        : "clear",
    findings,
  };
}
export const initialAssessments: Assessment[] = [
  previewAssessment(
    {
      supplierId: "ubuntu",
      invoiceNumber: "INV-1042",
      supplierName: "Ubuntu Supplies",
      amount: "12450",
      bankReference: "DEMO7821",
    },
    "demo-1042",
    "2026-10-24T08:24:00+02:00",
  ),
  previewAssessment(
    {
      supplierId: "cape",
      invoiceNumber: "INV-1041",
      supplierName: "Cape Office Co.",
      amount: "3860",
      bankReference: "DEMO5120",
    },
    "demo-1041",
    "2026-10-23T14:18:00+02:00",
  ),
  previewAssessment(
    {
      supplierId: "mokoena",
      invoiceNumber: "INV-1040",
      supplierName: "Mokoena Logistics",
      amount: "7200",
      bankReference: "DEMO9064",
    },
    "demo-1040",
    "2026-10-22T09:03:00+02:00",
  ),
];
