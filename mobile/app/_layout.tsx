import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { DemoProvider } from "../src/state/DemoState";
import { color as c } from "../src/theme";
export default function RootLayout() {
  return (
    <DemoProvider>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: c.bg },
            animation: "slide_from_right",
          }}
        />
      </View>
    </DemoProvider>
  );
}
