import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextProps,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { color as c, money } from "../theme";
import { useDemo } from "../state/DemoState";
import type { Assessment } from "../domain/demo";
export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export function Icon({
  name,
  size = 22,
  color = c.white,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      accessible={false}
      aria-hidden={true}
    />
  );
}
export function Txt({ style, ...props }: TextProps) {
  const { scale } = useDemo();
  return (
    <Text
      {...props}
      style={[
        styles.text,
        { fontSize: 14 * scale, lineHeight: 21 * scale },
        style,
      ]}
    />
  );
}
export function Page({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.page, style]}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Txt style={styles.eyebrow}>{children}</Txt>;
}
export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Txt accessibilityRole="header" style={styles.heading}>
      {children}
    </Txt>
  );
}
export function Muted({ children }: { children: React.ReactNode }) {
  return <Txt style={{ color: c.muted }}>{children}</Txt>;
}
export function Button({
  title,
  onPress,
  secondary,
  icon,
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{
        disabled: !!disabled || !!loading,
        busy: !!loading,
      }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.75 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.ink} />
      ) : (
        <>
          <Txt
            style={{
              fontWeight: "700",
              color: secondary ? c.white : c.ink,
              fontSize: 15,
            }}
          >
            {title}
          </Txt>
          {icon && (
            <Icon name={icon} color={secondary ? c.white : c.ink} size={20} />
          )}
        </>
      )}
    </Pressable>
  );
}
export function Brand() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.mark}
      >
        <View style={styles.bridgeLeft} />
        <View style={styles.bridgeRight} />
        <View style={styles.bridgeDeck} />
      </View>
      <Txt style={{ fontSize: 20, fontWeight: "700", letterSpacing: -0.8 }}>
        trustbridge<Txt style={{ color: c.orange }}>.</Txt>
      </Txt>
    </View>
  );
}
export function ScreenHeader({
  title,
  back = false,
  right,
}: {
  title?: string;
  back?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      {back ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
            style={styles.iconButton}
          >
            <Icon name="arrow-back" />
          </Pressable>
          <Txt style={{ fontSize: 17, fontWeight: "600" }}>{title}</Txt>
        </View>
      ) : (
        <Brand />
      )}
      {right}
    </View>
  );
}
export const Input = React.forwardRef<
  React.ComponentRef<typeof TextInput>,
  TextInputProps & { label: string; error?: string; suffix?: React.ReactNode }
>(function Input({ label, error, suffix, style, ...props }, ref) {
  return (
    <View style={{ gap: 8 }}>
      <Txt style={styles.label}>{label}</Txt>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: error ? c.warning : c.paperLine,
          borderRadius: 12,
          backgroundColor: "#FFFFFF",
        }}
      >
        <TextInput
          {...props}
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor="#757B80"
          style={[styles.input, style]}
        />
        {suffix}
      </View>
      {error && (
        <Txt
          accessibilityRole="alert"
          style={{ color: c.warning, fontSize: 12 }}
        >
          {error}
        </Txt>
      )}
    </View>
  );
});
export function SectionTitle({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Txt
        accessibilityRole="header"
        style={{
          fontSize: 18,
          lineHeight: 25,
          fontWeight: "600",
          letterSpacing: -0.4,
        }}
      >
        {title}
      </Txt>
      {action && (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Txt style={{ color: c.orange, fontSize: 13 }}>{action} ↗</Txt>
        </Pressable>
      )}
    </View>
  );
}
export function AssessmentRow({ item }: { item: Assessment }) {
  const review = item.level !== "clear";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.invoiceNumber}, ${item.supplierName}, ${review ? "Needs review" : "No discrepancies detected"}`}
      onPress={() => router.push(`/assessment/${item.id}`)}
      style={({ pressed }) => [
        styles.assessmentRow,
        pressed && { backgroundColor: c.raised },
      ]}
    >
      <View
        style={[styles.documentIcon, review && { backgroundColor: "#30231B" }]}
      >
        <Icon
          name={review ? "document-text-outline" : "document-outline"}
          color={review ? c.orange : c.muted}
          size={22}
        />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Txt style={{ fontWeight: "600" }}>{item.supplierName}</Txt>
        <Txt style={{ color: c.muted, fontSize: 12 }}>
          {item.invoiceNumber} · {money(item.amount)}
        </Txt>
        <Txt style={{ fontSize: 12, color: review ? c.orange : c.muted }}>
          {review
            ? item.findings.find((f) => f.mismatch)?.title
            : "No discrepancies detected"}
        </Txt>
      </View>
      <Icon name="chevron-forward" size={16} color={c.muted} />
    </Pressable>
  );
}
export function DemoNote() {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 7 }}>
      <Icon name="flask-outline" size={14} color={c.muted} />
      <Txt style={{ color: c.muted, fontSize: 11, lineHeight: 17, flex: 1 }}>
        Interactive UI preview · Fictional records. Nothing is uploaded or
        verified by a live service.
      </Txt>
    </View>
  );
}
export const styles = StyleSheet.create({
  text: { color: c.white },
  page: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 125,
    gap: 24,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  eyebrow: {
    color: c.muted,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  heading: {
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "600",
    letterSpacing: -1.6,
  },
  button: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: c.orange,
    paddingHorizontal: 19,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  secondary: { backgroundColor: c.raised, borderWidth: 1, borderColor: c.line },
  header: {
    minHeight: 78,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  mark: { width: 26, height: 25 },
  bridgeLeft: {
    position: "absolute",
    width: 4,
    height: 21,
    backgroundColor: c.orange,
    left: 4,
    top: 0,
    borderRadius: 2,
    transform: [{ rotate: "20deg" }],
  },
  bridgeRight: {
    position: "absolute",
    width: 4,
    height: 21,
    backgroundColor: c.orange,
    right: 4,
    top: 0,
    borderRadius: 2,
    transform: [{ rotate: "-20deg" }],
  },
  bridgeDeck: {
    position: "absolute",
    height: 3,
    width: 26,
    backgroundColor: c.orange,
    top: 14,
    borderRadius: 2,
  },
  label: { color: c.ink, fontSize: 12, fontWeight: "600" },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 49,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
    color: c.ink,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  assessmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 18,
    borderBottomColor: c.line,
    borderBottomWidth: 1,
  },
  documentIcon: {
    width: 42,
    height: 47,
    borderRadius: 12,
    backgroundColor: c.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  paper: { backgroundColor: c.white, borderRadius: 22, padding: 21, gap: 21 },
  paperTitle: { color: c.ink, fontSize: 18, lineHeight: 25, fontWeight: "600" },
  mutedOnPaper: { color: c.paperMuted, fontSize: 13, lineHeight: 20 },
  divider: { height: 1, backgroundColor: c.line },
});
