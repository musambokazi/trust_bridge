import { AccountGate } from "../../src/backend/AccountGate";
import { Comparison } from "../../src/workflow/Comparison";
import { ReviewEditor } from "../../src/workflow/ReviewEditor";
import { ReportExport } from "../../src/workflow/ReportExport";
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
function AssessmentResultContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { assessments } = useDemo();
  const item = assessments.find((a) => a.id === id);
  if (!item)
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScreenHeader back title="Assessment" />
        <Page>
          <Heading>This result is no longer available.</Heading>
          <Muted>
            Only saved checks for your signed-in account are available here. Start another check
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
          <Eyebrow>ACCOUNT RESULT / {item.invoiceNumber}</Eyebrow>
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
            {item.level==="elevated"?"Hold payment.\nEscalate for review.":review ? "Pause.\nTake a closer look." : "The details\nline up."}
          </Heading>
          <Txt
            style={{ color: review ? c.orange : c.white, fontWeight: "500" }}
          >
            {review
              ? item.level === "unknown"
                ? "Waiting for server comparison"
                : item.level==="elevated"?"Elevated Concern":"Review Required"
              : "Low Concern · No discrepancies detected"}
          </Txt>
          <Muted>
            {item.supplierName} · {money(item.amount)}
          </Muted>
        </View>
        <Txt style={{fontWeight:"600"}}>{item.level==="unknown"?"Waiting for server comparison":item.level==="elevated"?"Elevated Concern":item.level==="clear"?"Low Concern":"Review Required"}</Txt>
        <Comparison item={item} />
        <ReviewEditor id={item.id} />
        <ReportExport item={item} />
        <View style={[styles.paper, { backgroundColor: c.surface }]}>
          <Txt style={[styles.paperTitle, { color: c.white }]}>What we found</Txt>
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
                <Txt style={{ fontWeight: "600", color: c.white, flex: 1 }}>
                  {f.title}
                </Txt>
              </View>
              <Txt style={{ color: c.muted }}>{f.detail}</Txt>
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
            {item.recommendedAction??(review
              ? "Independently confirm the details using a supplier contact you already trust. Do not rely on contact details included in the suspicious invoice."
              : "Continue your usual approval process. A match does not establish authenticity or authorise payment.")}
          </Muted>
        </View>
        <Txt style={{ color: c.muted, fontSize: 12 }}>
          This comparison is not proof of fraud, a guarantee of authenticity or
          a payment approval.
        </Txt>
        <Button
          title={
            item.supplierId === "unknown"
              ? "View supplier records"
              : "View supplier record"
          }
          icon="arrow-forward"
          onPress={() =>
            router.push(
              item.supplierId === "unknown"
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
          Reference: {item.id.replace(/^preview-/, "local-")}
          {"\n"}
          {new Date(item.date).toLocaleString("en-ZA", {
            timeZone: "Africa/Johannesburg",
          })}{" "}
          SAST · Saved comparison record
        </Txt>
        <DemoNote />
      </Page>
    </SafeAreaView>
  );
}

export default function AssessmentResult() { return <AccountGate><AssessmentResultContent /></AccountGate>; }
