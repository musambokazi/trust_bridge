import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Image, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Page, ScreenHeader, Txt } from "../src/components/ui";
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
  const [from, setFrom] = useState<number | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
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
    if (from === null) return;
    if (reduced) { setFrom(null); return; }
    const transition = Animated.timing(progress, {
      toValue: 1, duration: 460, easing: Easing.inOut(Easing.cubic), useNativeDriver: false,
    });
    transition.start(({ finished }) => { if (finished) setFrom(null); });
    return () => transition.stop();
  }, [from, progress, reduced]);

  function move(target: number) {
    if (from !== null || !width) return;
    if (!reduced) {
      progress.setValue(0);
      setFrom(step);
    }
    setStep(target);
  }

  function content(index: number) {
    const slide = slides[index] ?? slides[0];
    return <View style={[styles.slide, width ? { width } : undefined]}>
      <Image source={slide.image} style={styles.art} resizeMode="contain" accessible={false} />
      <Txt style={styles.counter}>WELCOME · {index + 1} OF {slides.length}</Txt>
      <Txt accessibilityRole="header" style={styles.title}>{slide.title}</Txt>
      <Txt style={styles.body}>{slide.body}</Txt>
    </View>;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader />
      <Page style={styles.page}>
        <View style={styles.viewport} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
          {content(step)}
          {from !== null && <View pointerEvents="none" aria-hidden importantForAccessibility="no-hide-descendants" style={styles.overlay}>
            {content(from)}
            <Animated.View style={[styles.reveal, { width: progress.interpolate({ inputRange: [0, 1], outputRange: [0, width] }) }]}>
              {content(step)}
            </Animated.View>
          </View>}
        </View>
        <View style={styles.controls}>
          {step > 0 ? <Pressable accessibilityRole="button" disabled={from !== null} onPress={() => move(step - 1)} style={styles.previous}>
            <Txt>Previous</Txt>
          </Pressable> : <View />}
          <Pressable accessibilityRole="button" disabled={!width || from !== null} onPress={() => last ? router.push("/sign-in") : move(step + 1)} style={styles.next}>
            <Txt style={{ color: c.ink, fontWeight: "700" }}>{last ? "Continue to account" : "Next"}</Txt>
          </Pressable>
        </View>
      </Page>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  page: { flexGrow: 1, justifyContent: "center", paddingTop: 16, paddingBottom: 20, gap: 24 },
  viewport: { overflow: "hidden" },
  overlay: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, backgroundColor: c.bg, alignItems: "center", justifyContent: "center" },
  reveal: { position: "absolute", top: 0, bottom: 0, alignSelf: "center", backgroundColor: c.bg, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  slide: { alignItems: "center", justifyContent: "center", paddingHorizontal: 8, gap: 10 },
  art: { width: "85%", maxWidth: 230, height: 185 },
  counter: { color: c.orange, fontWeight: "600", fontSize: 11, letterSpacing: 2, textAlign: "center" },
  title: { fontSize: 30, lineHeight: 36, fontWeight: "700", textAlign: "center" },
  body: { color: c.muted, textAlign: "center", maxWidth: 390 },
  controls: { width: "100%", maxWidth: 390, alignSelf: "center", flexDirection: "row", justifyContent: "space-between", gap: 8 },
  previous: { minHeight: 44, paddingHorizontal: 12, justifyContent: "center" },
  next: { minHeight: 44, paddingHorizontal: 16, justifyContent: "center", borderRadius: 10, backgroundColor: c.orange },
});
