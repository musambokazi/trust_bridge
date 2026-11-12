import React from "react";
import { View } from "react-native";
import { Txt, Muted } from "../components/ui";
import { color as c } from "../theme";
import { type Assessment } from "../domain/demo";
import { comparisonRows } from "./comparisonModel";
export function Comparison({ item }: { item: Assessment }) {
 return <View style={{ gap: 16, borderTopWidth: 1, borderColor: c.line, paddingTop: 20 }}>
  <Txt accessibilityRole="header" style={{ fontSize: 22, fontWeight: "600" }}>Side-by-side comparison</Txt>
  <Muted>{item.comparison ? `Saved reference version ${item.comparison.supplierVersion}, captured when the server compared this invoice. Later supplier edits do not change this snapshot.` : "This older or pending check has no full comparison snapshot. Uncaptured fields are unavailable; the current supplier record is not substituted."}</Muted>
  <View style={{ flexDirection: "row", gap: 16 }}><Txt style={{ flex: 1, color: c.muted }}>Saved reference</Txt><Txt style={{ flex: 1, color: c.muted }}>On the invoice</Txt></View>
  {comparisonRows(item).map(row => <View key={row.field} style={{ gap: 8, paddingBottom: 16, borderBottomWidth: 1, borderColor: c.line }}>
   <Txt style={{ fontWeight: "600" }}>{row.label}</Txt>
   <View style={{ flexDirection: "row", gap: 16 }}><Txt selectable style={{ flex: 1, minWidth: 0 }}>{row.reference}</Txt><Txt selectable style={{ flex: 1, minWidth: 0, color: row.matches === false ? c.orange : c.white }}>{row.invoice}</Txt></View>
   <Txt style={{ color: row.matches === false ? c.orange : c.muted }}>{row.matches === undefined ? "Not compared" : row.matches ? "Match" : "Different"}</Txt>
  </View>)}
  <Muted>Bank references are masked. The match is calculated from the complete values on the server; equal final digits alone never prove a match.</Muted>
 </View>;
}
