import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase, secureStorage } from "./client";
import type { AccountDraft, Profile, Workspace } from "./types";

type Auth = {
  session: Session | null; ready: boolean; accountReady: boolean; profile: Profile | null; workspace: Workspace | null;
  message: string; avatarUrl: string | null;
  refresh: () => Promise<void>;
  saveProfile: (changes: Partial<Profile>) => Promise<void>;
  completeAccount: (draft: AccountDraft) => Promise<void>;
  signOut: () => Promise<void>;
};
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [accountReady, setAccountReady] = useState(false);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [message, setMessage] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const currentId = useRef<string | null>(null);
  const writeChain = useRef(Promise.resolve());
  const uid = session?.user.id;
  async function refresh() {
    const id = currentId.current;
    if (!id) return;
    const [p, w] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabase.from("workspaces").select("*").eq("owner_id", id).maybeSingle(),
    ]);
    if (currentId.current !== id) return;
    if (p.error || w.error) { setMessage("Connection unavailable. Showing your last saved account information."); return; }
    setProfile(p.data); setWorkspace(w.data); setMessage("");
    await secureStorage.setItem("account-" + id, JSON.stringify({ profile: p.data, workspace: w.data }));
    if (p.data?.avatar_path) {
      const signed = await supabase.storage.from("avatars").createSignedUrl(p.data.avatar_path, 300);
      if (currentId.current === id) setAvatarUrl(signed.data?.signedUrl ?? null);
    } else setAvatarUrl(null);
  }
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (active) { setSession(data.session); setMessage(error ? "Session could not be restored. Please sign in." : ""); setReady(true); }
    }).catch(() => { if (active) { setReady(true); setMessage("Could not read the saved session."); } });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) { setSession(next); setReady(true); }
    });
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    return () => { active = false; data.subscription.unsubscribe(); app.remove(); };
  }, []);
  useEffect(() => {
    currentId.current = uid ?? null;
    setProfile(null); setWorkspace(null); setAvatarUrl(null); setAccountReady(false);
    if (!uid) { setAccountReady(true); return; }
    let cancelled = false;
    void (async () => {
      const saved = await secureStorage.getItem("account-" + uid);
      if (cancelled) return;
      if (saved) { try { const cache = JSON.parse(saved); setProfile(cache.profile); setWorkspace(cache.workspace); setAccountReady(true); } catch { /* Ignore damaged cache. */ } }
      try { await refresh(); } catch { if (!cancelled) setMessage("Unable to refresh account information."); }
      finally { if (!cancelled) setAccountReady(true); }
    })();
    const app = AppState.addEventListener("change", (state) => { if (state === "active") void refresh().catch(() => {}); });
    return () => { cancelled = true; app.remove(); };
  }, [uid]);
  async function saveProfile(changes: Partial<Profile>) {
    const id = currentId.current;
    if (!id) throw Error("Sign in to update your profile.");
    const allowed = Object.fromEntries(Object.entries(changes).filter(([key]) => ["first_name", "last_name", "username", "phone", "phone_country", "text_scale", "avatar_path"].includes(key)));
    const task = writeChain.current.then(async () => {
      const { error } = await supabase.from("profiles").update(allowed).eq("id", id);
      if (error) throw Error(error.code === "23505" ? "That username is taken." : "Could not save your profile. Check your connection and try again.");
      await refresh();
    });
    writeChain.current = task.catch(() => {});
    return task;
  }
  async function completeAccount(draft: AccountDraft) {
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data.user?.email_confirmed_at || data.user.email?.toLowerCase() !== draft.email.toLowerCase()) throw Error("Verify your email and sign in to finish account setup.");
    const id = data.user.id;
    const p = await supabase.from("profiles").upsert({ ...draft.profile, id }, { onConflict: "id" });
    if (p.error) throw Error(p.error.code === "23505" ? "That username is taken. Choose another." : "Could not save profile details.");
    const w = await supabase.from("workspaces").upsert({ ...draft.workspace, owner_id: id }, { onConflict: "owner_id" });
    if (w.error) throw Error("Could not save workspace details. You can retry without creating another account.");
    await secureStorage.removeItem("registration-draft");
    await refresh();
  }
  async function signOut() {
    const id = currentId.current;
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw Error("Unable to sign out. Connect and try again.");
    if (id) {
      await secureStorage.removeItem("account-" + id);
      await secureStorage.removeItem("workspace-" + id);
    }
    setProfile(null); setWorkspace(null); setAvatarUrl(null);
  }
  return <Context.Provider value={{ session, ready, accountReady, profile, workspace, message, avatarUrl, refresh, saveProfile, completeAccount, signOut }}>{children}</Context.Provider>;
}
export function useAuth() {
  const context = useContext(Context);
  if (!context) throw Error("Missing AuthProvider");
  return context;
}
