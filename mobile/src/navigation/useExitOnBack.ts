import { useCallback } from "react";
import { AppState, BackHandler, Keyboard, Platform, ToastAndroid } from "react-native";
import { useFocusEffect, usePathname } from "expo-router";
import { exitBackWindow } from "./exitBack";

/** Only tab roots use this handler; detail screens retain normal Back behaviour. */
export function useExitOnBack() {
  const pathname = usePathname();
  useFocusEffect(useCallback(() => {
    if (Platform.OS !== "android") return;
    const window = exitBackWindow();
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      if (Keyboard.isVisible()) { Keyboard.dismiss(); window.reset(); return true; }
      if (window.attempt(Date.now()) === "exit") BackHandler.exitApp();
      else ToastAndroid.show("Swipe back again to exit", ToastAndroid.SHORT);
      return true;
    });
    const app = AppState.addEventListener("change", state => { if (state !== "active") window.reset(); });
    return () => { back.remove(); app.remove(); window.reset(); };
  }, [pathname]));
}
