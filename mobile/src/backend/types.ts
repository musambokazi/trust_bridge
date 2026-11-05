export type Profile = {
  id: string; first_name: string; last_name: string; username: string;
  phone: string; phone_country: string; text_scale: number; avatar_path: string | null; created_at?: string;
};
export type Workspace = {
  id?: string; owner_id: string; kind: "individual" | "company"; name: string;
  registration: string; tax_number: string; address: string; country: string;
  contact_name: string; contact_role: string; email: string; alternate_email: string;
  phone: string; alternate_phone: string; industry: string; offering: string;
};
export type AccountDraft = { email: string; profile: Omit<Profile, "id" | "avatar_path">; workspace: Omit<Workspace, "owner_id"> };
