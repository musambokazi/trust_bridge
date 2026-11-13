import React, { useRef, useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
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
} from "../../src/components/ui";
import {
  validateInvoice,
  type InvoiceInput,
} from "../../src/domain/demo";
import { useDemo } from "../../src/state/DemoState";
import { InvoiceImportDialog } from "../../src/invoices/InvoiceImportDialog";
import { color as c } from "../../src/theme";
const blank: InvoiceInput = {
  supplierId: "",
  invoiceNumber: "",
  supplierName: "",
  amount: "",
  bankReference: "",
};
export default function CheckInvoice() {
  const { suppliers, check } = useDemo();
  const { supplier: supplierParam } = useLocalSearchParams<{
    supplier?: string;
  }>();
  const initialSupplier = suppliers.find((s) => s.id === supplierParam);
  const [input, setInput] = useState<InvoiceInput>({
    ...blank,
    supplierId: initialSupplier?.id || "",
    supplierName: initialSupplier?.name || "",
  });
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
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const [importOpen, setImportOpen] = useState(false);
  const [importNotice, setImportNotice] = useState("");
  const [submitError, setSubmitError] = useState("");
  const submit = async () => {
    const e = validateInvoice(input);
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setSubmitError("");
    try {
      const id = await check(input);
      setInput(blank);
      router.push(`/assessment/${id}`);
    } catch (error) { setSubmitError(error instanceof Error ? error.message : "Unable to save check."); }
    finally { setBusy(false); }
  };
  return (
    <>
      <ScreenHeader />
      <Page>
        <View style={{ gap: 12 }}>
          <Eyebrow>COMPARE, THEN CONFIRM</Eyebrow>
          <Heading>Small details.{"\n"}Big difference.</Heading>
          <Muted>
            Enter what’s on the invoice. We’ll show how it compares with your
            saved supplier record.
          </Muted>
        </View>
        <Button secondary title="Import invoice photo, PDF or text" icon="document-attach-outline" disabled={busy} onPress={() => setImportOpen(true)} />
        {!!importNotice && <Txt accessibilityLiveRegion="polite">{importNotice}</Txt>}
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
            placeholder="e.g. DEMO4318"
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
        <Button
          title="Compare invoice details"
          icon="arrow-forward"
          loading={busy}
          onPress={submit}
        />
        {!!submitError && <Txt accessibilityRole="alert">{submitError}</Txt>}
        <DemoNote />
      </Page>
      <InvoiceImportDialog visible={importOpen} onClose={() => setImportOpen(false)} onApply={draft => {
        setInput(current => ({ ...current, ...draft })); setErrors({});
        setImportNotice("Reviewed fields added. Confirm the supplier record and compare when ready.");
      }} />
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
            <Pressable accessibilityRole="button" accessibilityLabel="Supplier not listed" onPress={()=>{setInput(v=>({...v,supplierId:"unknown",supplierName:""}));setPicker(false);}} style={{paddingVertical:18}}><Txt>Supplier not listed</Txt><Muted>Record an elevated-concern assessment without inventing a supplier baseline.</Muted></Pressable>
            {suppliers.map((s) => (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                onPress={() => {
                  setInput((v) => ({
                    ...v,
                    supplierId: s.id,
                    supplierName: s.id === "unknown" ? "" : s.name,
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
    </>
  );
}
