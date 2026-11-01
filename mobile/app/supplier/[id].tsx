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
import { maskReference, suppliers } from "../../src/domain/demo";
import { color as c } from "../../src/theme";
export default function SupplierDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = suppliers.find((v) => v.id === id);
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
      <ScreenHeader back title="Supplier record" />
      <Page style={{ paddingBottom: 50 }}>
        {s ? (
          <>
            <View style={{ gap: 14 }}>
              <Eyebrow>FICTIONAL REFERENCE RECORD</Eyebrow>
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
                  s.verified ? "Reviewed (demo)" : "Needs verification",
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
            <DemoNote />
          </>
        ) : (
          <>
            <Heading>Supplier not found.</Heading>
            <Muted>This supplier is not available in the demo directory.</Muted>
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
