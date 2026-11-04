export const settings = {
  account: { title: "Account", description: "Identity, contact details and profile photo", icon: "person-outline" },
  workspace: { title: "Your workspace", description: "Suppliers, workspace type and team access", icon: "business-outline" },
  privacy: { title: "Privacy and policy", description: "Privacy notice and terms of service", icon: "lock-closed-outline" },
  security: { title: "Security & access", description: "Account access and payment checks", icon: "shield-checkmark-outline" },
  display: { title: "Reading & display", description: "Adjust body text size", icon: "text-outline" },
  about: { title: "About TrustBridge", description: "What the app does and how it fits your workflow", icon: "information-circle-outline" },
  "privacy-notice": { title: "Privacy notice", description: "How TrustBridge handles information", icon: "document-text-outline" },
  terms: { title: "Terms of service", description: "Rules and limits for using TrustBridge", icon: "document-outline" },
  "workspace-type": { title: "Company or individual", description: "Understand the two workspace types", icon: "business-outline" },
  "team-access": { title: "Team access", description: "Membership, invitations and responsibilities", icon: "people-outline" },
} as const;

export type Setting = keyof typeof settings;
export const profileSettings = ["account", "workspace", "privacy", "security", "display", "about"] as const;

export function isSetting(value: unknown): value is Setting {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(settings, value);
}

export const settingDetails: Partial<Record<Setting, readonly [string, string][]>> = {
  account: [
    ["Your identity", "Your display name appears on Home and Profile. The current account card contains sample details until live accounts are connected."],
    ["Username and email", "Your username identifies your profile. Your verified email will be used to sign in and recover access when account services are connected."],
    ["Profile photo", "Photo uploads require a connected account and private storage. The profile icon is shown until those are available."],
    ["Account changes", "The display name can be edited for this session. Changing an email, password or account type is not available in this build."],
  ],
  "workspace-type": [
    ["Individual workspace", "Use an individual workspace if you handle your own supplier checks. Your profile represents you personally."],
    ["Company workspace", "Use a company workspace when checking invoices on behalf of a business. The signup form asks for the legal business name, country, your role and an optional registration number."],
    ["Existing companies", "Entering a company name does not verify the company or grant access to its records. Live membership will require a separate authorisation step."],
  ],
  "team-access": [
    ["Membership", "Access to a company workspace must come from an authorised invitation. Company names and email domains alone are not evidence of permission."],
    ["Roles and responsibilities", "Teams should designate who may maintain supplier references and who may review invoice discrepancies. These roles are not enforced by the current build."],
    ["Availability", "Team invitations and member management are not connected. This workspace contains fictional records."],
  ],
  security: [
    ["Before paying", "If bank details changed, call the supplier using a number you already trust. Do not use contact details supplied only on the invoice."],
    ["Online and offline access", "Live sign-in and saved sessions are not connected. The current workspace can be explored using fictional records without signing in."],
  ],
  display: [["Text size", "The buttons adjust supported body text throughout the app. The sample shows the change before you leave this screen."]],
  about: [
    ["Why TrustBridge exists", "An invoice can look familiar while containing different payment instructions. When checks are rushed or spread across emails and spreadsheets, a small change can be hard to spot. TrustBridge gives that comparison a dedicated step before payment."],
    ["Who it is for", "The workflow is designed for individuals who pay suppliers and for purchasing, finance and operations teams that need to review invoices before passing them to a payment approver."],
    ["Start with a trusted reference", "Select a supplier and inspect the details your workspace holds. A reference should come from an independently verified source; copying information from the invoice into the reference defeats the comparison."],
    ["Run an invoice check", "Open Check, select the supplier and enter the fields requested by the form. TrustBridge compares them with the selected reference and explains the discrepancies it finds."],
    ["Read the result", "A match means the fields checked agreed with the reference. It does not establish that an invoice is authentic. A mismatch tells you what to investigate; a missing reference means there is insufficient information to compare."],
    ["Act on a change", "Pause and contact the supplier using a trusted number or channel already on file. Confirm whether the change is legitimate before updating records or sending money."],
    ["Review previous checks", "History collects the checks made during this session so you can revisit what was compared and what needs follow-up. This build does not provide a permanent audit record."],
    ["Keep payment approval separate", "TrustBridge does not transfer funds, authorise a payment or replace your organisation’s approval process. Use the result as one input alongside purchasing records and independently verified instructions."],
    ["What this build connects to", "The current supplier directory and assessment history use fictional records. Live accounts, shared workspaces, profile uploads and external supplier verification are not yet connected."],
    ["Where to start", "Open Suppliers to look up a reference, Check to compare an invoice, or History to revisit a result. Profile contains account information, workspace guidance, and the privacy notice and terms."],
  ],
};
