import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Page, ScreenHeader, Txt } from "../src/components/ui";
import { color as c } from "../src/theme";

const slides = [
  { title: "Check before you pay.", body: "TrustBridge helps you review a supplier invoice before money leaves your account.", image: require("../assets/welcome/invoice.png") },
  { title: "Start with a supplier you know.", body: "Compare invoice details against the reference your workspace holds for that supplier.", image: require("../assets/welcome/supplier.png") },
  { title: "See exactly what changed.", body: "Review differences in the result. If payment details changed, confirm with the supplier through a contact you already trust.", image: require("../assets/welcome/compare.png") },
  { title: "Keep a record of your checks.", body: "Return to History to see your results. A matching reference supports your review; your team still decides whether to pay.", image: require("../assets/welcome/history.png") },
] as const;

export default function Welcome() {
  const [step, setStep] = useState(0);
  const [width, setWidth] = useState(0);
  const [reduced, setReduced] = useState(false);
  const offset = useRef(new Animated.Value(0)).current;
  const previousWidth = useRef(0);
  const last = step === slides.length - 1;

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    const target = -step * width;
    if (reduced || width !== previousWidth.current) {
      offset.setValue(target);
      previousWidth.current = width;
      return;
    }
    const transition = Animated.timing(offset, {
      toValue: target,
      duration: 380,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    transition.start();
    return () => transition.stop();
  }, [offset, reduced, step, width]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader />
      <Page style={styles.page}>
        <View style={styles.viewport} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
          {!!width && (
            <Animated.View style={{ flexDirection: "row", width: width * slides.length, transform: [{ translateX: offset }] }}>
              {slides.map((slide, index) => (
                <View key={slide.title} aria-hidden={index !== step} importantForAccessibility={index === step ? "auto" : "no-hide-descendants"} style={[styles.slide, { width }]}>
                  <Image source={slide.image} style={styles.art} resizeMode="contain" accessible={false} />
                  <Txt style={styles.counter}>WELCOME · {index + 1} OF {slides.length}</Txt>
                  <Txt accessibilityRole="header" style={styles.title}>{slide.title}</Txt>
                  <Txt style={styles.body}>{slide.body}</Txt>
                </View>
              ))}
            </Animated.View>
          )}
        </View>
        <View style={styles.controls}>
          <Button title={last ? "Continue to account" : "Next"} disabled={!width} onPress={() => last ? router.push("/sign-in") : setStep((value) => Math.min(value + 1, slides.length - 1))} />
          <View style={styles.previous}>
            {step > 0 && <Button secondary title="Previous" onPress={() => setStep((value) => Math.max(0, value - 1))} />}
          </View>
        </View>
      </Page>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  page: { flexGrow: 1, justifyContent: "center", paddingTop: 16, paddingBottom: 20, gap: 24 },
  viewport: { overflow: "hidden" },
  slide: { alignItems: "center", justifyContent: "center", paddingHorizontal: 8, gap: 10 },
  art: { width: "85%", maxWidth: 230, height: 185 },
  counter: { color: c.orange, fontWeight: "600", fontSize: 11, letterSpacing: 2, textAlign: "center" },
  title: { fontSize: 30, lineHeight: 36, fontWeight: "700", textAlign: "center" },
  body: { color: c.muted, textAlign: "center", maxWidth: 390 },
  controls: { width: "100%", maxWidth: 390, alignSelf: "center", gap: 8 },
  previous: { minHeight: 52 },
});
