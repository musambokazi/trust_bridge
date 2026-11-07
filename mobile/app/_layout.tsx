import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { DeviceSecurity } from "../src/security/DeviceSecurity";
import { AuthProvider } from "../src/backend/AuthState";
import { DemoProvider } from "../src/state/DemoState";
import { UpdateNotice } from "../src/components/UpdateNotice";
import { color as c } from "../src/theme";
export default function RootLayout() {
  return (
    <AuthProvider><DemoProvider><DeviceSecurity>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <StatusBar style="light" />
        <UpdateNotice />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: c.bg },
            animation: "slide_from_right",
          }}
        />
      </View>
    </DeviceSecurity></DemoProvider></AuthProvider>
  );
}
