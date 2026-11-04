import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Eyebrow, Heading, Input, Muted, Page, ScreenHeader, Txt } from "../src/components/ui";

const initial = { first: "", last: "", username: "", email: "", country: "", company: "", registration: "", role: "" };
type Field = keyof typeof initial;
const titles = ["Choose your account type", "Tell us about yourself", "Set up your workspace", "Review your details"];

export default function SignUp() {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<"individual" | "company">("individual");
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  function field(key: Field, label: string) {
    return <Input dark label={label} value={data[key]} onChangeText={(value) => { setData((current) => ({ ...current, [key]: value })); setError(""); }} maxLength={key === "email" ? 254 : 100} autoCapitalize={key === "email" || key === "username" ? "none" : "words"} keyboardType={key === "email" ? "email-address" : "default"} />;
  }
  function next() {
    if (step === 1 && (!data.first.trim() || !data.last.trim() || !/^[a-z0-9_]{3,30}$/i.test(data.username.trim()) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))) {
      setError("Enter your first and last names, a valid email, and a username with 3–30 letters, numbers or underscores.");
      return;
    }
    if (step === 2 && (!data.country.trim() || (kind === "company" && (!data.company.trim() || !data.role.trim())))) {
      setError(kind === "company" ? "Enter the business name, country and your role." : "Enter your country.");
      return;
    }
    setError("");
    setStep(step + 1);
  }
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenHeader back title="Create an account" />
      <Page style={{ paddingBottom: 32 }}>
        <View style={{ gap: 12 }}>
          <Eyebrow>STEP {step + 1} OF 4</Eyebrow>
          <Heading>{titles[step]}</Heading>
          <Muted>Signup preview. Use sample details only. No account is created and nothing is submitted.</Muted>
        </View>
        {step === 0 && (
          <>
            <Button title="Individual" icon={kind === "individual" ? "checkmark" : undefined} secondary={kind !== "individual"} onPress={() => setKind("individual")} />
            <Button title="Company" icon={kind === "company" ? "checkmark" : undefined} secondary={kind !== "company"} onPress={() => setKind("company")} />
            <Muted>{kind === "company" ? "Set up a business workspace. This does not grant access to any existing company account." : "Set up a workspace for your own supplier checks."}</Muted>
          </>
        )}
        {step === 1 && <>{field("first", "First name")}{field("last", "Last name")}{field("username", "Username")}{field("email", "Email address")}</>}
        {step === 2 && <>{field("country", "Country")}{kind === "company" && <>{field("company", "Legal business name")}{field("registration", "Registration number (optional)")}{field("role", "Your role")}</>}</>}
        {step === 3 && (
          <View style={{ gap: 8 }}>
            <Txt>{data.first.trim()} {data.last.trim()} · @{data.username.trim()}</Txt>
            <Muted>{data.email.trim()}</Muted>
            <Muted>{kind === "company" ? `${data.company.trim()} · ${data.role.trim()} · ${data.country.trim()}` : `Individual · ${data.country.trim()}`}</Muted>
            {kind === "company" && !!data.registration.trim() && <Muted>Registration: {data.registration.trim()}</Muted>}
            <Muted>Password setup and email confirmation will be available when live account creation is connected.</Muted>
          </View>
        )}
        {!!error && <Txt accessibilityRole="alert">{error}</Txt>}
        {step < 3 ? <Button title="Continue" onPress={next} /> : <Button title="Return to sign in" onPress={() => router.canGoBack() ? router.back() : router.replace("/sign-in")} />}
        {step > 0 && <Button secondary title="Previous step" onPress={() => { setError(""); setStep(step - 1); }} />}
      </Page>
    </SafeAreaView>
  );
}
