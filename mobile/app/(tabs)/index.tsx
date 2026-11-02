import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import {
  AssessmentRow,
  Button,
  DemoNote,
  Eyebrow,
  Icon,
  Muted,
  Page,
  ScreenHeader,
  SectionTitle,
  Txt,
  styles,
} from "../../src/components/ui";
import { useDemo } from "../../src/state/DemoState";
import { color as c } from "../../src/theme";
export default function Home() {
  const { assessments, name } = useDemo();
  const review = assessments.filter((a) => a.level !== "clear").length;
  return (
    <>
      <ScreenHeader
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${review} assessments need review`}
            onPress={() =>
              router.push({
                pathname: "/history",
                params: { filter: "review" },
              })
            }
            style={styles.iconButton}
          >
            <Icon name="notifications-outline" size={21} />
            {review > 0 && <View style={s.notificationDot} />}
          </Pressable>
        }
      />
      <Page>
        <View style={{ gap: 12, marginTop: 12 }}>
          <Eyebrow>ACME TRADERS / DEMO WORKSPACE</Eyebrow>
          <Txt style={{ color: c.muted }}>Good to see you, {name}.</Txt>
          <Txt accessibilityRole="header" style={s.heroTitle}>
            A second look.{"\n"}A smarter move<Txt style={s.orangeDot}>.</Txt>
          </Txt>
          <Muted>
            Your next payment deserves a little certainty. Start by comparing
            the details.
          </Muted>
        </View>
        <View style={s.action}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon name="scan-outline" color={c.orange} size={19} />
            <Txt style={{ fontSize: 12, fontWeight: "600" }}>INVOICE CHECK</Txt>
          </View>
          <Txt
            style={{
              fontSize: 22,
              lineHeight: 28,
              fontWeight: "500",
              letterSpacing: -0.5,
            }}
          >
            Does everything add up?
          </Txt>
          <Txt style={{ color: c.muted, fontSize: 13 }}>
            Match the invoice to your supplier record.
          </Txt>
          <Button
            title="Check an invoice"
            icon="arrow-forward"
            onPress={() => router.replace("/check")}
          />
        </View>
        <View style={s.metrics}>
          <View style={{ flex: 1, gap: 5 }}>
            <Txt style={s.number}>
              {String(assessments.length).padStart(2, "0")}
            </Txt>
            <Txt style={{ color: c.muted, fontSize: 12 }}>
              Checks in this preview
            </Txt>
          </View>
          <View style={{ width: 1, backgroundColor: c.line }} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View assessments needing review"
            onPress={() =>
              router.push({
                pathname: "/history",
                params: { filter: "review" },
              })
            }
            style={{ flex: 1, paddingLeft: 24, gap: 5 }}
          >
            <Txt style={[s.number, { color: c.orange }]}>
              {String(review).padStart(2, "0")}
            </Txt>
            <Txt style={{ color: c.muted, fontSize: 12 }}>
              Need a closer look ↗
            </Txt>
          </Pressable>
        </View>
        <View>
          <SectionTitle
            title="Your latest checks"
            action="View all"
            onPress={() => router.replace("/history")}
          />
          {assessments.slice(0, 3).map((a) => (
            <AssessmentRow key={a.id} item={a} />
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 14, paddingVertical: 4 }}>
          <Icon name="bulb-outline" color={c.orange} />
          <View style={{ flex: 1, gap: 5 }}>
            <Txt style={{ fontWeight: "600" }}>
              New bank details? Take a pause.
            </Txt>
            <Muted>
              Call a contact you already trust before paying a changed account.
            </Muted>
          </View>
        </View>
        <DemoNote />
      </Page>
    </>
  );
}
const s = StyleSheet.create({
  heroTitle: {
    fontSize: 39,
    lineHeight: 44,
    fontWeight: "500",
    letterSpacing: -1.9,
  },
  orangeDot: { fontSize: 40, color: c.orange },
  action: {
    backgroundColor: c.surface,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: c.line,
    padding: 21,
    gap: 13,
  },
  metrics: { flexDirection: "row", paddingVertical: 8 },
  number: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "500",
    letterSpacing: -1,
  },
  notificationDot: {
    position: "absolute",
    right: 9,
    top: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: c.orange,
  },
});
