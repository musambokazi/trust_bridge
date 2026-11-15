import React, { useRef, useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  DemoNote,
  Eyebrow,
  Heading,
  Icon,
  Input,
  Muted,
  Page,
  ScreenHeader,
  Txt,
  styles,
} from "../src/components/ui";
import {
  validateInvoice,
  type InvoiceInput,
} from "../src/domain/demo";
import { useDemo } from "../src/state/DemoState";
import { useInvoiceDraft } from "../src/invoices/InvoiceDraftState";
import { FloatingMenu } from "../src/components/FloatingMenu";
import { color as c } from "../src/theme";
const blank: InvoiceInput = {
  supplierId: "",
  invoiceNumber: "",
  supplierName: "",
  amount: "",
  bankReference: "",
};
export default function InvoiceDetails() {
  const { suppliers, check } = useDemo();
  const { draft, clear } = useInvoiceDraft();
  const initial = draft;
  const [input, setInput] = useState<InvoiceInput>(() => ({
    ...blank,
    supplierId: initial?.supplierId || "",
    ...initial?.fields,
  }));
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<ReturnType<typeof validateInvoice>>({}),
    [picker, setPicker] = useState(false),
    [busy, setBusy] = useState(false);
  const numberRef = useRef<React.ComponentRef<typeof TextInput>>(null),
    amountRef = useRef<React.ComponentRef<typeof TextInput>>(null),
    nameRef = useRef<React.ComponentRef<typeof TextInput>>(null),
    bankRef = useRef<React.ComponentRef<typeof TextInput>>(null), taxRef = useRef<React.ComponentRef<typeof TextInput>>(null),branchRef=useRef<React.ComponentRef<typeof TextInput>>(null);
  const supplier = suppliers.find((s) => s.id === input.supplierId);
  const set = (key: keyof InvoiceInput, value: string) => {
    setInput((v) => ({ ...v, [key]: value }));
    setConfirmed(false);
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const [submitError, setSubmitError] = useState("");
  const submit = async () => {
    if (!confirmed || busy) return;
    const e = validateInvoice(input);
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setSubmitError("");
    try {
      const id = await check(input);
      router.replace(`/assessment/${id}`);
      clear();
    } catch (error) { setSubmitError(error instanceof Error ? error.message : "Unable to save check."); }
    finally { setBusy(false); }
  };
  if (!draft) return <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}><ScreenHeader back title="Invoice details" /><Page><Heading>Start with your invoice.</Heading><Muted>Upload or scan an invoice first. Unsubmitted invoice details stay in memory only and are cleared when your account or workspace changes.</Muted><Button title="Open Check" onPress={() => router.replace("/check")} /></Page></SafeAreaView>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader back title="Invoice details" />
      <Page>
        <View style={{ gap: 12 }}>
          <Eyebrow>REVIEW, THEN COMPARE</Eyebrow>
          <Heading>Check every detail.</Heading>
          <Muted>{initial?.source} · {initial?.pages || 1} {(initial?.pages || 1) === 1 ? "page" : "pages"}. Correct any missing or misread fields below before comparing.</Muted>
          {initial?.warnings.map(warning => <Txt key={warning} style={{ color: c.orange }}>{warning}</Txt>)}
        </View>
        <View style={[styles.paper, { backgroundColor: c.bg, borderWidth: 1, borderColor: c.line }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                backgroundColor: c.surface,
                padding: 9,
                borderRadius: 10,
              }}
            >
              <Icon name="document-text-outline" color={c.orange} size={20} />
            </View>
            <View style={{ gap: 3 }}>
              <Txt style={[styles.paperTitle, { color: c.white }]}>Invoice details</Txt>
              <Txt style={[styles.mutedOnPaper, { color: c.muted }]}>
                Review details · Server comparison
              </Txt>
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Txt style={[styles.label, { color: c.white }]}>Supplier record</Txt>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select supplier"
              onPress={() => setPicker(true)}
              style={{
                minHeight: 50,
                borderWidth: 1,
                borderColor: errors.supplierId ? c.orange : c.line,
                backgroundColor: c.surface,
                borderRadius: 12,
                paddingHorizontal: 13,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <Txt style={{ color: input.supplierId ? c.white : c.muted, flex: 1 }}>
                {supplier?.name ||
                  (input.supplierId === "unknown"
                    ? "Supplier not listed"
                    : "Choose a supplier")}
              </Txt>
              <Icon name="chevron-down" color={c.muted} size={17} />
            </Pressable>
            {errors.supplierId && (
              <Txt
                accessibilityRole="alert"
                style={{ color: c.orange, fontSize: 12 }}
              >
                {errors.supplierId}
              </Txt>
            )}
          </View>
          <Input
            dark
            label="Invoice number"
            placeholder="e.g. INV-1043"
            value={input.invoiceNumber}
            onChangeText={(v) => set("invoiceNumber", v)}
            error={errors.invoiceNumber}
            ref={numberRef}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => amountRef.current?.focus()}
            maxLength={80}
          />
          <Input
            dark
            label="Amount (ZAR)"
            placeholder="e.g. 12450.00"
            value={input.amount}
            onChangeText={(v) => set("amount", v.replace(",", "."))}
            keyboardType="decimal-pad"
            ref={amountRef}
            error={errors.amount}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => nameRef.current?.focus()}
            maxLength={14}
          />
          <Input
            dark
            label="Supplier name on invoice"
            placeholder="Enter the name as shown"
            value={input.supplierName}
            onChangeText={(v) => set("supplierName", v)}
            ref={nameRef}
            error={errors.supplierName}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => bankRef.current?.focus()}
            maxLength={160}
          />
          <Input
            dark
            label="Bank reference on invoice"
            placeholder="Account or payment reference on the invoice"
            value={input.bankReference}
            onChangeText={(v) => set("bankReference", v)}
            ref={bankRef}
            error={errors.bankReference}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={80}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={()=>taxRef.current?.focus()}
          />
          <Input dark label="Tax reference on invoice" value={input.taxReference??""} onChangeText={v=>set("taxReference",v)} maxLength={100} ref={taxRef} returnKeyType="next" submitBehavior="submit" onSubmitEditing={()=>branchRef.current?.focus()} />
          <Input dark label="Branch code on invoice" value={input.branchCode??""} onChangeText={v=>set("branchCode",v)} maxLength={20} ref={branchRef} keyboardType="number-pad" returnKeyType="done" onSubmitEditing={()=>{void submit();}} />
          <Muted>Leave unavailable tax or branch details blank. Missing fields are flagged; a match requires complete independently reviewed reference details.</Muted>
          <Txt style={[styles.mutedOnPaper, { color: c.muted }]}>
            Checks are saved on this device before syncing. Offline checks remain unverified until the server returns a result.
          </Txt>
        </View>
        <Pressable accessibilityRole="checkbox" accessibilityLabel="I checked these details against the original invoice" accessibilityState={{ checked: confirmed }} onPress={() => setConfirmed(!confirmed)} style={{ paddingVertical: 16, borderTopWidth: 1, borderColor: c.line, flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Icon name={confirmed ? "checkbox" : "square-outline"} color={c.orange} /><Txt style={{ flex: 1 }}>I checked these details against the original invoice</Txt>
        </Pressable>
        <Button
          title="Compare invoice details"
          disabled={!confirmed}
          icon="arrow-forward"
          loading={busy}
          onPress={submit}
        />
        {!!submitError && <Txt accessibilityRole="alert">{submitError}</Txt>}
        <DemoNote />
      </Page>
      <Modal
        visible={picker}
        animationType="slide"
        transparent
        onRequestClose={() => setPicker(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "#000000AA",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close supplier selection"
            onPress={() => setPicker(false)}
            style={{ flex: 1 }}
          />
          <SafeAreaView
            edges={["bottom"]}
            style={{
              backgroundColor: c.surface,
              borderTopLeftRadius: 26,
              borderTopRightRadius: 26,
              paddingHorizontal: 24,
              paddingTop: 22,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Txt style={{ fontSize: 20, fontWeight: "600" }}>
                Choose supplier
              </Txt>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close supplier selection"
                onPress={() => setPicker(false)}
                style={styles.iconButton}
              >
                <Icon name="close" />
              </Pressable>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Supplier not listed" onPress={()=>{setConfirmed(false);setInput(v=>({...v,supplierId:"unknown"}));setPicker(false);}} style={{paddingVertical:18}}><Txt>Supplier not listed</Txt><Muted>Record an elevated-concern assessment without inventing a supplier baseline.</Muted></Pressable>
            {suppliers.map((s) => (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                onPress={() => {
                  setConfirmed(false);
                  setInput((v) => ({
                    ...v,
                    supplierId: s.id,
                  }));
                  setErrors({});
                  setPicker(false);
                  numberRef.current?.focus();
                }}
                style={{
                  minHeight: 63,
                  justifyContent: "center",
                  borderBottomWidth: 1,
                  borderBottomColor: c.line,
                }}
              >
                <Txt>{s.name}</Txt>
              </Pressable>
            ))}
            <View style={{ height: 18 }} />
          </SafeAreaView>
        </View>
      </Modal>
      <FloatingMenu />
    </SafeAreaView>
  );
}
