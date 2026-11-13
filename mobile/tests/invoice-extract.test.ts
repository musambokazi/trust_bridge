import { test } from "node:test";
import assert from "node:assert/strict";
import { extractInvoiceText, normalizeInvoiceAmount } from "../src/invoices/extract.ts";

test("extracts labelled invoice fields without selecting a trusted supplier", () => {
  const result = extractInvoiceText("Supplier: Ubuntu Office\nInvoice No: INV-1043\nSubtotal: R 1000.00\nVAT: 150.00\nTotal Due: R 1,150.00\nAccount number: 1234 5678");
  assert.deepEqual(result.fields, { invoiceNumber: "INV-1043", supplierName: "Ubuntu Office", amount: "1150.00", bankReference: "1234 5678",taxReference:"",branchCode:"" });
  assert.ok(result.warnings.some(v => v.includes("every field")));
});

test("handles South African grouping and decimal separators conservatively", () => {
  for (const input of ["R12 450,00", "ZAR 12,450.00", "12.450,00", "12450.00"]) assert.equal(normalizeInvoiceAmount(input), "12450.00");
  for (const input of ["-100", "0", "R 12,45,00", "1.2.3", "1000000000", "12 USD", "8,1234"]) assert.equal(normalizeInvoiceAmount(input), null);
});

test("ambiguous totals and foreign currency never become automatic ZAR suggestions", () => {
  const conflict = extractInvoiceText("Total Due: R100.00\nGrand total: R200.00");
  assert.equal(conflict.fields.amount, ""); assert.match(conflict.warnings.join(" "), /Conflicting/);
  assert.equal(extractInvoiceText("Invoice No: TEST\nCurrency: USD\nTotal: 100.00").fields.amount, "");
  assert.equal(extractInvoiceText("Subtotal: 90\nVAT: 13.50").fields.amount, "");
});

test("does not mistake payment references, buyer details or unlabeled numbers for bank/supplier identity", () => {
  const result = extractInvoiceText("Bill to: Buyer Ltd\nPayment reference: INV-999\n1234567890\nNice Company Ltd");
  assert.equal(result.fields.bankReference, ""); assert.equal(result.fields.supplierName, "");
});

test("supports labels on separate lines and rejects conflicts and excessive text", () => {
  const result = extractInvoiceText("Invoice Number:\nINV-22\nSupplier:\nTest Ltd\nBank reference:\nREF-1234\nTotal Due:\nR 500.00");
  assert.equal(result.fields.invoiceNumber, "INV-22"); assert.equal(result.fields.amount, "500.00");
  assert.equal(extractInvoiceText("Invoice No: ONE\nInvoice No: TWO").fields.invoiceNumber, "");
  assert.throws(() => extractInvoiceText("a".repeat(50001)), /50,000/);
  assert.ok(extractInvoiceText("Supplier: Test\u202e Ltd").warnings.some(w => w.includes("Hidden")));
});

test("extracts labelled tax and branch fields and clears absent identity suggestions",()=>{const f=extractInvoiceText("VAT number: 1234567890\nBranch code: 250655").fields;assert.equal(f.taxReference,"1234567890");assert.equal(f.branchCode,"250655");const empty=extractInvoiceText("Invoice number: NEXT").fields;assert.equal(empty.taxReference,"");assert.equal(empty.branchCode,"");});
