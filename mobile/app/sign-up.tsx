import React, { useRef, useState } from "react";
import { FlatList, InputAccessoryView, Keyboard, Modal, Platform, Pressable, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Eyebrow, Heading, Icon, Input, Muted, Page, ScreenHeader, Txt } from "../src/components/ui";
import { defaultPhoneRegion, normalizePhone, phoneRegions } from "../src/domain/phone";
import * as Linking from "expo-linking";
import { supabase, secureStorage } from "../src/backend/client";
import { useAuth } from "../src/backend/AuthState";
import type { AccountDraft } from "../src/backend/types";
import { color as c } from "../src/theme";

type Field = { key: string; label: string; type?: "email" | "phone"; optional?: boolean };
const individual: Field[][] = [
  [{ key: "first", label: "First name" }, { key: "last", label: "Surname" }, { key: "username", label: "Username" }],
  [{ key: "email", label: "Email address", type: "email" }, { key: "phone", label: "Cell phone number", type: "phone" }],
];
const company: Field[][] = [
  [{ key: "company", label: "Legal company name" }, { key: "registration", label: "Company registration number" }, { key: "tax", label: "Company tax number" }, { key: "address", label: "Registered company address" }, { key: "country", label: "Country" }],
  [{ key: "contact", label: "Authorised contact name" }, { key: "role", label: "Your role" }, { key: "username", label: "Username" }, { key: "email", label: "Company email address", type: "email" }, { key: "phone", label: "Company phone number", type: "phone" }, { key: "backupEmail", label: "Alternative email address", type: "email", optional: true }, { key: "backupPhone", label: "Alternative phone number", type: "phone", optional: true }],
  [{ key: "industry", label: "Industry" }, { key: "offering", label: "Products or services provided" }],
];

export default function SignUp() {
  const { session, completeAccount } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<"individual" | "company">("individual");
  const [data, setData] = useState<Record<string, string>>({});
  const [phoneCountries, setPhoneCountries] = useState<Record<string, typeof defaultPhoneRegion>>({});
  const [picker, setPicker] = useState<Field | null>(null);
  const [countryQuery, setCountryQuery] = useState("");
  const inputRefs = useRef<Record<string, React.ComponentRef<typeof TextInput> | null>>({});
  const regionFor = (key: string) => phoneCountries[key] ?? defaultPhoneRegion;
  const filteredRegions = phoneRegions.filter(([iso, name, dial]) => {
    const query = countryQuery.trim().toLowerCase();
    return name.toLowerCase().includes(query) || iso.toLowerCase() === query || ("+" + dial).startsWith(query) || dial.startsWith(query);
  });
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
      if (!value || (field.key === "username" && !/^[a-zA-Z0-9_]{3,30}$/.test(value)) || (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) || (field.type === "phone" && !normalizePhone(value, regionFor(field.key)))) {
        setError(`Enter a valid ${field.label.toLowerCase()}.`);
        return;
      }
    }
    if (step === passwordStep && (score !== rules.length || confirmation !== password)) {
      setError(score !== rules.length ? "Meet all four password requirements." : "The passwords do not match.");
      return;
    }
    if (step === passwordStep) setVisible(false);
    setError("");
    Keyboard.dismiss();
    setStep(step + 1);
  }
  async function submitAccount() {
    if (busy || submitted) return;
    if (!accepted) { setError("Read and accept the privacy notice and terms before creating your account."); return; }
    setBusy(true); setError("");
    try {
      const phone = normalizePhone(data.phone ?? "", regionFor("phone"));
      const username = (data.username ?? "").trim().toLowerCase();
      if (!phone || !/^[a-z0-9_]{3,30}$/.test(username)) throw Error("Enter a valid phone and a username with 3–30 letters, numbers or underscores.");
      const first = kind === "company" ? (data.contact ?? "").trim().split(/\s+/)[0] ?? "" : (data.first ?? "").trim();
      const last = kind === "company" ? (data.contact ?? "").trim().split(/\s+/).slice(1).join(" ") || "Contact" : (data.last ?? "").trim();
      const email = session?.user.email ?? (data.email ?? "").trim().toLowerCase();
      const draft: AccountDraft = {
        email,
        profile: { first_name: first, last_name: last, username, phone, phone_country: regionFor("phone")[0], text_scale: 1 },
        workspace: {
          kind, name: kind === "company" ? (data.company ?? "").trim() : first + " " + last,
          registration: data.registration?.trim() ?? "", tax_number: data.tax?.trim() ?? "", address: data.address?.trim() ?? "",
          country: kind === "company" ? (data.country ?? "").trim() : regionFor("phone")[1],
          contact_name: kind === "company" ? data.contact?.trim() ?? "" : first + " " + last, contact_role: data.role?.trim() ?? "",
          email, alternate_email: data.backupEmail?.trim() ?? "", phone,
          alternate_phone: data.backupPhone ? normalizePhone(data.backupPhone, regionFor("backupPhone")) ?? "" : "",
          industry: data.industry?.trim() ?? "", offering: data.offering?.trim() ?? "",
        },
      };
      if (session) {
        await completeAccount(draft);
        setPassword(""); setConfirmation(""); router.replace("/");
      } else {
        await secureStorage.setItem("registration-draft", JSON.stringify(draft));
        const result = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: Linking.createURL("auth-callback") },
        });
        setPassword(""); setConfirmation("");
        if (result.error) throw Error("Registration could not be completed. Try again later or sign in if you already have an account.");
        if (result.data.session) { await completeAccount(draft); router.replace("/"); }
        else setSubmitted(true);
      }
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to create account."); }
    finally { setBusy(false); }
  }
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenHeader back title="Create an account" />
      <Page style={{ paddingBottom: 32 }}>
        <View style={{ gap: 12 }}>
          <Eyebrow>STEP {step + 1} OF {reviewStep + 1}</Eyebrow>
          <Heading>{step === 0 ? "Choose your account type" : step === passwordStep ? "Set a password" : step === reviewStep ? "Review your details" : titles[step - 1]}</Heading>
          <Muted>Your details are saved to your private account after email verification. Company registration does not grant access to another company’s workspace.</Muted>
        </View>
        {step === 0 && <View style={{ gap: 10 }}>
          {(["individual", "company"] as const).map((value) => <Button key={value} title={value === "company" ? "Company" : "Individual"} secondary={kind !== value} icon={kind === value ? "checkmark" : undefined} onPress={() => { if (kind !== value) { setData({}); setPhoneCountries({}); } setKind(value); }} />)}
          <Muted>{kind === "company" ? "For a registered business and its authorised contact." : "For a person using TrustBridge in their own name."}</Muted>
        </View>}
        {fields.map((field, index) => {
          const following = fields[index + 1];
          const submit = () => following ? inputRefs.current[following.key]?.focus() : next();
          const isPhone = field.type === "phone";
          const region = regionFor(field.key);
          const accessoryId = `registration-${field.key}`;
          return <View key={field.key} style={{ gap: 8 }}>
            <Input
              ref={(input) => { inputRefs.current[field.key] = input; }}
              dark
              label={field.label + (field.optional ? " (optional)" : "")}
              value={data[field.key] ?? ""}
              onChangeText={(value) => { setData((current) => ({ ...current, [field.key]: isPhone ? value.replace(/[^+0-9 ()-]/g, "") : value })); setError(""); }}
              maxLength={field.type === "email" ? 254 : isPhone ? 24 : 250}
              autoCapitalize={field.type ? "none" : "sentences"}
              autoComplete="off"
              keyboardType={field.type === "email" ? "email-address" : isPhone ? "number-pad" : "default"}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={submit}
              inputAccessoryViewID={Platform.OS === "ios" && isPhone ? accessoryId : undefined}
              prefix={isPhone ? <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Country code for ${field.label}`}
                onPress={() => { Keyboard.dismiss(); setCountryQuery(""); setPicker(field); }}
                style={{ minHeight: 48, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 5, borderRightWidth: 1, borderColor: c.line }}
              >
                <Txt>+{region[2]}</Txt><Icon name="chevron-down" size={14} color={c.muted} />
              </Pressable> : undefined}
            />
            {isPhone && <Muted>Country: {region[1]}</Muted>}
            {Platform.OS === "ios" && isPhone && <InputAccessoryView nativeID={accessoryId} backgroundColor={c.surface}>
              <Pressable accessibilityRole="button" onPress={submit} style={{ alignSelf: "flex-end", padding: 12, minHeight: 44 }}><Txt>Next</Txt></Pressable>
            </InputAccessoryView>}
          </View>;
        })}
        {step === passwordStep && <>
          <Input returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => inputRefs.current.confirmation?.focus()} dark label="Password" captureSensitive secureTextEntry={!visible} value={password} onChangeText={(value) => { setPassword(value); setError(""); }} autoCapitalize="none" autoComplete="off" maxLength={128} />
          <Input ref={(input) => { inputRefs.current.confirmation = input; }} returnKeyType="next" submitBehavior="submit" onSubmitEditing={next} dark label="Confirm password" captureSensitive secureTextEntry={!visible} value={confirmation} onChangeText={(value) => { setConfirmation(value); setError(""); }} autoCapitalize="none" autoComplete="off" maxLength={128} />
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
          {groups.flat().filter(({ key }) => !!data[key]?.trim()).map(({ key, label, type }) => <View key={key}><Muted>{label}</Muted><Txt>{type === "phone" ? normalizePhone(data[key] ?? "", regionFor(key)) : data[key]?.trim()}</Txt>{type === "phone" && <Muted>Country: {regionFor(key)[1]}</Muted>}</View>)}
          <Muted>Review your details before creating your account. Your phone is stored in international format.</Muted>
          <Button secondary title="Read Privacy notice" onPress={() => router.push("/settings/privacy-notice")} />
          <Button secondary title="Read Terms of service" onPress={() => router.push("/settings/terms")} />
          <Button secondary title={accepted ? "Accepted privacy notice and terms" : "Accept privacy notice and terms"} onPress={() => setAccepted(!accepted)} />
        </View>}
        {submitted && <View style={{ gap: 10 }}>
          <Txt accessibilityRole="alert">Check your email to confirm your account. Then sign in to finish saving your details.</Txt>
          <Button secondary title="Go to sign in" onPress={() => router.replace("/sign-in")} />
        </View>}
        {!!error && <Txt accessibilityRole="alert">{error}</Txt>}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          {step > 0 ? <Button secondary title="Previous" onPress={() => { setError(""); setStep(step - 1); }} /> : <View />}
          {step < reviewStep ? <Button title="Next" onPress={next} /> : <Button title={session ? "Save account" : "Create account"} loading={busy} onPress={submitAccount} />}
        </View>
      </Page>
      <Modal visible={picker !== null} animationType="none" onRequestClose={() => setPicker(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, paddingHorizontal: 20, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Txt accessibilityRole="header" style={{ fontWeight: "700" }}>Choose a country code</Txt>
            <Pressable accessibilityRole="button" onPress={() => setPicker(null)} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 12 }}><Txt>Close</Txt></Pressable>
          </View>
          <Input dark label="Search countries or codes" value={countryQuery} onChangeText={setCountryQuery} autoCorrect={false} />
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={filteredRegions}
            keyExtractor={(region) => region[0]}
            ListEmptyComponent={<Muted>No matching countries.</Muted>}
            renderItem={({ item }) => <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item[1]} +${item[2]}`}
              accessibilityState={{ selected: picker !== null && regionFor(picker.key)[0] === item[0] }}
              onPress={() => {
                if (!picker) return;
                setPhoneCountries((current) => ({ ...current, [picker.key]: item }));
                setError("");
                setPicker(null);
                Keyboard.dismiss();
              }}
              style={{ minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderColor: c.line }}
            ><Txt style={{ flex: 1 }}>{item[1]}</Txt><Muted>+{item[2]}</Muted></Pressable>}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
