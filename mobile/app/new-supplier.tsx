import React, { useState } from "react";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Heading, Input, Muted, Page, ScreenHeader, Txt } from "../src/components/ui";
import { useAuth } from "../src/backend/AuthState";
import { supabase } from "../src/backend/client";
import { useDemo } from "../src/state/DemoState";

export default function NewSupplier() {
  const { session, workspace } = useAuth();
  const { refresh } = useDemo();
  const [name, setName] = useState(""), [category, setCategory] = useState(""), [registration, setRegistration] = useState(""), [bank, setBank] = useState(""), [contact, setContact] = useState("");
  const [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
  if (!session || !workspace) return <Redirect href="/sign-in" />;
  return <SafeAreaView style={{ flex: 1 }}>
    <ScreenHeader back title="Add supplier" />
    <Page>
      <Heading>Your supplier reference</Heading>
      <Muted>Use details you confirmed independently. New references need verification; saving them does not certify a supplier.</Muted>
      <Input dark label="Supplier name" value={name} onChangeText={setName} maxLength={160} />
      <Input dark label="Category" value={category} onChangeText={setCategory} maxLength={100} />
      <Input dark label="Registration number" value={registration} onChangeText={setRegistration} maxLength={100} />
      <Input dark label="Bank reference" value={bank} onChangeText={setBank} maxLength={80} autoCapitalize="none" />
      <Input dark label="Trusted contact" value={contact} onChangeText={setContact} maxLength={254} />
      <Button title="Save supplier" loading={busy} onPress={async () => {
        if (!name.trim() || bank.trim().length < 4) { setNotice("Enter a supplier name and a bank reference of at least four characters."); return; }
        setBusy(true);
        try {
          const { error } = await supabase.from("suppliers").insert({ workspace_id: workspace.id, name: name.trim(), category: category.trim(), registration: registration.trim(), bank_reference: bank.trim(), contact: contact.trim() });
          if (error) throw error;
          await refresh(); router.replace("/suppliers");
        } catch { setNotice("Unable to save the supplier. Connect and try again."); }
        finally { setBusy(false); }
      }} />
      {!!notice && <Txt accessibilityRole="alert">{notice}</Txt>}
    </Page>
  </SafeAreaView>;
}
