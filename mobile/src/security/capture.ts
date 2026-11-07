import { Platform } from "react-native";
import * as ScreenCapture from "expo-screen-capture";
import { CaptureScopes } from "./CaptureScopes";

const key = "trustbridge-sensitive-interaction";
export const captureScopes = new CaptureScopes(
  async () => { if (Platform.OS !== "web") await ScreenCapture.preventScreenCaptureAsync(key); },
  async () => { if (Platform.OS !== "web") await ScreenCapture.allowScreenCaptureAsync(key); },
);
