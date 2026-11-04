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
  welcome: { title: "Welcome tour", description: "See how TrustBridge fits into your payment checks", icon: "compass-outline" },
  about: { ...info.about, description: "What the app does and how to use the preview", icon: "information-circle-outline" },
} as const;

export type Setting = keyof typeof settings;

export function isSetting(value: unknown): value is Setting {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(settings, value);
}

export const settingDetails: Partial<Record<Setting, readonly [string, string][]>> = {
  account: [
    ["Your identity", "Your display name appears on Home and Profile. This preview uses a sample email and username, with no live account attached."],
    ["Profile photo", "Photo uploads will be available when your TrustBridge account and private photo storage are connected."],
  ],
  workspace: [
    ["Supplier directory", "Use Suppliers to look up the reference records your workspace checks invoices against."],
    ["Company or individual", "Companies will provide their legal business name, registration number where applicable and your role. Individuals will set up a workspace under their own name."],
    ["Team access", "A company registration does not by itself grant access to an existing organisation or its supplier records."],
  ],
  privacy: [
    ["What stays on this device", "Preview checks and display preferences are held for the current app session. Restarting clears them."],
    ["What to enter", "Use fictional invoice details in this preview. Never enter a real banking reference or reuse a real password."],
  ],
  security: [
    ["Before paying", "If bank details changed, call the supplier using a number you already trust. Do not use contact details supplied only on the invoice."],
    ["Online and offline access", "First sign-in and account verification will require internet. Offline access will depend on a previously established session and will not make live supplier verification available."],
  ],
  display: [["Text size", "The buttons adjust supported body text throughout the app. The sample below shows the change before you leave this screen."]],
  reset: [["What gets cleared", "Only invoice checks created during this session are removed. The original sample checks remain available."]],
  about: [
    ["How it works", "Choose a supplier, enter invoice details, then review the comparison with the workspace reference. History lets you revisit the result."],
    ["What a match means", "A match means the compared fields agree with the reference. It is not proof that an invoice is genuine or permission to pay."],
  ],
};
