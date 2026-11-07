import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Keyboard, type TextInput } from "react-native";
import { useFocusEffect } from "expo-router";
import { captureScopes } from "./capture";

export function usePasswordCapture(enabled: boolean, input: React.RefObject<React.ComponentRef<typeof TextInput> | null>) {
  const scope = useRef<ReturnType<typeof captureScopes.acquire> | null>(null);
  const [captureError, setCaptureError] = useState("");
  const release = useCallback(() => {
    const old = scope.current;
    scope.current = null;
    // No field may retain focus while its protection is released.
    if (enabled) input.current?.blur();
    void old?.release().catch(() => setCaptureError("Unable to restore recording. Close and reopen the app."));
  }, [enabled, input]);
  useFocusEffect(useCallback(() => release, [release]));
  useEffect(() => {
    if (!enabled) return;
    const keyboard = Keyboard.addListener("keyboardDidHide", release);
    const app = AppState.addEventListener("change", (state) => { if (state !== "active") release(); });
    return () => { keyboard.remove(); app.remove(); release(); };
  }, [enabled, release]);
  const protect = useCallback(() => {
    if (!enabled || scope.current) return;
    setCaptureError("");
    const owner = captureScopes.acquire();
    scope.current = owner;
    void owner.ready.catch(() => {
      if (scope.current !== owner) return;
      release();
      setCaptureError("Password capture protection is unavailable. Reopen the app and try again.");
    });
  }, [enabled, release]);
  return { protect, release, captureError };
}
