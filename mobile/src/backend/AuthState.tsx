import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase, secureStorage } from "./client";
import type { AccountDraft, Profile, Workspace } from "./types";

type Auth = {
  session: Session | null; ready: boolean; accountReady: boolean; profile: Profile | null; workspace: Workspace | null;
  workspaces: Workspace[]; switchWorkspace: (id: string) => Promise<void>;
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
  const [workspaces,setWorkspaces]=useState<Workspace[]>([]);const activeWorkspace=useRef<string|null>(null);
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
      supabase.from("workspaces").select("*").order("name"),
    ]);
    if (currentId.current !== id) return;
    if (p.error || w.error) { setMessage("Connection unavailable. Showing your last saved account information."); return; }
    const list=w.data??[];
    const selected=list.find(v=>v.id===activeWorkspace.current)??list.find(v=>v.owner_id===id)??list[0]??null;
    let selectedRole="viewer";
    if(selected){const role=await supabase.rpc("workspace_role",{wid:selected.id});selectedRole=typeof role.data==="string"?role.data:selected.owner_id===id?"owner":"viewer";}
    if(currentId.current!==id)return;
    const chosen=selected?{...selected,role:selectedRole as Workspace["role"]}:null;
    activeWorkspace.current=chosen?.id??null;
    setProfile(p.data);setWorkspace(chosen);setWorkspaces(list);setMessage("");
    await secureStorage.setItem("account-" + id, JSON.stringify({ profile: p.data, workspace: chosen, workspaces:list }));
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
    setProfile(null); setWorkspace(null);setWorkspaces([]);activeWorkspace.current=null; setAvatarUrl(null); setAccountReady(false);
    if (!uid) { setAccountReady(true); return; }
    let cancelled = false;
    void (async () => {
      let saved:string|null=null;try{saved=await secureStorage.getItem("account-" + uid);}catch{if(!cancelled)setMessage("Saved account information could not be read. It has been preserved; reconnect to restore access.");}
      if (cancelled) return;
      if (saved) { try { const cache = JSON.parse(saved); setProfile(cache.profile); setWorkspace(cache.workspace);setWorkspaces(cache.workspaces??(cache.workspace?[cache.workspace]:[]));activeWorkspace.current=cache.workspace?.id??null; setAccountReady(true); } catch { /* Ignore damaged cache. */ } }
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
  async function switchWorkspace(nextId:string){
    const id=currentId.current;if(!id)throw Error("Sign in first.");
    if(nextId===activeWorkspace.current)return;
    const raw=await secureStorage.getItem("workspace-"+id+"-"+activeWorkspace.current);
    const legacy=workspace?.owner_id===id?await secureStorage.getItem("workspace-"+id):null;
    for(const value of [raw,legacy])if(value){const c=JSON.parse(value);if(c.pending?.length||c.operations?.length)throw Error("Sync or resolve this workspace's pending work before switching.");}
    const {data,error}=await supabase.from("workspaces").select("id").eq("id",nextId).single();if(error||!data)throw Error("Workspace unavailable. Connect and refresh your access.");
    activeWorkspace.current=nextId;await refresh();
  }
  async function signOut() {
    const id = currentId.current;
    if(id){
      for(const key of ["workspace-"+id,...workspaces.map(w=>"workspace-"+id+"-"+w.id)]){const raw=await secureStorage.getItem(key);if(raw){const saved=JSON.parse(raw);if(saved.pending?.length||saved.operations?.length)throw Error("Resolve pending work in every workspace before signing out.");}}
    }
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw Error("Unable to sign out. Connect and try again.");
    if (id) {
      await secureStorage.removeItem("account-" + id);
      await secureStorage.removeItem("workspace-" + id);
      for(const w of workspaces)await secureStorage.removeItem("workspace-"+id+"-"+w.id);
    }
    setProfile(null); setWorkspace(null); setAvatarUrl(null);
  }
  return <Context.Provider value={{ session, ready, accountReady, profile, workspace, message, avatarUrl, refresh, saveProfile, completeAccount, signOut, workspaces, switchWorkspace }}>{children}</Context.Provider>;
}
export function useAuth() {
  const context = useContext(Context);
  if (!context) throw Error("Missing AuthProvider");
  return context;
}
