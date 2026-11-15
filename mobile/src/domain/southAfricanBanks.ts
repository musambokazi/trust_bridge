import type { ImageSourcePropType } from "react-native";

// Bank coverage: SARB registered banks/member banks and mutual-bank register,
// plus Postbank. Logo provenance: assets/banks/SOURCES.md.
// checked 2026-11-15. Liquidated banks and representative-only offices excluded.
// Codes: https://apim.nedbank.co.za/static/docs/verification-bankidentifiers
// Banks without a confirmed preset deliberately require manual branch entry.
export type Bank = { id: string; name: string; code?: string; image?: ImageSourcePropType };
export const southAfricanBanks: readonly Bank[] = [
  { id: "absa", name: "Absa", code: "632005", image: require("../../assets/banks/absa.png") },
  { id: "access", name: "Access Bank", code: "410105", image: require("../../assets/banks/access.png") },
  { id: "african", name: "African Bank", code: "430000", image: require("../../assets/banks/african.png") },
  { id: "african-business", name: "African Bank Business", code: "584000", image: require("../../assets/banks/african.png") },
  { id: "albaraka", name: "Al Baraka Bank", code: "800000", image: require("../../assets/banks/albaraka.png") },
  { id: "bank-zero", name: "Bank Zero", code: "888000", image: require("../../assets/banks/bank-zero.png") },
  { id: "bidvest", name: "Bidvest Bank", code: "462005", image: require("../../assets/banks/bidvest.png") },
  { id: "capitec", name: "Capitec Personal", code: "470010", image: require("../../assets/banks/capitec.png") },
  { id: "capitec-business", name: "Capitec Business", code: "450105", image: require("../../assets/banks/capitec-business.png") },
  { id: "discovery", name: "Discovery Bank", code: "679000", image: require("../../assets/banks/discovery.png") },
  { id: "enl", name: "eNL Mutual Bank (formerly YWBN)", code: "353000", image: require("../../assets/banks/enl.png") },
  { id: "finbond", name: "Finbond Mutual Bank", code: "589000", image: require("../../assets/banks/finbond.png") },
  { id: "fnb", name: "FNB / FirstRand", code: "250655", image: require("../../assets/banks/fnb.png") },
  { id: "gbs", name: "GBS Mutual Bank", image: require("../../assets/banks/gbs.png") },
  { id: "gotyme", name: "GoTyme (TymeBank)", code: "678910", image: require("../../assets/banks/gotyme.png") },
  { id: "hbz", name: "HBZ Bank", image: require("../../assets/banks/hbz.png") },
  { id: "postbank", name: "Postbank", image: require("../../assets/banks/postbank.png") },
  { id: "investec", name: "Investec", code: "580105", image: require("../../assets/banks/investec.png") },
  { id: "nedbank", name: "Nedbank", code: "198765", image: require("../../assets/banks/nedbank.png") },
  { id: "om-bank", name: "OM Bank", code: "352000", image: require("../../assets/banks/old-mutual.png") },
  { id: "sasfin", name: "Sasfin Bank", code: "683000", image: require("../../assets/banks/sasfin.png") },
  { id: "standard", name: "Standard Bank", code: "051001", image: require("../../assets/banks/standard.png") },
  { id: "ksk", name: "KSK Co-operative Bank", image: require("../../assets/banks/ksk.png") },
  { id: "osk", name: "OSK Co-operative Bank" },
  { id: "ziphakamise", name: "Ziphakamise Co-operative Bank", image: require("../../assets/banks/ziphakamise.png") },
  { id: "gig", name: "GIG Co-operative Bank", image: require("../../assets/banks/gig.png") },
  { id: "bank-china", name: "Bank of China (South Africa)", image: require("../../assets/banks/bank-china.png") },
  { id: "bank-taiwan", name: "Bank of Taiwan (South Africa)", image: require("../../assets/banks/bank-taiwan.png") },
  { id: "bnp", name: "BNP Paribas (South Africa)", image: require("../../assets/banks/bnp.png") },
  { id: "bank-communications", name: "Bank of Communications (South Africa)", image: require("../../assets/banks/bank-communications.png") },
  { id: "china-construction", name: "China Construction Bank (South Africa)", image: require("../../assets/banks/china-construction.png") },
  { id: "citi", name: "Citibank (South Africa)", image: require("../../assets/banks/citi.png") },
  { id: "deutsche", name: "Deutsche Bank (South Africa)", image: require("../../assets/banks/deutsche.png") },
  { id: "goldman", name: "Goldman Sachs (South Africa)", image: require("../../assets/banks/goldman.png") },
  { id: "hsbc", name: "HSBC (South Africa)", image: require("../../assets/banks/hsbc.png") },
  { id: "jpmorgan", name: "J.P. Morgan (South Africa)", image: require("../../assets/banks/jpmorgan.png") },
  { id: "standard-chartered", name: "Standard Chartered (South Africa)", image: require("../../assets/banks/standard-chartered.png") },
  { id: "sbi", name: "State Bank of India (South Africa)", image: require("../../assets/banks/sbi.png") },
];
