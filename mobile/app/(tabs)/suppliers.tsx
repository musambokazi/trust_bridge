import React, { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { router } from "expo-router";
import {
  DemoNote,
  Eyebrow,
  Heading,
  Icon,
  Muted,
  Page,
  ScreenHeader,
  Txt,
} from "../../src/components/ui";
import { suppliers } from "../../src/domain/demo";
import { color as c } from "../../src/theme";
export default function Suppliers() {
  const [query, setQuery] = useState("");
  const results = suppliers.filter((s) =>
    `${s.name} ${s.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <ScreenHeader />
      <Page>
        <View style={{ gap: 12 }}>
          <Eyebrow>YOUR REFERENCE POINT</Eyebrow>
          <Heading>Know who{"\n"}you’re paying.</Heading>
          <Muted>
            Keep the right details close. Start every check with an approved
            reference.
          </Muted>
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
            accessibilityLabel="Search suppliers"
            placeholder="Search suppliers"
            placeholderTextColor={c.muted}
            value={query}
            onChangeText={setQuery}
            style={{ flex: 1, minHeight: 51, color: c.white, fontSize: 14 }}
          />
        </View>
        <Txt style={{ color: c.muted, fontSize: 11 }}>
          {results.length} SUPPLIER RECORDS
        </Txt>
        <View>
          {results.map((s) => (
            <Pressable
              key={s.id}
              accessibilityRole="button"
              onPress={() => router.push(`/supplier/${s.id}`)}
              style={{
                flexDirection: "row",
                gap: 13,
                alignItems: "center",
                paddingVertical: 20,
                borderBottomWidth: 1,
                borderBottomColor: c.line,
              }}
            >
              <View
                style={{
                  width: 46,
                  height: 46,
                  backgroundColor: c.raised,
                  borderRadius: 15,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Txt
                  style={{
                    fontWeight: "600",
                    color: s.verified ? c.white : c.orange,
                  }}
                >
                  {s.initials}
                </Txt>
              </View>
              <View style={{ flex: 1, gap: 5 }}>
                <Txt style={{ fontWeight: "600", fontSize: 15 }}>{s.name}</Txt>
                <Txt style={{ color: c.muted, fontSize: 12 }}>{s.category}</Txt>
                <Txt
                  style={{
                    color: s.verified ? c.muted : c.orange,
                    fontSize: 11,
                  }}
                >
                  {s.verified
                    ? "Reviewed reference · Demo"
                    : "Reference needs verification"}
                </Txt>
              </View>
              <Icon name="chevron-forward" size={16} color={c.muted} />
            </Pressable>
          ))}
          {!results.length && (
            <Muted>No suppliers match “{query}”. Try another name.</Muted>
          )}
        </View>
        <DemoNote />
      </Page>
    </>
  );
}
