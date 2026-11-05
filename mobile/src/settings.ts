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
    ["Your identity", "Your display name appears on Home and Profile. Your name, username and verified email identify your signed-in account."],
    ["Username and email", "Your username identifies your profile. Your verified email will be used to sign in and recover access through Supabase Auth."],
    ["Profile photo", "Choose a photo from your library. The image is resized to a JPEG and stored in a private account folder. Temporary signed links display it to you."],
    ["Account changes", "Names and username are saved to your private profile while connected. Password recovery starts from Sign in. Email and account-type changes are not available here."],
  ],
  "workspace-type": [
    ["Individual workspace", "Use an individual workspace if you handle your own supplier checks. Your profile represents you personally."],
    ["Company workspace", "Use a company workspace when checking invoices on behalf of a business. The signup form asks for the legal business name, country, your role and an optional registration number."],
    ["Existing companies", "Entering a company name does not verify the company or grant access to its records. Live membership will require a separate authorisation step."],
  ],
  "team-access": [
    ["Membership", "Access to a company workspace must come from an authorised invitation. Company names and email domains alone are not evidence of permission."],
    ["Roles and responsibilities", "Teams should designate who may maintain supplier references and who may review invoice discrepancies. This build allows only the account owner to access their workspace. Shared roles are not available."],
    ["Availability", "Team invitations and member management are not connected. Only your own saved supplier records are shown."],
  ],
  security: [
    ["Before paying", "If bank details changed, call the supplier using a number you already trust. Do not use contact details supplied only on the invoice."],
    ["Protect your device", "Use a screen lock on shared or work devices. Avoid leaving an invoice or assessment visible when you step away. Only install TrustBridge builds from a release source you trust."],
    ["Verify account access", "When team access is available, check who sent an invitation and which company it names before accepting. If you change roles or leave a company, ask its administrator to remove access you no longer need."],
    ["Separate review from approval", "Where possible, have a different person verify changes to supplier payment details before anyone updates the reference or approves a payment."],
    ["If something looks wrong", "Pause the payment. Keep the invoice and correspondence in your organisation’s approved system, and tell the person who handles supplier or payment incidents. Avoid forwarding bank details or credentials in an unsecured message."],
    ["Handle urgent requests carefully", "If a request asks you to skip approval, change the account immediately or keep the transfer confidential, pause and use your normal verification process. Time pressure does not confirm a change."],
    ["Online and offline access", "First sign-in requires a connection and a confirmed email. Your cached workspace remains available offline. Pending checks are encrypted on this device until the server can compare them."],
  ],
  display: [["Text size", "The buttons adjust supported body text throughout the app. The sample shows the change before you leave this screen."]],
  about: [
    ["Why TrustBridge exists", "An invoice can look familiar while containing different payment instructions. When checks are rushed or spread across emails and spreadsheets, a small change can be hard to spot. TrustBridge gives that comparison a dedicated step before payment."],
    ["Who it is for", "The workflow is designed for individuals who pay suppliers and for purchasing, finance and operations teams that need to review invoices before passing them to a payment approver."],
    ["Start with a trusted reference", "Select a supplier and inspect the details your workspace holds. A reference should come from an independently verified source; copying information from the invoice into the reference defeats the comparison."],
    ["Run an invoice check", "Open Check, select the supplier and enter the fields requested by the form. TrustBridge compares them with the selected reference and explains the discrepancies it finds."],
    ["Read the result", "A match means the fields checked agreed with the reference. It does not establish that an invoice is authentic. A mismatch tells you what to investigate; a missing reference means there is insufficient information to compare."],
    ["Act on a change", "Pause and contact the supplier using a trusted number or channel already on file. Confirm whether the change is legitimate before updating records or sending money."],
    ["Review previous checks", "History collects the checks made during this session so you can revisit what was compared and what needs follow-up. Synced checks are kept in your account; the device caches the most recent 250 results."],
    ["Keep payment approval separate", "TrustBridge does not transfer funds, authorise a payment or replace your organisation’s approval process. Use the result as one input alongside purchasing records and independently verified instructions."],
    ["What this build connects to", "Supabase provides sign-in, private account data, supplier records, saved comparisons and profile photos. Shared workspaces and independent bank or supplier verification are not offered by this build."],
    ["Example: a familiar supplier with new bank details", "A regular supplier sends an invoice with its usual company name but a different account reference. Compare it against the reference, pause when the discrepancy appears, and call a contact already on file. Confirm the change through your normal process before anyone amends the reference."],
    ["What a useful review record contains", "When you investigate a discrepancy, record what changed, whom you contacted, and the decision you reached in your approved system. This keeps the reasoning available to the next person who reviews the payment."],
    ["What to check first", "Confirm you chose the right supplier before comparing the details. If two suppliers have similar names, use another trusted identifier to distinguish them. A good comparison starts with the right record."],
    ["When the directory has no record", "A missing supplier reference means there is no baseline for a meaningful comparison. Ask the person responsible for supplier records how to verify the supplier before you continue."],
    ["How to hand off an invoice review", "Tell the next reviewer which reference you used, which field differed, and whether you reached the supplier through a known contact. Keep that explanation alongside your normal approval record."],
    ["Where to start", "Open Suppliers to look up a reference, Check to compare an invoice, or History to revisit a result. Profile contains account information, workspace guidance, and the privacy notice and terms."],
  ],
};
