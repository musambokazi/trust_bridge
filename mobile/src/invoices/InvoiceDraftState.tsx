import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "../backend/AuthState";
import type { InvoiceImport } from "./importer";

type Draft = InvoiceImport & { supplierId: string };
type State = { draft: Draft | null; start: (draft: Draft) => void; clear: () => void };
const Context = createContext<State | null>(null);

// Invoice contents never enter navigation URLs or device storage. Changing the
// account/workspace clears only this draft, without remounting auth screens.
export function InvoiceDraftProvider({ children }: { children: React.ReactNode }) {
  const { session, workspace } = useAuth();
  const scope = `${session?.user.id ?? ""}:${workspace?.id ?? ""}`;
  const [saved, setSaved] = useState<{ scope: string; draft: Draft } | null>(null);
  const clear = useCallback(() => setSaved(null), []);
  const start = useCallback((draft: Draft) => setSaved({ scope, draft }), [scope]);
  useEffect(() => { setSaved(current => current?.scope === scope ? current : null); }, [scope]);
  return <Context.Provider value={{ draft: saved?.scope === scope ? saved.draft : null, start, clear }}>{children}</Context.Provider>;
}
export function useInvoiceDraft() {
  const value = useContext(Context);
  if (!value) throw Error("Invoice draft provider is missing.");
  return value;
}
