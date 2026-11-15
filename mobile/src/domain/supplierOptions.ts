export const supplierCategories = ["IT & technology", "IT Tech Support", "Professional services", "Retail & wholesale", "Construction & maintenance", "Transport & logistics", "Manufacturing", "Food & catering", "Health & wellness", "Education & training", "Marketing & design", "Utilities", "Other"].map(value => ({ label: value, value }));

// Suggested branch codes only. Always confirm the supplier's own bank details.
// Sources checked 2026-11-15: each bank's own documentation.
export const branchOptions = [
  { label: "Absa · 632005", value: "632005", source: "https://www.absa.co.za/business/international-banking/explore-international-payments/" },
  { label: "Capitec Personal · 470010", value: "470010", source: "https://www.capitecbank.co.za/were-here-to-help/faqs/" },
  { label: "FNB · 250655", value: "250655", source: "https://www.online.fnb.co.za/rhelp_0_15/OBE_SA_Downloads/assets/docs/Registered_Mandates_Comprehensive_CSV_Import%20Guide_SA.pdf" },
  { label: "Nedbank · 198765", value: "198765", source: "https://apim.nedbank.co.za/static/docs/verification-bankidentifiers" },
  { label: "Standard Bank · 051001", value: "051001", source: "https://www.standardbank.co.za/southafrica/business/products-and-services/bank-with-us/foreign-exchange/business-international-payments/send-or-receive-money" },
  { label: "Other bank / enter a branch code", value: "custom" },
] as const;
