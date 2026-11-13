import React from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "./AuthState";
export function AccountGate({ children }: { children: React.ReactNode }) {
 const { ready, accountReady, session, profile, workspace } = useAuth();
 if (!ready || !accountReady) return <ActivityIndicator style={{ flex: 1 }} />;
 if (!session || !profile || !workspace) return <Redirect href="/sign-in" />;
 // Changing account remounts form state as well as clearing provider caches.
 return <View key={session.user.id+":"+workspace.id} style={{ flex: 1 }}>{children}</View>;
}
