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
  suppliers,
  validateInvoice,
  type InvoiceInput,
} from "../../src/domain/demo";
import { useDemo } from "../../src/state/DemoState";
import { color as c } from "../../src/theme";
const blank: InvoiceInput = {
  supplierId: "",
  invoiceNumber: "",
  supplierName: "",
  amount: "",
  bankReference: "",
};
export default function CheckInvoice() {
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
    bankRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const { check } = useDemo();
  const supplier = suppliers.find((s) => s.id === input.supplierId);
  const set = (key: keyof InvoiceInput, value: string) => {
    setInput((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const submit = () => {
    const e = validateInvoice(input);
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    const id = check(input);
    setInput(blank);
    setBusy(false);
    router.push(`/assessment/${id}`);
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
            selected demo record.
          </Muted>
        </View>
        <View style={styles.paper}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                backgroundColor: c.orangeSoft,
                padding: 9,
                borderRadius: 10,
              }}
            >
              <Icon name="document-text-outline" color={c.warning} size={20} />
            </View>
            <View style={{ gap: 3 }}>
              <Txt style={styles.paperTitle}>Invoice details</Txt>
              <Txt style={styles.mutedOnPaper}>
                Manual entry · UI demonstration
              </Txt>
            </View>
          </View>
          <View style={{ gap: 8 }}>
            <Txt style={styles.label}>Supplier record</Txt>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select supplier"
              onPress={() => setPicker(true)}
              style={{
                minHeight: 50,
                borderWidth: 1,
                borderColor: errors.supplierId ? c.warning : c.paperLine,
                borderRadius: 12,
                paddingHorizontal: 13,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <Txt style={{ color: supplier ? c.ink : c.paperMuted, flex: 1 }}>
                {supplier?.name ||
                  (input.supplierId === "unknown"
                    ? "Supplier not listed"
                    : "Choose a supplier")}
              </Txt>
              <Icon name="chevron-down" color={c.paperMuted} size={17} />
            </Pressable>
            {errors.supplierId && (
              <Txt
                accessibilityRole="alert"
                style={{ color: c.warning, fontSize: 12 }}
              >
                {errors.supplierId}
              </Txt>
            )}
          </View>
          <Input
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
            label="Bank reference on invoice"
            placeholder="e.g. DEMO4318"
            value={input.bankReference}
            onChangeText={(v) => set("bankReference", v)}
            ref={bankRef}
            error={errors.bankReference}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={80}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <Txt style={styles.mutedOnPaper}>
            Use fictional information in this preview. The live service and
            secure storage are not connected.
          </Txt>
        </View>
        <Button
          title="Compare demo details"
          icon="arrow-forward"
          loading={busy}
          onPress={submit}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setInput({
              supplierId: "ubuntu",
              invoiceNumber: "INV-1043",
              supplierName: "Ubuntu Supplies",
              amount: "12450.00",
              bankReference: "DEMO7821",
            });
            setErrors({});
          }}
          style={{
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Txt style={{ color: c.orange, fontSize: 13 }}>
            Try an example with changed bank details ↗
          </Txt>
        </Pressable>
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
            {[
              ...suppliers.map((s) => ({ id: s.id, name: s.name })),
              { id: "unknown", name: "Supplier not listed" },
            ].map((s) => (
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
