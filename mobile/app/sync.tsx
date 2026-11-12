import { AccountGate } from "../src/backend/AccountGate";
import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Heading, Muted, Page, ScreenHeader, Txt } from "../src/components/ui";
import { useDemo } from "../src/state/DemoState";
import { color as c } from "../src/theme";
import type { Operation } from "../src/workflow/types";
function PendingEdit({ op }: { op: Operation }) {
 const { suppliers, reviews, retry, resolve, discard, syncing } = useDemo();
 const [confirmed, setConfirmed] = useState(false), [remove, setRemove] = useState(false), [error, setError] = useState("");
 const current = op.kind === "supplier" ? suppliers.find(s => s.id === op.entityId) : reviews.find(r => r.assessment_id === op.entityId);
 useEffect(() => { setConfirmed(false); }, [op.serverVersion, current?.version]);
 const act = async (task: () => Promise<void>) => { try { setError(""); await task(); } catch(e) { setError(e instanceof Error ? e.message : "Unable to continue."); } };
 const summary = Object.entries(op.payload).filter(([k]) => k !== "bank_reference").map(([k,v]) => `${k.replaceAll("_", " ")}: ${v}`).join("\n");
 return <View style={{ gap: 12, borderTopWidth: 1, borderColor: c.line, paddingVertical: 18 }}>
  <Txt style={{ fontWeight: "600" }}>{op.kind === "supplier" ? "Supplier change" : "Review checklist"} · {op.status}</Txt>
  <Muted>Saved {new Date(op.at).toLocaleString()} · {op.attempts} attempts · base version {op.version}{op.serverVersion !== undefined ? ` · server version ${op.serverVersion}` : ""}</Muted>
  {!!op.error && <Txt style={{ color: c.orange }}>{op.error}</Txt>}
  <Txt>{summary}</Txt>
  {"bank_reference" in op.payload && <Muted>Queued bank reference: masked, ending {op.payload.bank_reference?.slice(-4)}</Muted>}
  {op.status === "conflict" || op.status === "blocked" ? <>
   <Txt style={{ fontWeight: "600" }}>Current saved server copy</Txt>
   <Txt>{current ? Object.entries(current).filter(([k]) => ["name","category","registration","contact","notes","status","version"].includes(k)).map(([k,v]) => `${k}: ${v}`).join("\n") : "Refresh the server copy before resolving."}</Txt>
   <Pressable accessibilityRole="checkbox" accessibilityLabel="I compared the server copy with my queued edit" accessibilityState={{ checked: confirmed }} onPress={() => setConfirmed(!confirmed)} style={{ paddingVertical: 12 }}><Txt>{confirmed ? "✓" : "○"} I compared the server copy with my queued edit</Txt></Pressable>
   <Button secondary title="Keep my queued edit against the reviewed server version" disabled={!confirmed || syncing} onPress={() => { void act(() => resolve(op.id,true)); }} />
   <Button secondary title="Keep server copy and discard this local edit" disabled={!confirmed || syncing} onPress={() => { void act(() => resolve(op.id,false)); }} />
  </> : <Button secondary title="Retry saved edit" disabled={syncing} onPress={() => { void act(() => retry(op.id)); }} />}
  <Button secondary title={remove ? "Confirm discard of this local retry" : "Discard this local retry…"} disabled={syncing} onPress={() => { if (remove) void act(() => discard(op.id)); else setRemove(true); }} />
  {remove && <Muted>This removes the device retry only. Server changes that already completed are retained. This local draft cannot be recovered after discard.</Muted>}
  {!!error && <Txt accessibilityRole="alert">{error}</Txt>}
 </View>;
}
function SyncCentreContent() {
 const state = useDemo();
 const [notice, setNotice] = useState(""), [remove, setRemove] = useState("");
 return <SafeAreaView style={{ flex: 1 }}><ScreenHeader back title="Sync centre" /><Page>
  <Heading>Your work, accounted for.</Heading>
  <Txt>{state.connection}</Txt><Muted>{state.syncMessage}</Muted>
  <Muted>Last successful refresh: {state.lastSync ? new Date(state.lastSync).toLocaleString() : "Not yet"}. {state.pendingCount} pending tasks. Cached: {state.suppliers.length} suppliers, {state.assessments.length} comparisons, {state.reviews.length} reviews.</Muted>
  <Button title={state.syncing ? "Syncing saved work…" : "Sync saved work now"} loading={state.syncing} onPress={() => { void state.refresh(); }} />
  <Muted>Pending work is encrypted on this device and retried when the app reconnects or returns to the foreground. A network connection alone does not prove the server can be reached. Never clear app data while work is pending.</Muted>
  {state.pending.map(p => <View key={p.id} style={{ gap: 12, paddingVertical: 18, borderTopWidth: 1, borderColor: c.line }}>
   <Txt style={{ fontWeight: "600" }}>Invoice {p.input.invoiceNumber} · {p.status ?? "waiting"}</Txt><Muted>{p.error ?? "Waiting for server comparison"} · {p.attempts ?? 0} attempts</Muted>
   <Button secondary title="Open saved comparison" onPress={() => router.push(`/assessment/${p.id}`)} />
   <Button secondary title="Retry invoice check" disabled={state.syncing} onPress={() => { void state.retry(p.id).catch(e => setNotice(e.message)); }} />
   <Button secondary title={remove === p.id ? "Confirm discard of local invoice retry" : "Discard local invoice retry…"} disabled={state.syncing} onPress={() => { if (remove === p.id) void state.discard(p.id).catch(e => setNotice(e.message)); else setRemove(p.id); }} />
   {remove === p.id && <Muted>This deletes the local retry and local pending placeholder. A result already created on the server is retained and may reappear after refresh.</Muted>}
  </View>)}
  {state.operations.map(op => <PendingEdit key={op.id} op={op} />)}
  {!state.pendingCount && <Txt>No work is waiting to sync.</Txt>}
  <Txt style={{ fontSize: 22, fontWeight: "600" }}>Recent successful uploads</Txt>
  {state.recent.length ? state.recent.map(r => <Muted key={r.id}>{r.kind} · {new Date(r.at).toLocaleString()}</Muted>) : <Muted>No recent uploads recorded on this device.</Muted>}
  {!!notice && <Txt accessibilityRole="alert">{notice}</Txt>}
 </Page></SafeAreaView>;
}

export default function SyncCentre() { return <AccountGate><SyncCentreContent /></AccountGate>; }
