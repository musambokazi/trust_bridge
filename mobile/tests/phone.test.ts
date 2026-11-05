import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPhoneRegion, normalizePhone, phoneRegions } from "../src/domain/phone.ts";

test("South African numbers normalize once with or without a trunk zero", () => {
  for (const input of ["082 000 0000", "820000000", "+27 82 000 0000", "+27 (0) 82 000 0000"]) {
    assert.equal(normalizePhone(input, defaultPhoneRegion), "+27820000000");
  }
  assert.equal(normalizePhone("+44 7700 900123", defaultPhoneRegion), null);
});

test("shared calling codes retain the chosen country and significant zeros are preserved", () => {
  const region = (id: string) => {
    const match = phoneRegions.find(([iso]) => iso === id);
    assert.ok(match);
    return match;
  };
  assert.equal(region("CA")[2], region("US")[2]);
  assert.equal(normalizePhone("02 1234 5678", region("IT")), "+390212345678");
  assert.equal(normalizePhone("07700 900123", region("GB")), "+447700900123");
});
