import { AccountGate } from "../src/backend/AccountGate";
import React, { useState } from "react";
import { Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Heading, Input, Muted, Page, ScreenHeader, Txt } from "../src/components/ui";
import { useDemo } from "../src/state/DemoState";
import type { SupplierEdit } from "../src/workflow/types";
function EditSupplierContent() {
 const { id } = useLocalSearchParams<{ id: string }>();
 const { suppliers, operations, queueSupplier } = useDemo();
 const supplier = suppliers.find(s => s.id === id);
 const [draft, setDraft] = useState<SupplierEdit>(() => ({ name: supplier?.name ?? "", category: supplier?.category ?? "", registration: supplier?.registration ?? "", contact: supplier?.contact ?? "", reviewed: false, reason: "" }));
 const [version] = useState(supplier?.version ?? 1), [bank, setBank] = useState(""), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
 const waiting = operations.some(o => o.kind === "supplier" && o.entityId === id);
 const update = (key: keyof SupplierEdit, value: string | boolean) => setDraft(old => ({ ...old, [key]: value }));
 return <SafeAreaView style={{ flex: 1 }}><ScreenHeader back title="Edit supplier reference" /><Page>
  <Heading>Explain what changed.</Heading>
  {!supplier ? <Muted>Refresh your supplier directory before editing this record.</Muted> : <>
   <Muted>Editing reference version {version}. A reason is required, and a server-written history records every accepted change. Updating a reference does not approve a payment.</Muted>
   {([["name", "Supplier name", 160], ["category", "Category", 100], ["registration", "Registration number", 100], ["contact", "Trusted contact", 254], ["reason", "Reason for change", 500]] as const).map(([key,label,max]) => <Input key={key} dark label={label} value={draft[key]} onChangeText={v => update(key,v)} editable={!waiting} maxLength={max} />)}
   <Muted>Keep passwords and complete bank references out of the change reason. Use the dedicated bank field below.</Muted>
   <Input dark label="New bank reference (leave blank to keep current)" value={bank} onChangeText={setBank} editable={!waiting} maxLength={80} autoCapitalize="none" />
   <Pressable disabled={waiting} accessibilityRole="checkbox" accessibilityLabel="I independently reviewed these supplier details" accessibilityState={{ checked: draft.reviewed }} onPress={() => update("reviewed", !draft.reviewed)} style={{ paddingVertical: 16 }}><Txt>{draft.reviewed ? "✓" : "○"} I independently reviewed these supplier details</Txt></Pressable>
   <Muted>Leaving this unchecked clears the owner-reviewed marker. Supplier identity and bank ownership are not independently verified by TrustBridge.</Muted>
   <Button title="Save supplier change" disabled={waiting} loading={busy} onPress={async () => { setBusy(true); try { await queueSupplier(id,version,{ ...draft, ...(bank.trim() ? { bank_reference: bank.trim() } : {}) }); router.replace(`/supplier/${id}`); } catch(e) { setNotice(e instanceof Error ? e.message : "Unable to save."); } finally { setBusy(false); } }} />
   {waiting && <Button secondary title="Resolve pending supplier edit" onPress={() => router.push("/sync")} />}
  </>}
  {!!notice && <Txt accessibilityRole="alert">{notice}</Txt>}
 </Page></SafeAreaView>;
}

export default function EditSupplier() { return <AccountGate><EditSupplierContent /></AccountGate>; }
