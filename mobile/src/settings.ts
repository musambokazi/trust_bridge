const info = {
  workspace: {
    title: "Your workspace",
    body: "ACME Traders is a fictional workspace. This UI demonstrates an organisation-specific supplier directory and assessment history. Team invitations, organisation membership and role-based permissions will be supplied by the backend team.",
  },
  privacy: {
    title: "Privacy in this preview",
    body: "This preview uses fictional supplier records. Inputs and newly created demo results stay in memory for the current session and disappear when the app reloads. Do not enter real bank details, passwords or personal information. There is no analytics collection or connection to a verification service in this UI. The production privacy policy, retention rules and deletion process must be agreed before launch.",
  },
  security: {
    title: "Security & access",
    body: "Live authentication and permissions are not connected. Production invoice assessments must run on the backend. The team’s integration needs server-side input validation, organisation isolation using RLS, authorised supplier updates and audit logging. This UI does not certify any of those controls as implemented.",
  },
  about: {
    title: "About TrustBridge",
    body: "TrustBridge helps businesses compare invoice details with approved supplier reference records, understand discrepancies and decide what to independently verify before payment. It does not prove fraud or guarantee an invoice is authentic. Frontend concept 0.1.0 · NEMISA hackathon.",
  },
};


export const settings = {
  account: { title: "Account", description: "Edit your preview display name", icon: "person-outline" },
  workspace: { ...info.workspace, description: "Organisation and team access", icon: "business-outline" },
  privacy: { ...info.privacy, description: "What this demo stores and shares", icon: "lock-closed-outline" },
  security: { ...info.security, description: "Authentication and permissions", icon: "shield-checkmark-outline" },
  display: { title: "Reading & display", description: "Adjust body text size", icon: "text-outline" },
  "sign-in": { title: "View sign-in design", description: "Open the account preview", icon: "log-in-outline" },
  reset: { title: "Reset demo checks", description: "Clear checks created in this session", icon: "refresh-outline" },
  about: { ...info.about, description: "What the app does and how to use the preview", icon: "information-circle-outline" },
} as const;

export type Setting = keyof typeof settings;

export function isSetting(value: unknown): value is Setting {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(settings, value);
}
