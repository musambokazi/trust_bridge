import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { randomUUID } from "expo-crypto";
import { useNetworkState } from "expo-network";
import { supabase, secureStorage } from "../backend/client";
import { useAuth } from "../backend/AuthState";
import { type Assessment, type InvoiceInput, type Supplier, validateInvoice } from "../domain/demo";
import { type Operation, type Review, type ReviewDraft, type SupplierChange, type SupplierEdit, type SyncReceipt, operationError, validateReview, validateSupplierEdit } from "../workflow/types";

import { empty, hydrate, compact, type Cache, type Pending } from "../workflow/cache";
type State = {
 enteredWorkspace: boolean; loading: boolean; assessments: Assessment[]; suppliers: Supplier[];
 check: (input: InvoiceInput) => Promise<string>; name: string; scale: number;
 refresh: () => Promise<void>; syncMessage: string; pendingCount: number; syncing: boolean;
 pending: Pending[]; operations: Operation[]; reviews: Review[]; history: SupplierChange[]; recent: SyncReceipt[]; lastSync?: string;
 connection: string; queueSupplier: (id: string, version: number, draft: SupplierEdit) => Promise<void>;
 queueReview: (id: string, version: number, draft: ReviewDraft) => Promise<void>;
 retry: (id: string) => Promise<void>; resolve: (id: string, keepLocal: boolean) => Promise<void>; discard: (id: string) => Promise<void>;
};
const Context = createContext<State | null>(null);
export function DemoProvider({ children }: { children: React.ReactNode }) {
 const { session, profile, workspace } = useAuth();
 const uid = session?.user.id;
 const network = useNetworkState();
 const [cache, setCache] = useState<Cache>(empty), [loading, setLoading] = useState(true), [syncMessage, setSyncMessage] = useState("");
 const [syncing, setSyncing] = useState(false), [reachable, setReachable] = useState<boolean | null>(null);
 const current = useRef(cache), account = useRef<string | null>(null), epoch = useRef(0), workspaceRef = useRef(workspace);
 workspaceRef.current = workspace;
 const damaged = useRef(false), writes = useRef(Promise.resolve()), flight = useRef<{ generation: number; task: Promise<void> } | null>(null);
 const valid = (id: string, generation: number) => account.current === id && epoch.current === generation;
 async function persist(update: (c: Cache) => Cache, id: string, generation = epoch.current) {
  const task = writes.current.then(async () => {
   if (!valid(id, generation)) throw Error("Account changed. Reopen this screen.");
   if (damaged.current) throw Error("Saved outbox could not be read. It has been preserved; do not clear app data.");
   const next = compact(update(current.current));
   await secureStorage.setItem("workspace-" + id, JSON.stringify(next));
   if (valid(id, generation)) { current.current = next; setCache(next); }
  });
  writes.current = task.catch(() => {}); await task;
 }
 function refresh(): Promise<void> {
  const id = account.current, generation = epoch.current, wid = workspaceRef.current?.id;
  if (!id || !wid || damaged.current || loading) return Promise.resolve();
  if (flight.current?.generation === generation) return flight.current.task;
  const task = sync(id, generation, wid).finally(() => { if (valid(id, generation)) { setSyncing(false); flight.current = null; } });
  flight.current = { generation, task }; return task;
 }
 async function sync(id: string, generation: number, wid: string) {
  setSyncing(true);
  const alive = () => valid(id, generation);
  const now = () => new Date().toISOString();
  try {
   for (const item of [...current.current.pending]) {
    if (!alive()) return;
    if (item.status === "blocked") continue;
    const at = now();
    const result = await supabase.rpc("compare_invoice", { request_id: item.id, supplier: item.input.supplierId, invoice_number: item.input.invoiceNumber, invoice_name: item.input.supplierName, invoice_amount: Number(item.input.amount), invoice_reference: item.input.bankReference });
    if (!alive()) return;
    if (result.error) {
     const status = operationError(result.error.code);
     await persist(c => ({ ...c, pending: c.pending.map(p => p.id === item.id ? { ...p, status, lastAttempt: at, attempts: (p.attempts ?? 0) + 1, error: status === "blocked" ? "Server rejected this check. Confirm the supplier and sign-in status, then retry." : "Server could not be reached. Your check remains encrypted on this device." } : p) }), id, generation);
     if (status === "failed") { setReachable(false); setSyncMessage("Unable to sync. Saved work remains on this device."); return; }
    } else {
     await persist(c => ({ ...c, pending: c.pending.filter(p => p.id !== item.id), assessments: [result.data as Assessment, ...c.assessments.filter(a => a.id !== item.id)], recent: [{ id: item.id, kind: "Invoice check", at }, ...c.recent].slice(0, 40) }), id, generation);
    }
   }
   for (const op of [...current.current.operations]) {
    if (!alive()) return;
    if (op.status === "blocked" || op.status === "conflict") continue;
    const at = now();
    const result = await supabase.rpc("apply_workflow_operation", { request_id: op.id, operation: op.kind, entity_id: op.entityId, expected_version: op.version, payload: op.payload });
    if (!alive()) return;
    if (result.error || !["synced", "conflict"].includes(result.data?.status)) {
     const status = operationError(result.error?.code);
     await persist(c => ({ ...c, operations: c.operations.map(o => o.id === op.id ? { ...o, status, attempts: o.attempts + 1, lastAttempt: at, error: status === "blocked" ? "Server rejected this edit. Review its details or restore the server version." : "Server could not be reached. This edit is still saved locally." } : o) }), id, generation);
     if (status === "failed") { setReachable(false); setSyncMessage("Unable to sync. Saved work remains on this device."); return; }
    } else if (result.data.status === "conflict") {
     await persist(c => ({ ...c, operations: c.operations.map(o => o.id === op.id ? { ...o, status: "conflict", serverVersion: result.data.version, lastAttempt: at, attempts: o.attempts + 1, error: "A newer server version exists. Compare it before choosing which edit to keep." } : o) }), id, generation);
    } else {
     await persist(c => ({ ...c, operations: c.operations.filter(o => o.id !== op.id), reviews: op.kind === "review" ? [{ ...(op.payload as ReviewDraft), assessment_id: op.entityId, user_id: id, version: result.data.version, updated_at: result.data.updatedAt ?? at }, ...c.reviews.filter(r => r.assessment_id !== op.entityId)] : c.reviews, recent: [{ id: op.id, kind: op.kind === "supplier" ? "Supplier change" : "Review checklist", at }, ...c.recent].slice(0, 40) }), id, generation);
    }
   }
   const [s, a, r, h] = await Promise.all([
    supabase.from("suppliers").select("*").eq("workspace_id", wid).order("name").limit(150),
    supabase.from("assessments").select("result").eq("user_id", id).order("created_at", { ascending: false }).limit(150),
    supabase.from("assessment_reviews").select("*").eq("user_id", id).order("updated_at", { ascending: false }).limit(100),
    supabase.from("supplier_changes").select("*").eq("workspace_id", wid).order("created_at", { ascending: false }).limit(100),
   ]);
   if (!alive()) return;
   if (s.error || a.error || r.error || h.error) { setReachable(false); setSyncMessage("Connected data could not be refreshed. Showing saved records."); return; }
   const suppliers: Supplier[] = (s.data ?? []).map(v => ({ id: v.id, name: v.name, initials: v.name.split(/\s+/).map((x: string) => x[0]).slice(0, 2).join(""), category: v.category, registration: v.registration, contact: v.contact, version: v.version, bankReference: v.bank_reference.slice(-4), verified: !!v.reviewed_at, verifiedOn: v.reviewed_at ? new Date(v.reviewed_at).toLocaleDateString() : undefined }));
   await persist(c => ({ ...c, suppliers, assessments: [...c.assessments.filter(x => c.pending.some(p => p.id === x.id)), ...(a.data ?? []).map(x => x.result as Assessment)], reviews: r.data ?? [], history: h.data ?? [], lastSync: now() }), id, generation);
   setReachable(true); setSyncMessage(current.current.pending.length + current.current.operations.length ? "Some saved items still need sync or attention." : "Synced with your account.");
  } catch { if (alive()) { setReachable(false); setSyncMessage("Unable to finish sync. Saved work has been retained."); } }
 }
 useEffect(() => {
  const generation = ++epoch.current; account.current = uid ?? null; flight.current = null; damaged.current = false;
  current.current = empty(); setCache(current.current); setLoading(true); setSyncing(false); setReachable(null); setSyncMessage("");
  if (!uid) { setLoading(false); return; }
  void (async () => {
   try { const saved = await secureStorage.getItem("workspace-" + uid); if (saved && valid(uid, generation)) { const parsed = hydrate(saved); current.current = parsed; setCache(parsed); } }
   catch { if (valid(uid, generation)) { damaged.current = true; setSyncMessage("The saved outbox could not be read. It has been preserved. Do not clear app data; contact support."); } }
   finally { if (valid(uid, generation)) setLoading(false); }
  })();
 }, [uid]);
 useEffect(() => {
  if (loading) return;
  void refresh();
  const timer = setInterval(() => { if (AppState.currentState === "active") void refresh(); }, 30000);
  const listener = AppState.addEventListener("change", state => { if (state === "active") void refresh(); });
  return () => { clearInterval(timer); listener.remove(); };
 }, [loading, uid, workspace?.id]);
 useEffect(() => { if (network.isConnected && network.isInternetReachable !== false) void refresh(); }, [network.isConnected, network.isInternetReachable]);
 async function check(input: InvoiceInput) {
  const id = account.current, generation = epoch.current;
  if (!id || !workspaceRef.current?.id || loading) throw Error("Finish account setup first.");
  if (!current.current.suppliers.some(s => s.id === input.supplierId)) throw Error("Add or sync the supplier before creating a check.");
  if (Object.keys(validateInvoice(input)).length) throw Error("Check the invoice fields.");
  if (current.current.pending.length + current.current.operations.length >= 50) throw Error("Sync or resolve pending work before adding more.");
  const requestId = randomUUID(), at = new Date().toISOString();
  const item: Assessment = { id: requestId, invoiceNumber: input.invoiceNumber, supplierName: input.supplierName, supplierId: input.supplierId, amount: Number(input.amount), date: at, level: "unknown", submittedReference: input.bankReference.slice(-4), findings: [{ field: "sync", title: "Waiting for server comparison", detail: "Saved on this device. Connect and sync to receive a server comparison.", mismatch: true }] };
  await persist(c => ({ ...c, pending: [...c.pending, { id: requestId, input: { ...input }, at, status: "waiting", attempts: 0 }], assessments: [item, ...c.assessments] }), id, generation);
  void refresh(); return requestId;
 }
 async function queue(kind: Operation["kind"], entityId: string, version: number, payload: SupplierEdit | ReviewDraft) {
  const id = account.current, generation = epoch.current;
  if (!id || loading) throw Error("Sign in and finish loading first.");
  const message = kind === "supplier" ? validateSupplierEdit(payload as SupplierEdit) : validateReview(payload as ReviewDraft);
  if (message) throw Error(message);
  if (kind === "review" && current.current.pending.some(p => p.id === entityId)) throw Error("Sync the comparison before saving a review checklist.");
  await persist(c => {
   if (c.operations.some(o => o.kind === kind && o.entityId === entityId)) throw Error("A saved edit is already pending. Sync or resolve it in the sync centre first.");
   if (c.operations.length + c.pending.length >= 50) throw Error("Sync or resolve pending work before adding more.");
   return { ...c, operations: [...c.operations, { id: randomUUID(), kind, entityId, version, payload: { ...payload }, at: new Date().toISOString(), status: "waiting", attempts: 0 }] };
  }, id, generation); void refresh();
 }
 async function retry(requestId: string) {
  const id = account.current; if (!id) return;
  await persist(c => ({ ...c, pending: c.pending.map(p => p.id === requestId ? { ...p, status: "waiting", error: undefined } : p), operations: c.operations.map(o => o.id === requestId && o.status !== "conflict" ? { ...o, status: "waiting", error: undefined } : o) }), id);
  await refresh();
 }
 async function discard(requestId: string) {
  const id = account.current; if (!id) return;
  await persist(c => ({ ...c, pending: c.pending.filter(p => p.id !== requestId), operations: c.operations.filter(o => o.id !== requestId), assessments: c.pending.some(p => p.id === requestId) ? c.assessments.filter(a => a.id !== requestId) : c.assessments }), id);
  void refresh();
 }
 async function resolve(requestId: string, keepLocal: boolean) {
  const id = account.current, generation = epoch.current, op = current.current.operations.find(o => o.id === requestId);
  if (!id || !op) return;
  const latest = op.kind === "supplier" ? await supabase.from("suppliers").select("version").eq("id", op.entityId).maybeSingle() : await supabase.from("assessment_reviews").select("version").eq("assessment_id", op.entityId).maybeSingle();
  if (latest.error || (op.kind === "supplier" && !latest.data)) throw Error("Connect and refresh the current server record before resolving this edit.");
  const version = latest.data?.version ?? 0;
  const cachedVersion = op.kind === "supplier" ? current.current.suppliers.find(s => s.id === op.entityId)?.version : current.current.reviews.find(r => r.assessment_id === op.entityId)?.version ?? 0;
  if (keepLocal && (version !== (op.serverVersion ?? cachedVersion) || version !== cachedVersion)) {
   await persist(c => ({ ...c, operations: c.operations.map(o => o.id === op.id ? { ...o, serverVersion: version } : o) }), id, generation);
   await refresh();
   throw Error("The server record changed again. Refresh and review it before confirming.");
  }
  await persist(c => ({ ...c, operations: keepLocal ? c.operations.map(o => o.id === op.id ? { ...o, id: randomUUID(), version, status: "waiting", error: undefined, serverVersion: undefined, attempts: 0 } : o) : c.operations.filter(o => o.id !== op.id) }), id, generation);
  await refresh();
 }
 const connection = network.isConnected === false || network.isInternetReachable === false ? "Offline" : reachable === true ? "Server reachable" : reachable === false ? "Server unavailable or sign-in needs attention" : "Checking connection";
 return <Context.Provider value={{ enteredWorkspace: !!session && !!profile && !!workspace, loading, assessments: cache.assessments, suppliers: cache.suppliers, check, refresh, syncMessage, pendingCount: cache.pending.length + cache.operations.length, syncing, pending: cache.pending, operations: cache.operations, reviews: cache.reviews, history: cache.history, recent: cache.recent, lastSync: cache.lastSync, connection, queueSupplier: (id, version, draft) => queue("supplier", id, version, draft), queueReview: (id, version, draft) => queue("review", id, version, draft), retry, resolve, discard, name: profile?.first_name ?? "Your workspace", scale: Number(profile?.text_scale ?? 1) }}>{children}</Context.Provider>;
}
export function useDemo() { const value = useContext(Context); if (!value) throw Error("Missing workspace provider"); return value; }
