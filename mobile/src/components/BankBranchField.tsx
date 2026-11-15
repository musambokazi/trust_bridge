import React from "react";
import { View } from "react-native";
import { branchOptions } from "../domain/supplierOptions";
import { SelectField } from "./SelectField";
import { Input, Muted } from "./ui";

export function BankBranchField({ value, onChange, disabled = false }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const [custom, setCustom] = React.useState(false);
  const known = branchOptions.some(option => option.value !== "custom" && option.value === value);
  return <View style={{ gap: 12 }}>
    <SelectField label="Bank / branch preset" placeholder="Choose a bank or enter your own" value={custom || (value && !known) ? "custom" : value} options={branchOptions} disabled={disabled} onChange={next => { setCustom(next === "custom"); if (next !== "custom") onChange(next); }} />
    <Input dark label="Supplier branch code" value={value} onChangeText={next => { setCustom(true); onChange(next); }} editable={!disabled} maxLength={20} keyboardType="number-pad" />
    <Muted>Presets suggest a branch code only. Confirm the exact code with your supplier; a selection does not verify their bank account.</Muted>
  </View>;
}
