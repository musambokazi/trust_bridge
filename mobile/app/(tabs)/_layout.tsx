import React from "react";
import { Slot } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FloatingMenu } from "../../src/components/FloatingMenu";
import { color as c } from "../../src/theme";
export default function TabsLayout() {
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      <Slot />
      <FloatingMenu />
    </SafeAreaView>
  );
}
