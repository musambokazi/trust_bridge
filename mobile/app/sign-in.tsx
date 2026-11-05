import React from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Heading, Muted, Page, ScreenHeader, Txt } from "../src/components/ui";
import { useDemo } from "../src/state/DemoState";

export default function SignIn() {
  const { enterWorkspace } = useDemo();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenHeader back title="Your account" />
      <Page>
        <Heading>Welcome to TrustBridge</Heading>
        <Txt accessibilityRole="header">Sign in</Txt>
        <Muted>Online sign-in is not available yet. You can review the registration form or continue to the offline workspace without an account.</Muted>
        <Button title="Create an account" onPress={() => router.push("/sign-up")} />
        <Button secondary title="Continue offline" onPress={() => { enterWorkspace(); router.replace("/"); }} />
      </Page>
    </SafeAreaView>
  );
}
