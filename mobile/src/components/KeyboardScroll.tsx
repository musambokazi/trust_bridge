import React, { useCallback, useEffect, useRef } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, TextInput, type TextInputProps, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthKeyboardContext } from "../auth/keyboard";

export const FocusInput = React.forwardRef<React.ComponentRef<typeof TextInput>, TextInputProps>(function FocusInput({onFocus, ...props}, ref) {
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);
  const reveal = React.useContext(AuthKeyboardContext);
  React.useImperativeHandle(ref,()=>input.current!,[]);
  return <TextInput {...props} ref={input} onFocus={event=>{reveal(input.current);onFocus?.(event);}}/>;
});

/** Shared by every form, including modal sheets. It reveals focus again after
 * the native viewport resizes, rather than assuming Android always resizes it. */
export function KeyboardScroll({ children, contentContainerStyle, style }: { children: React.ReactNode; contentContainerStyle?: StyleProp<ViewStyle>; style?: StyleProp<ViewStyle> }) {
  const insets = useSafeAreaInsets();
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const focused = useRef<React.ComponentRef<typeof TextInput> | null>(null);
  const offset = useRef(0);
  const reveal = useCallback(() => {
    const input = focused.current;
    if (!input?.isFocused()) return;
    scroll.current?.measureInWindow((_x, top, _width, height) => {
      input.measureInWindow((_ix, y, _iw, ih) => {
        if (!input.isFocused()) return;
        const keyboardTop = Platform.OS === "web" ? (globalThis.visualViewport ? globalThis.visualViewport.height + globalThis.visualViewport.offsetTop : top + height) : Keyboard.metrics()?.screenY;
        const bottom = Math.min(top + height, keyboardTop ?? top + height) - 24;
        const delta = y + ih > bottom ? y + ih - bottom : y < top + 16 ? y - top - 16 : 0;
        if (delta) scroll.current?.scrollTo({ y: Math.max(0, offset.current + delta), animated: true });
      });
    });
  }, []);
  const focus = useCallback((input: React.ComponentRef<typeof TextInput> | null) => {
    focused.current = input;
    requestAnimationFrame(reveal);
  }, [reveal]);
  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", reveal);
    const viewport = Platform.OS === "web" ? globalThis.visualViewport : undefined;
    viewport?.addEventListener("resize", reveal);
    return () => { shown.remove(); viewport?.removeEventListener("resize", reveal); };
  }, [reveal]);
  return <KeyboardAvoidingView style={[{flex:1}, style]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <ScrollView ref={scroll} style={{flex:1}} onLayout={() => requestAnimationFrame(reveal)} onScroll={event => { offset.current = event.nativeEvent.contentOffset.y; }} scrollEventThrottle={16} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={[{flexGrow:1,paddingBottom:insets.bottom+32},contentContainerStyle]}>
      <AuthKeyboardContext.Provider value={focus}>{children}</AuthKeyboardContext.Provider>
    </ScrollView>
  </KeyboardAvoidingView>;
}
