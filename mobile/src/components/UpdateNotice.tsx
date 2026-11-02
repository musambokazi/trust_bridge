import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as Updates from "expo-updates";
import { UpdateDialog } from "./UpdateDialog";

export function UpdateNotice() {
  const [visible, setVisible] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const applying = useRef(false);
  useEffect(() => {
    mounted.current = true;
    let live = true, busy = false, prompted = false;
    async function check() {
      if (busy || prompted) return;
      busy = true;
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
          if (live) {
            prompted = true;
            setVisible(true);
          }
        }
      } catch { /* Keep the installed bundle offline; retry on foreground. */ }
      finally { busy = false; }
    }
    const enabled = !__DEV__ && Updates.isEnabled;
    if (enabled) void check();
    const listener = enabled ? AppState.addEventListener("change", state => { if (state === "active") void check(); }) : null;
    return () => { live = false; mounted.current = false; listener?.remove(); };
  }, []);

  async function restart() {
    if (applying.current) return;
    applying.current = true;
    setRestarting(true);
    setError("");
    try {
      await Updates.reloadAsync();
    } catch {
      if (mounted.current) {
        setError("Couldn’t restart automatically. Try again, or close and reopen TrustBridge to apply the update.");
        setRestarting(false);
      }
      applying.current = false;
    }
  }
  return <UpdateDialog visible={visible} restarting={restarting} error={error} onRestart={() => { void restart(); }} onLater={() => { if (!applying.current) setVisible(false); }} />;
}
