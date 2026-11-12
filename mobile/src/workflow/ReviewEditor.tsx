import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Button, Input, Muted, Txt } from "../components/ui";
import { useDemo } from "../state/DemoState";
import { blankReview, type ReviewDraft } from "./types";
import { color as c } from "../theme";
export const checks = [ ["contact_checked", "Called a trusted supplier contact"], ["documents_checked", "Checked supporting documents"], ["discrepancies_resolved", "Resolved discrepancies or confirmed none were found"] ] as const;
export function ReviewEditor({ id }: { id: string }) {
 const { reviews, operations, pending, queueReview } = useDemo();
 const saved = reviews.find(r => r.assessment_id === id), waiting = operations.find(o => o.kind === "review" && o.entityId === id);
 const [draft, setDraft] = useState<ReviewDraft>(saved ?? blankReview), [version, setVersion] = useState(saved?.version ?? 0), [dirty, setDirty] = useState(false), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
 useEffect(() => { if (!dirty) { setDraft((waiting?.payload as ReviewDraft | undefined) ?? saved ?? { ...blankReview }); setVersion(saved?.version ?? 0); } }, [saved?.version, waiting?.id, id, dirty]);
 const editable = !waiting && !pending.some(p => p.id === id);
 const change = (next: Partial<ReviewDraft>) => { setDraft(old => ({ ...old, ...next, status: next.status ?? "unresolved" })); setDirty(true); setNotice(""); };
 return <View style={{ gap: 16, borderTopWidth: 1, borderColor: c.line, paddingTop: 20 }}>
  <Txt accessibilityRole="header" style={{ fontSize: 22, fontWeight: "600" }}>Review checklist</Txt>
  <Muted>{waiting ? "Local review saved; waiting for sync or conflict resolution. It is not a synced completed review." : saved ? `Server review: ${saved.status}. Version ${saved.version}.` : "No saved review yet. Your review does not change the original comparison or authorise payment."}</Muted>
  {checks.map(([key, label]) => <Pressable key={key} accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked: draft[key], disabled: !editable }} disabled={!editable} onPress={() => change({ [key]: !draft[key] })} style={{ flexDirection: "row", gap: 12, paddingVertical: 10 }}><Txt style={{ color: c.orange }}>{draft[key] ? "✓" : "○"}</Txt><Txt style={{ flex: 1 }}>{label}</Txt></Pressable>)}
  <Muted>Use an established contact, not a number or link appearing only on the invoice. Record your reasoning in notes; do not store passwords or full bank details.</Muted>
  <Input dark label="Reviewer notes" value={draft.notes} editable={editable} multiline maxLength={2000} style={{ minHeight: 120, textAlignVertical: "top" }} onChangeText={notes => change({ notes })} />
  <Button secondary title={draft.status === "reviewed" ? "Keep review unresolved" : "Mark checklist reviewed"} disabled={!editable || (!draft.contact_checked || !draft.documents_checked || !draft.discrepancies_resolved) && draft.status !== "reviewed"} onPress={() => change({ status: draft.status === "reviewed" ? "unresolved" : "reviewed" })} />
  <Button title="Save review checklist" disabled={!editable || !dirty} loading={busy} onPress={async () => { setBusy(true); try { await queueReview(id, version, draft); setDirty(false); setNotice("Review saved on this device. Check sync status before relying on the server copy."); } catch(e) { setNotice(e instanceof Error ? e.message : "Unable to save review."); } finally { setBusy(false); } }} />
  {!editable && <Button secondary title="Open sync centre" onPress={() => router.push("/sync")} />}
  {!!notice && <Txt accessibilityRole="alert">{notice}</Txt>}
 </View>;
}
