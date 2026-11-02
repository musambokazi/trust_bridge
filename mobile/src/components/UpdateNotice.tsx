import { useEffect } from 'react';
import { Alert, AppState } from 'react-native';
import * as Updates from 'expo-updates';
export function UpdateNotice() {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
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
            Alert.alert('A TrustBridge update is ready', 'Restart the app to apply the downloaded update.', [
              { text: 'Later', style: 'cancel' },
              { text: 'Restart and apply', onPress: () => { void Updates.reloadAsync().catch(() => { Alert.alert('Restart needed', 'Close and reopen TrustBridge to apply the update.'); }); } },
            ]);
          }
        }
      } catch { /* Offline use keeps the installed bundle; retry on foreground. */ }
      finally { busy = false; }
    }
    void check();
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void check(); });
    return () => { live = false; listener.remove(); };
  }, []);
  return null;
}
