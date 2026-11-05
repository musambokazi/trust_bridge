import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { randomUUID } from "expo-crypto";
import { supabase, secureStorage } from "../backend/client";
import { useAuth } from "../backend/AuthState";
import { type Assessment, type InvoiceInput, type Supplier, validateInvoice } from "../domain/demo";

type Pending = { id: string; input: InvoiceInput; at: string };
type Cache = { suppliers: Supplier[]; assessments: Assessment[]; pending: Pending[] };
type State = {
  enteredWorkspace: boolean; loading: boolean;
  assessments: Assessment[]; suppliers: Supplier[];
  check: (input: InvoiceInput) => Promise<string>;
  name: string; scale: number;
  refresh: () => Promise<void>; syncMessage: string; pendingCount: number;
};
const Context = createContext<State | null>(null);
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const { session, profile, workspace } = useAuth();
  const uid = session?.user.id;
  const [cache, setCache] = useState<Cache>({ suppliers: [], assessments: [], pending: [] });
  const [loading, setLoading] = useState(true);
  const [syncMessage, setSyncMessage] = useState("");
  const current = useRef(cache);
  const activeId = useRef<string | null>(null);
  const syncing = useRef(false);
  const writes = useRef(Promise.resolve());
  async function persist(update: (value: Cache) => Cache, id: string) {
    const task = writes.current.then(async () => {
      if (activeId.current !== id) return;
      const next = update(current.current);
      await secureStorage.setItem("workspace-" + id, JSON.stringify(next));
      if (activeId.current === id) { current.current = next; setCache(next); }
    });
    writes.current = task.catch(() => {});
    await task;
  }
  async function refresh() {
    const id = activeId.current;
    if (!id || !workspace?.id || syncing.current) return;
    syncing.current = true;
    try {
      const pending = [...current.current.pending];
      for (const item of pending) {
        if (activeId.current !== id) return;
        const result = await supabase.rpc("compare_invoice", {
          request_id: item.id, supplier: item.input.supplierId, invoice_number: item.input.invoiceNumber,
          invoice_name: item.input.supplierName, invoice_amount: Number(item.input.amount), invoice_reference: item.input.bankReference,
        });
        if (result.error) {
          setSyncMessage(result.error.code === "P0001" ? "A queued check needs attention. Its supplier may have changed. Please keep it and contact support before signing out." : "Offline or unable to sync. Pending checks remain encrypted on this device.");
          return;
        }
        await persist((value) => ({ ...value, pending: value.pending.filter((entry) => entry.id !== item.id), assessments: [result.data as Assessment, ...value.assessments.filter((entry) => entry.id !== item.id)] }), id);
      }
      const [suppliers, results] = await Promise.all([
        supabase.from("suppliers").select("*").eq("workspace_id", workspace.id).order("name").limit(250),
        supabase.from("assessments").select("result").eq("user_id", id).order("created_at", { ascending: false }).limit(250),
      ]);
      if (activeId.current !== id) return;
      if (suppliers.error || results.error) { setSyncMessage("Offline or unable to sync. Showing saved data."); return; }
      const mapped: Supplier[] = (suppliers.data ?? []).map((s) => ({
        id: s.id, name: s.name, initials: s.name.split(/\s+/).map((p: string) => p[0]).slice(0, 2).join(""),
        category: s.category, registration: s.registration, bankReference: s.bank_reference.slice(-4),
        verified: !!s.reviewed_at, verifiedOn: s.reviewed_at ? new Date(s.reviewed_at).toLocaleDateString() : undefined, contact: s.contact,
      }));
      await persist((value) => ({ ...value, suppliers: mapped, assessments: [...value.assessments.filter((a) => value.pending.some((p) => p.id === a.id)), ...(results.data ?? []).map((r) => r.result as Assessment)] }), id);
      setSyncMessage(current.current.pending.length ? "Some checks are still waiting to sync." : "Synced with your account.");
    } catch { setSyncMessage("Offline or unable to sync. Your saved data remains on this device."); }
    finally { syncing.current = false; }
  }
  useEffect(() => {
    activeId.current = uid ?? null;
    current.current = { suppliers: [], assessments: [], pending: [] };
    setCache(current.current); setLoading(true);
    if (!uid) { setLoading(false); return; }
    let cancelled = false;
    void (async () => {
      try {
        const saved = await secureStorage.getItem("workspace-" + uid);
        if (!cancelled && saved) { const parsed = JSON.parse(saved) as Cache; current.current = parsed; setCache(parsed); }
      } catch { if (!cancelled) setSyncMessage("Saved data could not be read. Connect to load your account."); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [uid]);
  useEffect(() => {
    if (loading) return;
    void refresh();
    const interval = setInterval(() => { if (AppState.currentState === "active") void refresh(); }, 30000);
    const listener = AppState.addEventListener("change", (state) => { if (state === "active") void refresh(); });
    return () => { clearInterval(interval); listener.remove(); };
  }, [loading, uid, workspace?.id]);
  async function check(input: InvoiceInput) {
    const id = activeId.current;
    if (!id || !workspace?.id) throw Error("Finish account setup first.");
    if (!current.current.suppliers.some((s) => s.id === input.supplierId)) throw Error("Add or sync the supplier before creating a check.");
    if (Object.keys(validateInvoice(input)).length) throw Error("Check the invoice fields.");
    if (current.current.pending.length >= 50) throw Error("Sync your pending checks before adding more.");
    const requestId = randomUUID();
    const at = new Date().toISOString();
    const item: Assessment = {
      id: requestId, invoiceNumber: input.invoiceNumber, supplierName: input.supplierName, supplierId: input.supplierId,
      amount: Number(input.amount), date: at, level: "unknown", submittedReference: input.bankReference.slice(-4),
      findings: [{ field: "sync", title: "Waiting for server comparison", detail: "This check is saved on your device. It has not been compared or approved. Connect and sync to receive a result.", mismatch: true }],
    };
    await persist((value) => ({ ...value, pending: [...value.pending, { id: requestId, input: { ...input }, at }], assessments: [item, ...value.assessments].slice(0, 250) }), id);
    void refresh();
    return requestId;
  }
  return <Context.Provider value={{
    enteredWorkspace: !!session && !!profile && !!workspace, loading,
    suppliers: cache.suppliers, assessments: cache.assessments, check, refresh, syncMessage, pendingCount: cache.pending.length,
    name: profile?.first_name ?? "Your workspace", scale: Number(profile?.text_scale ?? 1),
  }}>{children}</Context.Provider>;
}
export function useDemo() {
  const value = useContext(Context);
  if (!value) throw Error("Missing workspace provider");
  return value;
}
