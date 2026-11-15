import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountDraft } from "./types";

/** Avoid INSERT ON CONFLICT: new rows are not yet visible to the role lookup
 * in the SELECT policy, and retries must retain the immutable workspace ID. */
export async function saveRegistrationWorkspace(client: SupabaseClient, ownerId: string, details: AccountDraft["workspace"]) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const existing = await client.from("workspaces").select("id").eq("owner_id", ownerId).maybeSingle();
    if (existing.error) return existing;
    if (existing.data) return client.from("workspaces").update(details).eq("id", existing.data.id).eq("owner_id", ownerId).select("id").single();
    const created = await client.from("workspaces").insert({ ...details, owner_id: ownerId });
    if (created.error?.code !== "23505" || attempt === 1) return created;
  }
  throw Error("Unable to save workspace.");
}
