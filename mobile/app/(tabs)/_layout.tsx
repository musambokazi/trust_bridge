import React from "react";
import { Redirect, Slot } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FloatingMenu } from "../../src/components/FloatingMenu";
import { color as c } from "../../src/theme";
import { useDemo } from "../../src/state/DemoState";
export default function TabsLayout() {
  if (!useDemo().enteredWorkspace) return <Redirect href="/welcome" />;
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
