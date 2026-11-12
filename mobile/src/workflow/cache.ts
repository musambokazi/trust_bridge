import type { Assessment, InvoiceInput, Supplier } from "../domain/demo.ts";
import type { Operation, Review, SupplierChange, SyncReceipt } from "./types.ts";
function lastIndex<T>(items: T[], predicate: (item: T) => boolean) { for (let i=items.length-1; i>=0; i--) if (predicate(items[i]!)) return i; return -1; }
export type Pending = { id: string; input: InvoiceInput; at: string; status?: "waiting" | "failed" | "blocked"; error?: string; attempts?: number; lastAttempt?: string };
export type Cache = { suppliers: Supplier[]; assessments: Assessment[]; pending: Pending[]; operations: Operation[]; reviews: Review[]; history: SupplierChange[]; recent: SyncReceipt[]; lastSync?: string };
export const empty = (): Cache => ({ suppliers: [], assessments: [], pending: [], operations: [], reviews: [], history: [], recent: [] });
export function hydrate(raw: string): Cache {
  const c = JSON.parse(raw);
  if (!c || !Array.isArray(c.pending) || (c.operations !== undefined && !Array.isArray(c.operations))) throw Error("Unreadable outbox");
  if (c.pending.some((p: Pending) => !p.id || !p.input?.supplierId) || c.operations?.some((o: Operation) => !o.id || !o.entityId || !["review", "supplier"].includes(o.kind) || !o.payload)) throw Error("Unreadable outbox");
  return { ...empty(), ...c };
}
// Trim only re-downloadable records. Never evict unsynced work to make room.
export function compact(c: Cache): Cache {
  const next = { ...c, history: [...c.history], reviews: [...c.reviews], assessments: [...c.assessments], suppliers: [...c.suppliers] };
  const size = () => JSON.stringify(next).length;
  while (size() > 350000) {
    if (next.history.length) next.history.pop();
    else if (next.reviews.length) next.reviews.pop();
    else {
      const index = lastIndex(next.assessments, a => !next.pending.some(p => p.id === a.id) && !next.operations.some(o => o.entityId === a.id));
      if (index >= 0) next.assessments.splice(index, 1);
      else {
        const supplier = lastIndex(next.suppliers, s => !next.pending.some(p => p.input.supplierId === s.id) && !next.operations.some(o => o.entityId === s.id));
        if (supplier >= 0) next.suppliers.splice(supplier, 1); else throw Error("Device cache is full. Connect and sync before saving more work.");
      }
    }
  }
  return next;
}
