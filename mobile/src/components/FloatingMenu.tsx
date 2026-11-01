import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { router, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, Txt, type IconName } from "./ui";
import { color as c } from "../theme";
const tabs = [
  { href: "/" as const, label: "Home", icon: "grid-outline" },
  { href: "/suppliers" as const, label: "Suppliers", icon: "people-outline" },
  { href: "/check" as const, label: "Check", icon: "scan-outline" },
  { href: "/history" as const, label: "History", icon: "time-outline" },
  { href: "/profile" as const, label: "Profile", icon: "person-outline" },
];
// Compact floating shape from Bible Diaries/Exegomai; measured sliding indicator
// follows VIMBA's approach. Fresh implementation, no source assets copied.
export function FloatingMenu() {
  const path = usePathname();
  const inset = useSafeAreaInsets();
  const active = Math.max(
    0,
    tabs.findIndex((t) => t.href === path),
  );
  const [width, setWidth] = useState(0),
    [keyboard, setKeyboard] = useState(false),
    [reduced, setReduced] = useState(false);
  const previous = useRef(0),
    x = useRef(new Animated.Value(0)).current;
  const cell = Math.max(0, (width - 12) / 5),
    target = active * cell;
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (alive) setReduced(v);
      })
      .catch(() => {});
    const motion = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboard(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboard(false),
    );
    return () => {
      alive = false;
      motion.remove();
      show.remove();
      hide.remove();
      x.stopAnimation();
    };
  }, [x]);
  useEffect(() => {
    x.stopAnimation();
    if (!width || width !== previous.current || reduced) x.setValue(target);
    else
      Animated.spring(x, {
        toValue: target,
        damping: 24,
        stiffness: 240,
        mass: 0.8,
        useNativeDriver: true,
      }).start();
    previous.current = width;
  }, [width, target, reduced, x]);
  if (keyboard) return null;
  return (
    <View
      pointerEvents="box-none"
      style={[s.position, { bottom: Math.max(inset.bottom, 16) }]}
    >
      <View
        accessibilityRole="tablist"
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={s.bar}
      >
        {width > 0 && (
          <Animated.View
            pointerEvents="none"
            testID="navigation-slider"
            style={[s.slider, { width: cell, transform: [{ translateX: x }] }]}
          />
        )}
        {tabs.map((t, i) => (
          <Pressable
            key={t.href}
            accessibilityRole="tab"
            accessibilityLabel={t.label}
            accessibilityState={{ selected: active === i }}
            aria-selected={active === i}
            onPress={() => router.replace(t.href)}
            style={s.tab}
          >
            <Icon
              name={t.icon as IconName}
              size={19}
              color={active === i ? c.ink : "#686D73"}
            />
            <Txt
              style={{
                fontSize: 9,
                lineHeight: 13,
                fontWeight: active === i ? "700" : "500",
                color: active === i ? c.ink : "#686D73",
              }}
            >
              {t.label}
            </Txt>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  position: { position: "absolute", left: 20, right: 20, alignItems: "center" },
  bar: {
    width: "100%",
    maxWidth: 350,
    padding: 6,
    flexDirection: "row",
    borderRadius: 24,
    backgroundColor: c.white,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  slider: {
    position: "absolute",
    left: 6,
    top: 6,
    bottom: 6,
    backgroundColor: c.orange,
    borderRadius: 18,
  },
  tab: {
    zIndex: 1,
    flex: 1,
    minHeight: 52,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
});
