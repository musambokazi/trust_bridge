import React from "react";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Heading,
  Muted,
  Page,
  ScreenHeader,
} from "../src/components/ui";
export default function NotFound() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenHeader back title="TrustBridge" />
      <Page>
        <Heading>Let’s get you back.</Heading>
        <Muted>This screen is not available in the UI preview.</Muted>
        <Button title="Go to dashboard" onPress={() => router.replace("/")} />
      </Page>
    </SafeAreaView>
  );
}
