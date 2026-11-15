import {MfaGate} from "../src/security/MfaGate";
import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { DeviceSecurity } from "../src/security/DeviceSecurity";
import { AuthProvider, useAuth } from "../src/backend/AuthState";
import { DemoProvider } from "../src/state/DemoState";
import { UpdateNotice } from "../src/components/UpdateNotice";
import { color as c } from "../src/theme";
export default function RootLayout() {
  return (
    <AuthProvider><DemoProvider><DeviceSecurity><MfaGate>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <StatusBar style="light" />
        <UpdateNotice />
        <SessionNavigator />
      </View>
    </MfaGate></DeviceSecurity></DemoProvider></AuthProvider>
  );
}

function SessionNavigator() {
  const { ready, accountReady, session, profile, workspace, hasSeenWelcome } = useAuth();
  const loaded = ready && accountReady;
  const complete = !!session && !!profile && !!workspace;
  return <View style={{ flex: 1 }}><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg }, animation: "slide_from_right" }}>
    <Stack.Screen name="(tabs)" />
    <Stack.Protected guard={!session && !hasSeenWelcome}><Stack.Screen name="welcome" /></Stack.Protected>
    <Stack.Protected guard={!complete}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack.Protected>
  </Stack>{!loaded && <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={c.orange} /></View>}</View>;
}
