import { AccountGate } from "../../src/backend/AccountGate";
import React from "react";
import { View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  DemoNote,
  Eyebrow,
  Heading,
  Icon,
  Muted,
  Page,
  ScreenHeader,
  Txt,
  styles,
} from "../../src/components/ui";
import { maskReference } from "../../src/domain/demo";
import { useDemo } from "../../src/state/DemoState";
import { color as c } from "../../src/theme";
function SupplierDetailContent() {
  const { suppliers, history, operations } = useDemo();
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = suppliers.find((v) => v.id === id);
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
      <ScreenHeader back title="Supplier record" />
      <Page style={{ paddingBottom: 50 }}>
        {s ? (
          <>
            <View style={{ gap: 14 }}>
              <Eyebrow>YOUR SUPPLIER REFERENCE</Eyebrow>
              <View
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 19,
                  backgroundColor: c.surface,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Txt style={{ fontSize: 23, color: c.orange }}>
                  {s.initials}
                </Txt>
              </View>
              <Heading>{s.name}</Heading>
              <Muted>{s.category}</Muted>
            </View>
            <View style={styles.paper}>
              <Txt style={styles.paperTitle}>Reference details</Txt>
              {[
                ["Registration reference", s.registration],
                ["Bank reference", maskReference(s.bankReference)],
                [
                  "Record status",
                  s.verified ? "Marked reviewed by you" : "Needs verification",
                ],
                ["Last reviewed", s.verifiedOn || "Not reviewed"],
                ["Contact on record", s.contact],
              ].map(([label, value]) => (
                <View key={label} style={{ gap: 5 }}>
                  <Txt style={styles.mutedOnPaper}>{label}</Txt>
                  <Txt selectable style={{ color: c.ink, fontWeight: "500" }}>
                    {value}
                  </Txt>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Icon
                name="information-circle-outline"
                color={c.orange}
                size={20}
              />
              <View style={{ flex: 1 }}>
                <Muted>
                  A reviewed reference is a comparison baseline, not a guarantee
                  that an invoice is genuine. Supplier changes require
                  authorised review in the live service.
                </Muted>
              </View>
            </View>
            <Button
              title="Check an invoice for this supplier"
              icon="arrow-forward"
              onPress={() =>
                router.push({ pathname: "/check", params: { supplier: s.id } })
              }
            />
            <Button secondary title="Edit supplier reference" onPress={() => router.push({ pathname: "/edit-supplier", params: { id: s.id } })} />
            {operations.some(o => o.kind === "supplier" && o.entityId === s.id) && <Button secondary title="Supplier edit waiting to sync" onPress={() => router.push("/sync")} />}
            <Txt style={{ fontSize: 22, fontWeight: "600" }}>Supplier change history</Txt>
            <Muted>Server-written records, with bank references masked. History begins when this feature was enabled; earlier changes may not be available.</Muted>
            {history.filter(h => h.supplier_id === s.id).map(h => <View key={h.id} style={{ gap: 8, paddingTop: 16, borderTopWidth: 1, borderColor: c.line }}>
              <Txt style={{ fontWeight: "600" }}>Version {h.version} · {new Date(h.created_at).toLocaleString()}</Txt>
              <Muted>{h.actor_id ? "Changed by your signed-in account" : "Recorded by the service"}</Muted><Txt>{h.reason}</Txt>
              {Object.keys(h.after_values).map(key => <View key={key} style={{ gap: 3 }}><Txt>{key}: {String(h.before_values?.[key] ?? "Not previously captured")} → {String(h.after_values[key] ?? "Not set")}</Txt></View>)}
            </View>)}
            {!history.some(h => h.supplier_id === s.id) && <Muted>No change history is cached for this supplier.</Muted>}
            <DemoNote />
          </>
        ) : (
          <>
            <Heading>Supplier not found.</Heading>
            <Muted>This supplier is not available in the your directory.</Muted>
            <Button
              title="Back to suppliers"
              onPress={() => router.replace("/suppliers")}
            />
          </>
        )}
      </Page>
    </SafeAreaView>
  );
}

export default function SupplierDetail() { return <AccountGate><SupplierDetailContent /></AccountGate>; }
