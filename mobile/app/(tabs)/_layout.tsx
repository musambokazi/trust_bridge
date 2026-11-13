import React from "react";
import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../src/backend/AuthState";
import { SafeAreaView } from "react-native-safe-area-context";
import { FloatingMenu } from "../../src/components/FloatingMenu";
import { color as c } from "../../src/theme";
import { useDemo } from "../../src/state/DemoState";
export default function TabsLayout() {
  const { ready, accountReady, session, profile, workspace } = useAuth();
  const { loading } = useDemo();
  if (!ready || !accountReady) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator color={c.orange} /></View>;
  if (!session) return <Redirect href="/welcome" />;
  if (!profile || !workspace) return <Redirect href="/sign-in" />;
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      <Slot />
      <FloatingMenu />
      {loading&&<View style={{position:"absolute",top:0,left:0,right:0,bottom:0,backgroundColor:c.bg,justifyContent:"center",alignItems:"center"}}><ActivityIndicator color={c.orange}/></View>}
    </SafeAreaView>
  );
}
