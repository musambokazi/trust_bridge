import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { AppState, Keyboard, type TextInput } from "react-native";
import { useFocusEffect } from "expo-router";
import { captureScopes } from "./capture";

type Scope = ReturnType<typeof captureScopes.acquire>;
export function usePasswordCapture(enabled: boolean, input: React.RefObject<React.ComponentRef<typeof TextInput> | null>) {
  const scope = useRef<Scope | null>(null);
  const pendingRelease = useRef<Scope[]>([]);
  const [captureError, setCaptureError] = useState("");
  const [protectedFocus, setProtectedFocus] = useState(false);
  const [, renderMask] = useReducer((revision: number) => revision + 1, 0);
  const flush = useCallback(() => {
    for (const old of pendingRelease.current.splice(0)) {
      void old.release().catch(() => setCaptureError("Unable to restore recording. Close and reopen the app."));
    }
  }, []);
  const release = useCallback(() => {
    const old = scope.current;
    if (!old) return;
    scope.current = null;
    pendingRelease.current.push(old);
    setProtectedFocus(false);
    renderMask();
    // Blur first, commit password masking, then restore recording. This also
    // handles Show password when the next target is email or another screen.
    input.current?.blur();
  }, [input]);
  useLayoutEffect(() => { if (!protectedFocus) flush(); });
  useFocusEffect(useCallback(() => release, [release]));
  useEffect(() => {
    if (!enabled) return;
    const keyboard = Keyboard.addListener("keyboardDidHide", release);
    const app = AppState.addEventListener("change", (state) => { if (state !== "active") release(); });
    return () => { keyboard.remove(); app.remove(); release(); };
  }, [enabled, release]);
  useEffect(() => () => {
    // Unmounted inputs are already absent from the UI. No render is required.
    if (scope.current) pendingRelease.current.push(scope.current);
    scope.current = null;
    flush();
  }, [flush]);
  const protect = useCallback(() => {
    if (!enabled || scope.current) return;
    setCaptureError("");
    const owner = captureScopes.acquire();
    scope.current = owner;
    void owner.ready.then(() => {
      if (scope.current === owner) setProtectedFocus(true);
    }).catch(() => {
      if (scope.current !== owner) return;
      release();
      setCaptureError("Password capture protection is unavailable. Reopen the app and try again.");
    });
  }, [enabled, release]);
  return { protect, release, captureError, protectedFocus };
}
