export const legalDocuments = {
  "privacy-notice": [
    ["Comparison snapshots", "New server comparisons retain the reference name, version, review date and masked bank digits used at that time. Later supplier edits do not rewrite past comparisons. Older records without a snapshot are labelled accordingly."],
    ["Supplier change history", "Accepted supplier edits require a reason and create server-written before/after history with the account identifier, version and date. Bank fields in history are masked. Free-text reasons and review notes may contain personal information: do not include passwords or complete bank references there."],
    ["Offline edits and conflicts", "Supplier edits and reviewer checklists are saved to the account-scoped encrypted native outbox before upload. On reconnect, request identifiers prevent duplicate changes. If the server version has changed, the app asks you to compare and resolve it rather than silently overwriting the newer record. Cached history and results are bounded; pending work is retained."],
    ["Review reports", "Export is optional and initiated by you. PDF reports include masked comparison fields and the last synced checklist; notes are excluded unless selected. A shared report leaves the app's access controls. Temporary native PDFs remain in app-private cache for handoff and are pruned on a later export after one hour, or by the operating system. Reports saved or sent to another app must be managed there."],
    [
      "Scope",
      "This notice covers the connected TrustBridge app: registration, email sign-in, private profiles, an owner-controlled workspace, supplier references, invoice comparisons and optional profile photographs. It distinguishes device caching from data saved to Supabase."
    ],
    [
      "Optional invoice import",
      "Android photo and PDF imports use on-device text recognition. Browser and iOS users can paste copied text or enter details manually. Raw files and extracted text are not uploaded by the import feature. Working copies are deleted from app cache after processing, including errors and cancellation; an interrupted process may leave temporary cache files until the operating system clears them. Only reviewed form values enter the existing encrypted check queue when you submit a comparison. Recognition is fallible and does not authenticate an invoice or verify its bank details."
    ],
    [
      "Operator details",
      "The project team must publish its legal operator name and a monitored privacy/support contact before a public launch. This document remains a draft until those details, retention schedules and operational procedures are approved."
    ],
    [
      "Account details",
      "Registration asks for names, a username, email and phone number. Company accounts also ask for business identity, address, tax and registration references, an authorised contact and business activity. Alternate contacts are optional."
    ],
    [
      "Purpose",
      "These fields identify your account and workspace and support invoice review. A company name or tax number is not independent evidence that a business or its payment instructions have been verified."
    ],
    [
      "Authentication",
      "Supabase Auth handles email and password registration, email confirmation, sign-in and password recovery. Passwords are sent to Auth over HTTPS and are not written to the profile or workspace tables."
    ],
    [
      "Email confirmation",
      "Confirm the email sent during registration before completing account setup. Email delivery, redirect configuration and recovery must be tested against the real mail provider before release to the public."
    ],
    [
      "Phone formatting",
      "The selected country and dialing code are stored with an international-format phone number. Country selection is user-provided; it is not proof of residence or citizenship."
    ],
    [
      "Company information",
      "Business fields are saved in the account owner's private workspace. Do not enter another organisation's confidential tax, address or contact details unless you are authorised to use them."
    ],
    [
      "Alternate contacts",
      "Alternative email and phone are optional contact fields. Tell the relevant person before entering their information. The app does not independently verify their consent or their relationship to the business."
    ],
    [
      "Username",
      "Your username identifies your profile within the app. It must be unique and use supported characters. This version does not expose a public profile directory."
    ],
    [
      "Profile photos",
      "You may choose a photograph from your device library. The app resizes it to a JPEG and uploads it to your private avatar folder. It does not request microphone or camera access for that action."
    ],
    [
      "Photo display",
      "The app obtains a temporary signed link to display your photograph. Someone who obtains that link may be able to view the image while the link remains valid, so avoid sharing it."
    ],
    [
      "Workspace ownership",
      "This release supports a workspace owned by one account. The owner can view and maintain its supplier references. Team invitations and shared company memberships are not implemented."
    ],
    [
      "Supplier records",
      "You enter a supplier name, category, registration reference, bank reference and trusted contact. These records are saved to Supabase under your workspace, subject to account access rules."
    ],
    [
      "Invoice inputs",
      "Submitting a check queues the selected supplier and entered invoice fields. Full bank references are retained locally only while the check is pending; the server result stores the final four characters."
    ],
    [
      "Server comparison",
      "The server reads the supplier record available to the account owner and calculates the result. It does not contact a bank or establish ownership of an account number."
    ],
    [
      "Saved results",
      "Synced comparisons are stored in your account with an invoice number, name, amount, time, findings and masked references. History displays the most recent results."
    ],
    [
      "Device cache",
      "On native devices the app keeps account details, supplier summaries and recent results in OS-backed secure storage. The cache is limited and is separate from the server record."
    ],
    [
      "Offline checks",
      "While offline, new checks remain in an encrypted queue. They are explicitly pending and have no server comparison result. The app retries when active and connected."
    ],
    [
      "Sync retries",
      "Each queued check has a unique request identifier. The server uses that identifier to avoid duplicate results when a network response is lost and the device retries."
    ],
    [
      "Session credentials",
      "Native session tokens are stored in OS-backed secure storage. Saved credentials let the app restore the session; server requests still depend on a valid session and access rules."
    ],
    [
      "Offline session limits",
      "An offline device cannot immediately learn that access was revoked remotely. Protect the device and reconnect periodically. Cached information is not a fresh verification of account status."
    ],
    [
      "Browser storage",
      "The web build uses browser session storage for session and cached account data. Browser scripts running in that origin can access it. The native device storage protections do not apply to the browser."
    ],
    [
      "Updates",
      "Expo delivers compatible app updates using platform, runtime and channel information. Update delivery is separate from invoice comparison and is not intended to receive invoice form contents."
    ],
    [
      "Access controls",
      "Row-level security restricts profile, workspace, supplier and result queries to the owning account. These controls complement, rather than replace, the need for correct authentication and secure devices."
    ],
    [
      "Other providers",
      "Supabase hosts Auth, database and avatar storage; Expo provides application update delivery. The project team must review the providers' actual regions, contracts and operational settings for the deployment."
    ],
    [
      "No payments",
      "TrustBridge does not initiate transfers, collect card credentials or authorise payments. Enter references only for comparison and do not upload statements or unrelated identity documents."
    ],
    [
      "Screenshots",
      "Screen captures can reveal names, amounts, contacts and invoice numbers, even when bank references are masked. In the installed mobile app, password-field focus and biometric confirmation temporarily block app-window capture; other screens remain recordable. Browsers do not provide this protection. Optional biometric unlock is a local device check, not server multi-factor authentication. Templates remain with your operating system; the app stores only your device preference. Review a capture before sharing it outside the app."
    ],
    [
      "Shared devices",
      "Sign out before handing a device to another person. The app warns about pending checks before signing out because unsynced work would otherwise be removed from that device."
    ],
    [
      "Local sign-out",
      "Signing out removes the session and local account/workspace cache on this device. It does not delete your server profile, supplier records or saved results."
    ],
    [
      "Corrections",
      "Profile names and username can be corrected while connected. Supplier references should be independently checked before they are saved. Email and account-type changes are not currently supported in Settings."
    ],
    [
      "Retention",
      "Server records remain until an approved deletion process removes them. The team has not yet established a final retention schedule. Uninstalling the app does not delete Supabase records."
    ],
    [
      "Access and deletion requests",
      "A self-service export or account-deletion flow is not yet available. A monitored contact and a verified request-handling process must be published before a public launch."
    ],
    [
      "Incidents",
      "If a device or session may be compromised, use your organisation's reporting procedure and stop entering sensitive data. The team must establish support, notification and incident-response procedures."
    ],
    [
      "Changes",
      "Review this notice when features or data handling change. This draft describes the implemented storage and sync model but is not a claim that the app has completed a legal or production security review."
    ]
  ],
  "terms": [
    [
      "Scope",
      "These draft terms describe the connected TrustBridge release and its limits. A public service needs an identified legal operator, final support contact and approved terms before launch."
    ],
    [
      "Purpose",
      "Use the app to compare invoice details with a supplier reference you maintain. The comparison supports a pre-payment review; it is not a payment instruction or a fraud verdict."
    ],
    [
      "Account eligibility",
      "Use an email and contact information you are authorised to use. Do not impersonate another person or register a company identity without permission."
    ],
    [
      "Email verification",
      "Complete email confirmation before finishing account setup. Keep access to that email because recovery depends on it. Contact verification does not verify a company or supplier."
    ],
    [
      "Password handling",
      "Choose a unique password meeting the displayed requirements. Do not share it with colleagues. The app does not store your password in the workspace or offline queue."
    ],
    [
      "Account recovery",
      "Use the recovery link requested from Sign in. Links expire and require connectivity. Do not forward a recovery email or accept a reset you did not request."
    ],
    [
      "Individual accounts",
      "An individual workspace belongs to the signed-in owner. It is intended for that person's supplier reference and invoice review activities."
    ],
    [
      "Company accounts",
      "A company registration records business details and a contact. It creates an owner-controlled workspace, not a verified legal entity or a shared company membership."
    ],
    [
      "Authority",
      "You are responsible for having permission to enter business information and supplier payment references. Registering a name or domain does not establish that permission."
    ],
    [
      "Team features",
      "This release has no member invitation or role delegation flow. Do not share a single account as a substitute for separate team permissions."
    ],
    [
      "Private workspace",
      "Database access is restricted to the owning account. Do not try to use another person's identifiers or requests to access their records."
    ],
    [
      "Supplier baseline",
      "Use a reference obtained through a process you trust independently of the invoice. Copying the invoice into the reference defeats the comparison."
    ],
    [
      "Supplier accuracy",
      "Keep reference details current and review changes through your normal supplier process. Saving a reference does not independently verify its contact or payment details."
    ],
    [
      "Reference status",
      "New references start as needing verification. TrustBridge does not certify them or claim that a bank has confirmed an account owner."
    ],
    [
      "Input accuracy",
      "Check the supplier, invoice number, amount and reference before submission. A mistyped or incomplete field can affect the comparison."
    ],
    [
      "Match result",
      "A match means the compared fields agree with the stored reference. It does not prove the invoice was authorised, goods were delivered or the sender is genuine."
    ],
    [
      "Mismatch result",
      "A difference is a reason to investigate. It can arise from a legitimate change, an old reference or a mistake, and is not by itself evidence of wrongdoing."
    ],
    [
      "Missing information",
      "If the supplier is unavailable or a baseline is missing, stop and use an independent review process. An unavailable result is not approval to pay."
    ],
    [
      "Independent confirmation",
      "Confirm a payment change through a number or channel already trusted. Do not rely only on contact details supplied in the request for the change."
    ],
    [
      "Payment approval",
      "Follow your organisation's approval and purchasing rules. The app does not execute transfers or replace a second approver where one is required."
    ],
    [
      "No fraud guarantee",
      "The comparison covers selected fields and cannot detect every form of invoice fraud, duplicate billing or impersonation. Continue checks outside the app."
    ],
    [
      "Server results",
      "Only the server issues a synced comparison result. An offline pending screen is a stored request awaiting comparison, not a completed assessment."
    ],
    [
      "Offline use",
      "Cached records may be older than the server. Connect before relying on an up-to-date reference, and wait for pending checks to receive a server result."
    ],
    [
      "Sync behaviour",
      "The app retries queued requests while active. Errors can leave work pending. A unique identifier protects against duplicate results when a request is retried."
    ],
    [
      "History limits",
      "The app caches the most recent 250 results. Server history is not a complete approval audit trail or a substitute for your organisation's evidence."
    ],
    [
      "Sign-out",
      "Sync pending work before signing out. Local sign-out clears device account information but leaves server records in place."
    ],
    [
      "Profile photos",
      "Upload only images you are allowed to use. Profile photos remain in private storage and are displayed through temporary signed links."
    ],
    [
      "Acceptable use",
      "Use TrustBridge for legitimate supplier and invoice review. Do not use the app, its name or its results to mislead others into paying or revealing credentials."
    ],
    [
      "Security testing",
      "Do not attempt unauthorised access to other accounts or disrupt the service. Report unexpected access with minimal necessary information."
    ],
    [
      "Personal information",
      "Read the Privacy notice before registration or uploading contacts. Do not enter information unrelated to the invoice-review workflow."
    ],
    [
      "Device safety",
      "Keep your device locked and install app builds only from the team's verified release source. Protect screenshots and any records you copy outside the app."
    ],
    [
      "Availability",
      "Connectivity, provider failures and device limitations can interrupt sign-in, uploads or comparison. Keep another approved way to review urgent invoices."
    ],
    [
      "Updates",
      "Updates can change screens and features. Let pending work sync before restarting or installing a new build, and review release information where provided."
    ],
    [
      "Support and deletion",
      "Self-service exports, account deletion and operational support procedures are not yet complete. The operator must establish them before a public launch."
    ],
    [
      "Review before launch",
      "These terms are a draft for the current release. Completing technical checks does not replace testing real email delivery, device installation, recovery, privacy operations and the organisation's payment controls."
    ]
  ]
} as const;
