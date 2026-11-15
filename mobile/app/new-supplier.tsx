import {randomUUID} from "expo-crypto";
import React, { useState } from "react";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, FormSection, Heading, Input, Muted, Page, ScreenHeader, Txt } from "../src/components/ui";
import { SelectField } from "../src/components/SelectField";
import { BankBranchField } from "../src/components/BankBranchField";
import { supplierCategories } from "../src/domain/supplierOptions";
import { useAuth } from "../src/backend/AuthState";
import { supabase } from "../src/backend/client";
import { useDemo } from "../src/state/DemoState";

export default function NewSupplier() {
  const { session, workspace } = useAuth();
  const { refresh } = useDemo();
  const [name, setName] = useState(""), [category, setCategory] = useState(""), [registration, setRegistration] = useState(""), [bank, setBank] = useState(""), [contact, setContact] = useState("");
  const [tax,setTax]=useState(""),[branch,setBranch]=useState(""),[notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
  const [requestId]=useState(randomUUID);
  if (!session || !workspace) return <Redirect href="/sign-in" />;
  return <SafeAreaView style={{ flex: 1 }}>
    <ScreenHeader back title="Add supplier" />
    <Page>
      <Heading>Your supplier reference</Heading>
      <Muted>Use details you confirmed independently. New references need verification; saving them does not certify a supplier.</Muted>
      <FormSection title="Supplier details">
      <Input dark label="Supplier name" value={name} onChangeText={setName} maxLength={160} placeholder="Registered or trading name" />
      <SelectField label="Category" value={category} onChange={setCategory} options={supplierCategories} allowCustom placeholder="Choose a category" />
      <Input dark label="Registration number" value={registration} onChangeText={setRegistration} maxLength={100} />
      </FormSection>
      <FormSection title="Banking reference">
      <Input dark label="Bank reference" value={bank} onChangeText={setBank} maxLength={80} autoCapitalize="none" placeholder="Exact account or payment reference" />
      <Muted>Enter the reference exactly as independently confirmed with the supplier. This is separate from the bank and branch code.</Muted>
      <BankBranchField value={branch} onChange={setBranch} />
      </FormSection>
      <FormSection title="Compliance & contact">
      <Input dark label="Supplier tax reference" value={tax} onChangeText={setTax} maxLength={100} />
      <Input dark label="Trusted contact" value={contact} onChangeText={setContact} maxLength={254} placeholder="Known phone number or email" />
      </FormSection>
      <Button title="Save supplier" loading={busy} onPress={async () => {
        if (!name.trim() || bank.trim().length < 4) { setNotice("Enter a supplier name and a bank reference of at least four characters."); return; }
        setBusy(true);
        try {
          const { error } = await supabase.functions.invoke("manage-suppliers",{body:{operation:"create",request_id:requestId,wid:workspace.id,payload:{ name: name.trim(), category: category.trim(), registration: registration.trim(), bank_reference: bank.trim(), contact: contact.trim(),tax_reference:tax.trim(),branch_code:branch.trim() }}});
          if (error) throw error;
          await refresh(); router.replace("/suppliers");
        } catch { setNotice("Unable to save the supplier. Connect and try again."); }
        finally { setBusy(false); }
      }} />
      {!!notice && <Txt accessibilityRole="alert">{notice}</Txt>}
    </Page>
  </SafeAreaView>;
}
