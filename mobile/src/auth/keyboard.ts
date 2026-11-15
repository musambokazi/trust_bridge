import { createContext, type ComponentRef } from "react";
import type { TextInput } from "react-native";

export const AuthKeyboardContext = createContext<(input: ComponentRef<typeof TextInput> | null) => void>(() => {});
