import test from "node:test";
import assert from "node:assert/strict";
import {
  maskReference,
  previewAssessment,
  validateInvoice,
} from "../src/domain/demo.ts";
const invoice = {
  supplierId: "ubuntu",
  invoiceNumber: "INV-100",
  supplierName: "Ubuntu Supplies",
  amount: "100.00",
  bankReference: "DEMO4318",
};
test("matching fixture has no discrepancy findings, not payment approval", () => {
  const r = previewAssessment(invoice, "test", "2026-10-24T00:00:00Z");
  assert.equal(r.level, "clear");
  assert.ok(r.findings.every((f) => !f.mismatch));
});
test("changed banking reference is explained", () => {
  const r = previewAssessment(
    { ...invoice, bankReference: "DEMO9999" },
    "test",
    "2026-10-24T00:00:00Z",
  );
  assert.equal(r.level, "review");
  assert.ok(r.findings.some((f) => f.field === "bank" && f.mismatch));
});
test("unknown and unverified suppliers do not get a clear result", () => {
  assert.equal(
    previewAssessment({ ...invoice, supplierId: "unknown" }, "t", "d").level,
    "unknown",
  );
  assert.equal(
    previewAssessment(
      {
        ...invoice,
        supplierId: "mokoena",
        supplierName: "Mokoena Logistics",
        bankReference: "DEMO9064",
      },
      "t",
      "d",
    ).level,
    "review",
  );
});
test("malformed and excessive inputs cannot create a result", () => {
  for (const amount of ["0", "-1", "abc", "Infinity", "1000000000", "1.234"])
    assert.ok(validateInvoice({ ...invoice, amount }).amount);
  assert.throws(() =>
    previewAssessment({ ...invoice, invoiceNumber: "" }, "t", "d"),
  );
});
test("displayed banking references expose final four characters only", () => {
  assert.equal(maskReference("DEMO4318"), "•••• 4318");
  assert.equal(maskReference(""), "Not available");
});
