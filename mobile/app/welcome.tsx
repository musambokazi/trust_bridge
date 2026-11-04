import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Eyebrow, Heading, Icon, Muted, Page, ScreenHeader } from "../src/components/ui";
import { color as c } from "../src/theme";

const slides = [
  { title: "Check before you pay.", body: "TrustBridge helps you review a supplier invoice before money leaves your account.", icon: "shield-checkmark-outline" },
  { title: "Start with a supplier you know.", body: "Compare invoice details against the reference your workspace holds for that supplier.", icon: "business-outline" },
  { title: "See exactly what changed.", body: "Review differences in the result. If payment details changed, confirm with the supplier through a contact you already trust.", icon: "search-outline" },
  { title: "Keep a record of your checks.", body: "Return to History to see your results. A matching reference supports your review; your team still decides whether to pay.", icon: "time-outline" },
] as const;

export default function Welcome() {
  const [step, setStep] = useState(0);
  const slide = slides[step] ?? slides[0];
  const last = step === slides.length - 1;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader />
      <Page style={{ paddingTop: 32, paddingBottom: 32 }}>
        <View style={{ gap: 18 }} key={step}>
          <Eyebrow>WELCOME · {step + 1} OF {slides.length}</Eyebrow>
          <Icon name={slide.icon} size={64} color={c.orange} />
          <Heading>{slide.title}</Heading>
          <Muted>{slide.body}</Muted>
        </View>
        <Button title={last ? "Continue to account" : "Next"} icon="arrow-forward" onPress={() => last ? router.push("/sign-in") : setStep(step + 1)} />
        <Button secondary title={step ? "Previous" : "Back to settings"} onPress={() => step ? setStep(step - 1) : router.replace("/profile")} />
      </Page>
    </SafeAreaView>
  );
}
