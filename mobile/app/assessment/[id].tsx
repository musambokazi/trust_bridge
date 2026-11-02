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
import { useDemo } from "../../src/state/DemoState";
import { maskReference } from "../../src/domain/demo";
import { color as c, money } from "../../src/theme";
export default function AssessmentResult() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { assessments } = useDemo();
  const item = assessments.find((a) => a.id === id);
  if (!item)
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScreenHeader back title="Assessment" />
        <Page>
          <Heading>This preview has expired.</Heading>
          <Muted>
            Demo checks are kept only in this app session. Start another check
            to see a result.
          </Muted>
          <Button
            title="Check an invoice"
            onPress={() => router.replace("/check")}
          />
        </Page>
      </SafeAreaView>
    );
  const review = item.level !== "clear";
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
      <ScreenHeader back title="Assessment" />
      <Page style={{ paddingBottom: 45 }}>
        <View style={{ gap: 14 }}>
          <Eyebrow>DEMO RESULT / {item.invoiceNumber}</Eyebrow>
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 17,
              backgroundColor: c.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon
              name={review ? "alert-outline" : "checkmark-outline"}
              color={c.orange}
              size={30}
            />
          </View>
          <Heading>
            {review ? "Pause.\nTake a closer look." : "The details\nline up."}
          </Heading>
          <Txt
            style={{ color: review ? c.orange : c.white, fontWeight: "500" }}
          >
            {review
              ? item.level === "unknown"
                ? "Supplier identity needs verification"
                : "Discrepancies need your attention"
              : "No discrepancies detected by these demo checks"}
          </Txt>
          <Muted>
            {item.supplierName} · {money(item.amount)}
          </Muted>
        </View>
        <View style={styles.paper}>
          <Txt style={styles.paperTitle}>What we found</Txt>
          {item.findings.map((f, i) => (
            <View
              key={f.field}
              style={{
                gap: 7,
                paddingBottom: i < item.findings.length - 1 ? 19 : 0,
                borderBottomWidth: i < item.findings.length - 1 ? 1 : 0,
                borderColor: c.paperLine,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Icon
                  name={
                    f.mismatch
                      ? "alert-circle-outline"
                      : "checkmark-circle-outline"
                  }
                  color={f.mismatch ? c.warning : c.paperMuted}
                  size={18}
                />
                <Txt style={{ fontWeight: "600", color: c.ink, flex: 1 }}>
                  {f.title}
                </Txt>
              </View>
              <Txt style={styles.mutedOnPaper}>{f.detail}</Txt>
              {f.field === "bank" && (
                <View
                  style={{
                    gap: 10,
                    backgroundColor: "#EFEFEB",
                    padding: 13,
                    borderRadius: 10,
                    marginTop: 4,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <Txt style={styles.mutedOnPaper}>On record</Txt>
                    <Txt style={{ color: c.ink, fontWeight: "600" }}>
                      {maskReference(item.approvedReference || "")}
                    </Txt>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <Txt style={styles.mutedOnPaper}>On invoice</Txt>
                    <Txt
                      style={{
                        color: f.mismatch ? c.warning : c.ink,
                        fontWeight: "600",
                      }}
                    >
                      {maskReference(item.submittedReference)}
                    </Txt>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
        <View
          style={{
            paddingLeft: 17,
            borderLeftWidth: 3,
            borderColor: c.orange,
            gap: 9,
          }}
        >
          <Txt style={{ fontSize: 17, fontWeight: "600" }}>Your next move</Txt>
          <Muted>
            {review
              ? "Independently confirm the details using a supplier contact you already trust. Do not rely on contact details included in the suspicious invoice."
              : "Continue your usual approval process. A match does not establish authenticity or authorise payment."}
          </Muted>
        </View>
        <Txt style={{ color: c.muted, fontSize: 12 }}>
          This comparison is not proof of fraud, a guarantee of authenticity or
          a payment approval.
        </Txt>
        <Button
          title={
            item.level === "unknown"
              ? "View supplier records"
              : "View supplier record"
          }
          icon="arrow-forward"
          onPress={() =>
            router.push(
              item.level === "unknown"
                ? "/suppliers"
                : `/supplier/${item.supplierId}`,
            )
          }
        />
        <Button
          secondary
          title="Back to assessment history"
          onPress={() => router.replace("/history")}
        />
        <Txt style={{ color: c.muted, fontSize: 11 }}>
          Demo reference: {item.id}
          {"\n"}
          {new Date(item.date).toLocaleString("en-ZA", {
            timeZone: "Africa/Johannesburg",
          })}{" "}
          SAST · This session only
        </Txt>
        <DemoNote />
      </Page>
    </SafeAreaView>
  );
}
