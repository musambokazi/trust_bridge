import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Eyebrow, Heading, Input, Muted, Page, ScreenHeader, Txt } from "../src/components/ui";
import { color as c } from "../src/theme";

type Field = { key: string; label: string; type?: "email" | "phone"; optional?: boolean };
const individual: Field[][] = [
  [{ key: "first", label: "First name" }, { key: "last", label: "Surname" }],
  [{ key: "email", label: "Email address", type: "email" }, { key: "phone", label: "Cell phone number", type: "phone" }],
];
const company: Field[][] = [
  [{ key: "company", label: "Legal company name" }, { key: "registration", label: "Company registration number" }, { key: "tax", label: "Company tax number" }, { key: "address", label: "Registered company address" }, { key: "country", label: "Country" }],
  [{ key: "contact", label: "Authorised contact name" }, { key: "role", label: "Your role" }, { key: "email", label: "Company email address", type: "email" }, { key: "phone", label: "Company phone number", type: "phone" }, { key: "backupEmail", label: "Alternative email address", type: "email", optional: true }, { key: "backupPhone", label: "Alternative phone number", type: "phone", optional: true }],
  [{ key: "industry", label: "Industry" }, { key: "offering", label: "Products or services provided" }],
];

export default function SignUp() {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<"individual" | "company">("individual");
  const [data, setData] = useState<Record<string, string>>({});
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const groups = kind === "company" ? company : individual;
  const titles = kind === "company" ? ["Company details", "Business contacts", "Business activity"] : ["Personal details", "Contact details"];
  const passwordStep = groups.length + 1;
  const reviewStep = passwordStep + 1;
  const fields = groups[step - 1] ?? [];
  const rules = [
    ["At least 8 characters", password.length >= 8],
    ["Uppercase and lowercase letters", /[A-Z]/.test(password) && /[a-z]/.test(password)],
    ["A number", /\d/.test(password)],
    ["A special character", /[^\p{L}\p{N}\s]/u.test(password)],
  ] as const;
  const score = rules.filter(([, passed]) => passed).length;
  const strength = !password ? "Not entered" : score < 3 ? "Weak" : score === 3 || password.length < 12 ? "Fair" : "Strong";
  function next() {
    for (const field of fields) {
      const value = data[field.key]?.trim() ?? "";
      if (!value && field.optional) continue;
      const phone = value.replace(/[\s().-]/g, "");
      if (!value || (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) || (field.type === "phone" && !/^\+?\d{7,15}$/.test(phone))) {
        setError(`Enter a valid ${field.label.toLowerCase()}.`);
        return;
      }
    }
    if (step === passwordStep && (score !== rules.length || confirmation !== password)) {
      setError(score !== rules.length ? "Meet all four password requirements." : "The passwords do not match.");
      return;
    }
    if (step === passwordStep) { setPassword(""); setConfirmation(""); setVisible(false); }
    setError("");
    setStep(step + 1);
  }
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenHeader back title="Create an account" />
      <Page style={{ paddingBottom: 32 }}>
        <View style={{ gap: 12 }}>
          <Eyebrow>STEP {step + 1} OF {reviewStep + 1}</Eyebrow>
          <Heading>{step === 0 ? "Choose your account type" : step === passwordStep ? "Set a password" : step === reviewStep ? "Review your details" : titles[step - 1]}</Heading>
          <Muted>Online registration is not available yet. Use example details and a password you do not use elsewhere. Nothing is submitted or saved.</Muted>
        </View>
        {step === 0 && <View style={{ gap: 10 }}>
          {(["individual", "company"] as const).map((value) => <Button key={value} title={value === "company" ? "Company" : "Individual"} secondary={kind !== value} icon={kind === value ? "checkmark" : undefined} onPress={() => { if (kind !== value) setData({}); setKind(value); }} />)}
          <Muted>{kind === "company" ? "For a registered business and its authorised contact." : "For a person using TrustBridge in their own name."}</Muted>
        </View>}
        {fields.map((field) => (
          <Input key={field.key} dark label={field.label + (field.optional ? " (optional)" : "")} value={data[field.key] ?? ""} onChangeText={(value) => { setData((current) => ({ ...current, [field.key]: value })); setError(""); }} maxLength={field.type === "email" ? 254 : 250} autoCapitalize={field.type ? "none" : "sentences"} autoComplete="off" keyboardType={field.type === "email" ? "email-address" : field.type === "phone" ? "phone-pad" : "default"} />
        ))}
        {step === passwordStep && <>
          <Input dark label="Password" secureTextEntry={!visible} value={password} onChangeText={(value) => { setPassword(value); setError(""); }} autoCapitalize="none" autoComplete="off" maxLength={128} />
          <Input dark label="Confirm password" secureTextEntry={!visible} value={confirmation} onChangeText={(value) => { setConfirmation(value); setError(""); }} autoCapitalize="none" autoComplete="off" maxLength={128} />
          <Button secondary title={visible ? "Hide passwords" : "Show passwords"} onPress={() => setVisible(!visible)} />
          <View style={{ gap: 6 }}>
            <Txt accessibilityLiveRegion="polite">Password strength: {strength}</Txt>
            <View style={{ flexDirection: "row", gap: 4 }} aria-hidden>
              {rules.map(([label], index) => <View key={label} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: index < score ? c.orange : c.line }} />)}
            </View>
            {rules.map(([label, passed]) => <Muted key={label}>{passed ? "Met" : "Required"} · {label}</Muted>)}
            {!!confirmation && <Muted>{confirmation === password ? "Passwords match." : "Passwords do not match."}</Muted>}
          </View>
        </>}
        {step === reviewStep && <View style={{ gap: 10 }}>
          <Txt>{kind === "company" ? "Company account" : "Individual account"}</Txt>
          {groups.flat().filter(({ key }) => !!data[key]?.trim()).map(({ key, label }) => <View key={key}><Muted>{label}</Muted><Txt>{data[key]?.trim()}</Txt></View>)}
          <Muted>No account was created. Online registration will be available when the account service is connected.</Muted>
        </View>}
        {!!error && <Txt accessibilityRole="alert">{error}</Txt>}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          {step > 0 ? <Button secondary title="Previous" onPress={() => { setError(""); setStep(step - 1); }} /> : <View />}
          {step < reviewStep ? <Button title="Next" onPress={next} /> : <Button title="Done" onPress={() => { setData({}); if (router.canGoBack()) router.back(); else router.replace("/sign-in"); }} />}
        </View>
      </Page>
    </SafeAreaView>
  );
}
