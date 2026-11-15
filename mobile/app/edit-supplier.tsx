import { AccountGate } from "../src/backend/AccountGate";
import React, { useState } from "react";
import { Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, FormSection, Heading, Input, Muted, Page, ScreenHeader, Txt } from "../src/components/ui";
import { SelectField } from "../src/components/SelectField";
import { BankBranchField } from "../src/components/BankBranchField";
import { supplierCategories } from "../src/domain/supplierOptions";
import { useDemo } from "../src/state/DemoState";
import type { SupplierEdit } from "../src/workflow/types";
function EditSupplierContent() {
 const { id } = useLocalSearchParams<{ id: string }>();
 const { suppliers, operations, queueSupplier } = useDemo();
 const supplier = suppliers.find(s => s.id === id);
 const [draft, setDraft] = useState<SupplierEdit>(() => ({ name: supplier?.name ?? "", category: supplier?.category ?? "", registration: supplier?.registration ?? "", contact: supplier?.contact ?? "", branch_code:supplier?.branchCode??"",reviewed: false, reason: "" }));
 const [version] = useState(supplier?.version ?? 1), [bank, setBank] = useState(""), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
 const waiting = operations.some(o => o.kind === "supplier" && o.entityId === id);
 const update = (key: keyof SupplierEdit, value: string | boolean) => setDraft(old => ({ ...old, [key]: value }));
 return <SafeAreaView style={{ flex: 1 }}><ScreenHeader back title="Edit supplier reference" /><Page>
  <Heading>Explain what changed.</Heading>
  {!supplier ? <Muted>Refresh your supplier directory before editing this record.</Muted> : <>
   <Muted>Editing reference version {version}. A reason is required, and a server-written history records every accepted change. Updating a reference does not approve a payment.</Muted>
   <FormSection title="Supplier details">
   <Input dark label="Supplier name" value={draft.name} onChangeText={v => update("name", v)} editable={!waiting} maxLength={160}/>
   <SelectField label="Category" value={draft.category} onChange={v => update("category", v)} options={supplierCategories} allowCustom disabled={waiting}/>
   <Input dark label="Registration number" value={draft.registration} onChangeText={v => update("registration", v)} editable={!waiting} maxLength={100}/>
   </FormSection>
   <FormSection title="Banking reference">
   <Input dark label="New bank reference (leave blank to keep current)" value={bank} onChangeText={setBank} editable={!waiting} maxLength={80} autoCapitalize="none" />
   <BankBranchField value={draft.branch_code ?? ""} onChange={v => update("branch_code", v)} disabled={waiting}/>
   </FormSection>
   <FormSection title="Compliance & contact">
   <Input dark label="New tax reference (leave blank to keep current)" value={draft.tax_reference ?? ""} onChangeText={v => update("tax_reference", v)} editable={!waiting} maxLength={100}/>
   <Input dark label="Trusted contact" value={draft.contact} onChangeText={v => update("contact", v)} editable={!waiting} maxLength={254}/>
   </FormSection>
   <FormSection title="Review changes">
   <Input dark label="Reason for change" value={draft.reason} onChangeText={v => update("reason", v)} editable={!waiting} maxLength={500} multiline/>
   <Muted>Keep passwords and complete bank references out of the change reason. Use the dedicated bank field above.</Muted>
   <Pressable disabled={waiting} accessibilityRole="checkbox" accessibilityLabel="I independently reviewed these supplier details" accessibilityState={{ checked: draft.reviewed }} onPress={() => update("reviewed", !draft.reviewed)} style={{ paddingVertical: 16 }}><Txt>{draft.reviewed ? "✓" : "○"} I independently reviewed these supplier details</Txt></Pressable>
   <Muted>Leaving this unchecked clears the owner-reviewed marker. Supplier identity and bank ownership are not independently verified by TrustBridge.</Muted>
   </FormSection>
   <Button title="Save supplier change" disabled={waiting} loading={busy} onPress={async () => { setBusy(true); try { const {tax_reference,...rest}=draft;await queueSupplier(id,version,{ ...rest,...(tax_reference?.trim()?{tax_reference:tax_reference.trim()}:{}), ...(bank.trim() ? { bank_reference: bank.trim() } : {}) }); router.replace(`/supplier/${id}`); } catch(e) { setNotice(e instanceof Error ? e.message : "Unable to save."); } finally { setBusy(false); } }} />
   {waiting && <Button secondary title="Resolve pending supplier edit" onPress={() => router.push("/sync")} />}
  </>}
  {!!notice && <Txt accessibilityRole="alert">{notice}</Txt>}
 </Page></SafeAreaView>;
}

export default function EditSupplier() { return <AccountGate><EditSupplierContent /></AccountGate>; }
