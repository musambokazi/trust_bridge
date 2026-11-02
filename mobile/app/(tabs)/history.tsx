import React, { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  AssessmentRow,
  DemoNote,
  Eyebrow,
  Heading,
  Icon,
  Muted,
  Page,
  ScreenHeader,
  Txt,
} from "../../src/components/ui";
import { useDemo } from "../../src/state/DemoState";
import { color as c } from "../../src/theme";
export default function History() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const [selected, setSelected] = useState(
    filter === "review" ? "review" : "all",
  );
  const [query, setQuery] = useState("");
  const { assessments } = useDemo();
  useEffect(() => {
    setSelected(filter === "review" ? "review" : "all");
  }, [filter]);
  const results = assessments.filter(
    (a) =>
      (selected === "all" ||
        (selected === "review" ? a.level !== "clear" : a.level === "clear")) &&
      `${a.invoiceNumber} ${a.supplierName}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <ScreenHeader />
      <Page>
        <View style={{ gap: 12 }}>
          <Eyebrow>ASSESSMENT HISTORY</Eyebrow>
          <Heading>Every check.{"\n"}A clearer picture.</Heading>
          <Muted>Revisit findings and the details behind them.</Muted>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: c.surface,
            borderRadius: 14,
            paddingHorizontal: 15,
            gap: 9,
          }}
        >
          <Icon name="search-outline" color={c.muted} size={18} />
          <TextInput
            accessibilityLabel="Search assessments"
            placeholder="Invoice number or supplier"
            placeholderTextColor={c.muted}
            value={query}
            onChangeText={setQuery}
            style={{ flex: 1, minHeight: 51, color: c.white, fontSize: 14 }}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            borderBottomWidth: 1,
            borderBottomColor: c.line,
            gap: 24,
          }}
          accessibilityRole="tablist"
        >
          {[
            ["all", "All checks"],
            ["review", "Needs review"],
            ["clear", "No discrepancies"],
          ].map(([id, title]) => (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: selected === id }}
              onPress={() => setSelected(id!)}
              style={{
                minHeight: 44,
                justifyContent: "center",
                borderBottomWidth: 2,
                borderBottomColor: selected === id ? c.orange : "transparent",
              }}
            >
              <Txt
                style={{
                  color: selected === id ? c.orange : c.muted,
                  fontSize: 11,
                }}
              >
                {title}
              </Txt>
            </Pressable>
          ))}
        </View>
        <View>
          {results.map((a) => (
            <AssessmentRow key={a.id} item={a} />
          ))}
          {!results.length && (
            <View style={{ paddingVertical: 28, gap: 10 }}>
              <Icon name="documents-outline" color={c.muted} size={32} />
              <Txt>No assessments here yet.</Txt>
              <Muted>Try a different filter or check an invoice.</Muted>
            </View>
          )}
        </View>
        <DemoNote />
      </Page>
    </>
  );
}
