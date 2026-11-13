export type DraftFields = { invoiceNumber: string; supplierName: string; amount: string; bankReference: string;taxReference:string;branchCode:string };
export type Extraction = { fields: DraftFields; warnings: string[] };
export const emptyDraft: DraftFields = { invoiceNumber: "", supplierName: "", amount: "", bankReference: "",taxReference:"",branchCode:"" };

export function normalizeInvoiceAmount(value: string): string | null {
  let s = value.trim().replace(/^(?:ZAR\s*|R\s*)/i, "").replace(/[\s\u00a0]/g, "");
  if (!/^\d[\d.,]*$/.test(s)) return null;
  if (s.includes(",") && s.includes(".")) {
    const decimal = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
    const parts = s.split(decimal);
    if (parts.length !== 2 || !/^\d{2}$/.test(parts[1]!)) return null;
    const thousands = decimal === "," ? "." : ",";
    if (!new RegExp(`^\\d{1,3}(?:\\${thousands}\\d{3})+$`).test(parts[0]!)) return null;
    s = parts[0]!.split(thousands).join("") + "." + parts[1];
  } else if (s.includes(",")) {
    if (/^\d+,\d{2}$/.test(s)) s = s.replace(",", ".");
    else if (/^\d{1,3}(,\d{3})+$/.test(s)) s = s.replaceAll(",", "");
    else return null;
  } else if ((s.match(/\./g) ?? []).length > 1) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return n > 0 && n <= 999999999 ? n.toFixed(2) : null;
}

// Deterministic hints, not invoice authentication. Only explicitly labelled
// values become suggestions. Never infer a trusted supplier or payment approval.
export function extractInvoiceText(raw: string): Extraction {
  if (raw.length > 50000) throw Error("Limit invoice text to 50,000 characters.");
  const warnings: string[] = [];
  const text = raw.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, "");
  if (text !== raw) warnings.push("Hidden control characters were removed. Check the source carefully.");
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const fields = { ...emptyDraft };
  function labelled(pattern: RegExp) {
    const candidates: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i]!.match(pattern);
      if (!match) continue;
      const value = (match[1]?.trim() || lines[i + 1] || "").trim();
      if (value && !/^(?:invoice|supplier|issued by|company name|amount due|total|grand total|bank reference|account number|subtotal|vat|tax)\b.*:/i.test(value)) candidates.push(value);
    }
    return [...new Set(candidates)];
  }
  const numbers = labelled(/^(?:tax\s+)?invoice\s*(?:number|no\.?|#)\s*[:#-]?\s*(.*)$/i);
  const names = labelled(/^(?:supplier(?:\s+name)?|issued\s+by|from|company\s+name)\s*:\s*(.*)$/i);
  const references = labelled(/^(?:bank\s+reference|(?:bank\s+)?account\s+(?:number|no\.?))\s*[:#-]?\s*(.*)$/i);
  const taxes = labelled(/^(?:supplier\s+)?(?:tax|VAT)\s+(?:reference|number|no\.?)\s*[:#-]?\s*(.*)$/i);
  const branches=labelled(/^(?:bank\s+)?branch\s+code\s*[:#-]?\s*(.*)$/i);
  const amounts = labelled(/^(?:amount\s+(?:due|payable)|grand\s+total|total\s+(?:due|payable|incl(?:usive)?\.?\s*(?:vat|tax))|invoice\s+total|total)\s*[:=-]?\s*(.*)$/i);
  function single(values: string[], label: string, max: number) {
    if (values.length > 1) { warnings.push(`Conflicting ${label} values found. Enter the correct value manually.`); return ""; }
    const value = values[0] ?? "";
    if (value.length > max) { warnings.push(`${label} is too long. Enter it manually.`); return ""; }
    return value;
  }
  fields.invoiceNumber = single(numbers.filter(v => /^[\p{L}\p{N}][\p{L}\p{N}._/\s-]*$/u.test(v)), "invoice number", 80);
  fields.supplierName = single(names, "supplier name", 160);
  fields.bankReference = single(references.filter(v => /^[\p{L}\p{N}][\p{L}\p{N}\s./-]{3,79}$/u.test(v)), "bank reference", 80);
  fields.taxReference=single(taxes.filter(v=>/^[\p{L}\p{N}][\p{L}\p{N}\s./-]*$/u.test(v)),"tax reference",100);
  fields.branchCode=single(branches.filter(v=>/^[0-9 -]{1,20}$/.test(v)),"branch code",20);
  const foreign = /\b(?:USD|EUR|GBP|AUD|CAD|JPY|BWP|NAD|ZMW)\b|[$€£¥]/i.test(text);
  if (foreign) warnings.push("A non-ZAR currency was found. Do not convert it automatically; confirm the currency and enter a ZAR amount only if appropriate.");
  else {
    const values = [...new Set(amounts.map(normalizeInvoiceAmount).filter((v): v is string => v !== null))];
    fields.amount = single(values, "total amount", 14);
  }
  if (!Object.values(fields).some(Boolean)) warnings.push("No reliable labelled fields were found. Enter the invoice details manually.");
  warnings.push("Text recognition can miss or misread details. Compare every field with the original invoice before using it.");
  return { fields, warnings };
}
