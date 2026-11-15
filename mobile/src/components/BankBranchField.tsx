import React, { useState } from "react";
import { View } from "react-native";
import { southAfricanBanks } from "../domain/southAfricanBanks";
import { SelectField } from "./SelectField";
import { Input, Muted } from "./ui";

const options = [...southAfricanBanks.map(bank => ({label: bank.name + (bank.code ? " · " + bank.code : ""), value: bank.id, image: bank.image})), {label:"Other bank / enter a branch code",value:"custom"}];
export function BankBranchField({ value, onChange, disabled = false }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const [selected, setSelected] = useState(() => southAfricanBanks.find(bank => bank.code === value)?.id ?? (value ? "custom" : ""));
  return <View style={{ gap: 12 }}>
    <SelectField label="Bank / branch preset" placeholder="Choose a bank or enter your own" value={selected} options={options} disabled={disabled} onChange={id => { setSelected(id); onChange(southAfricanBanks.find(bank => bank.id === id)?.code ?? ""); }} />
    <Input dark label="Supplier branch code" value={value} onChangeText={onChange} editable={!disabled} maxLength={20} keyboardType="number-pad" />
    <Muted>Confirm the branch code with your supplier. Banks without a preset need manual entry. The confirmed code is saved with the supplier reference.</Muted>
  </View>;
}
