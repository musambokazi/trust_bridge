import React, { useState } from "react";
import { Image, Keyboard, Modal, Pressable, StyleSheet, View, type ImageSourcePropType } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardScroll } from "./KeyboardScroll";
import { Icon, Input, Muted, Txt } from "./ui";
import { color as c } from "../theme";

export type SelectOption = { label: string; value: string; image?: ImageSourcePropType };
export function SelectField({ label, value, options, onChange, placeholder = "Select an option", disabled = false, allowCustom = false }: {
  label: string; value: string; options: readonly SelectOption[]; onChange: (value: string) => void;
  placeholder?: string; disabled?: boolean; allowCustom?: boolean;
}) {
  const [customMode, setCustomMode] = useState(allowCustom && value === "Other");
  const [open, setOpen] = useState(false), [query, setQuery] = useState("");
  const selected = options.find(option => option.value === (customMode ? "Other" : value));
  const filtered = options.filter(option => `${option.label} ${option.value}`.toLowerCase().includes(query.trim().toLowerCase()));
  const custom = query.trim().slice(0, 100);
  function choose(next: string) {
    const editingOther = allowCustom && next === "Other";
    setCustomMode(editingOther);
    onChange(editingOther && value && !options.some(option => option.value === value) ? value : next);
    Keyboard.dismiss(); setOpen(false);
  }
  return <View style={{ gap: 8 }}>
    <Txt style={{ fontWeight: "600" }}>{label}</Txt>
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint="Opens a searchable list" accessibilityState={{ expanded: open, disabled }} disabled={disabled} onPress={() => { Keyboard.dismiss(); setQuery(""); setOpen(true); }} style={[s.field, disabled && { opacity: 0.5 }]}>
      {selected?.image && <Image source={selected.image} resizeMode="contain" style={s.logo} accessible={false}/>}
      <Txt style={{ flex: 1, color: value ? c.white : c.muted }}>{selected?.label ?? (value || placeholder)}</Txt><Icon name="chevron-down" size={18} color={c.muted} />
    </Pressable>
    {customMode && <Input dark label={`Custom ${label.toLowerCase()}`} value={value === "Other" ? "" : value} onChangeText={text => onChange(text.trim() ? text : "Other")} maxLength={100} placeholder="Type your own category" autoFocus editable={!disabled}/> }
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)} presentationStyle="pageSheet">
      <SafeAreaView style={s.modal}>
        <KeyboardScroll contentContainerStyle={{gap:16,paddingBottom:32}}>
        <View style={s.header}><Txt accessibilityRole="header" style={{ fontSize: 22, fontWeight: "600", flex: 1 }}>{label}</Txt><Pressable accessibilityRole="button" accessibilityLabel={`Close ${label}`} onPress={() => setOpen(false)} style={s.close}><Icon name="close" /></Pressable></View>
        <Input dark label={`Search ${label.toLowerCase()}`} placeholder="Search or type…" value={query} onChangeText={setQuery} maxLength={100} autoCorrect={false} />
        <View>{filtered.map(item => <Pressable key={item.value} accessibilityRole="radio" accessibilityLabel={item.label} accessibilityState={{ checked: value === item.value }} aria-checked={value === item.value} onPress={() => choose(item.value)} style={s.option}>
          {item.image && <Image source={item.image} resizeMode="contain" style={s.logo} accessible={false}/>}
          <Txt style={{ flex: 1 }}>{item.label}</Txt>{value === item.value && <Icon name="checkmark" color={c.orange} />}
        </Pressable>)}</View>
        {!filtered.length && <Muted>No matching options.</Muted>}
        {allowCustom && custom && !options.some(option => option.value.toLowerCase() === custom.toLowerCase()) && <Pressable accessibilityRole="button" accessibilityLabel={`Use custom ${label.toLowerCase()}`} onPress={() => choose(custom)} style={s.option}><Txt style={{ color: c.orange }}>Use “{custom}”</Txt></Pressable>}
        </KeyboardScroll>
      </SafeAreaView>
    </Modal>
  </View>;
}
const s = StyleSheet.create({
  logo: {width:48,height:32},
  field: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: c.line, borderRadius: 12, backgroundColor: c.surface },
  modal: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 22, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 12 },
  close: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  option: { minHeight: 58, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderColor: c.line },
});
