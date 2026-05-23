export type QrisData = {
  merchantName: string;
  merchantCity: string;
  acquirer: string;
  terminalId?: string;
  txId?: string;
  raw: string;
};

export type QrisFlag =
  | "merchant_not_verified"
  | "merchant_name_generic"
  | "merchant_name_mismatch"
  | "city_empty"
  | "acquirer_mismatch"
  | "reported_multiple"
  | "static_qr_mass_use"
  | "brand_impersonation";

export type QrisResult = {
  risk_score: number;
  verdict: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  merchant: string;
  acquirer: string;
  city: string;
  flags: QrisFlag[];
  flagLabels: string[];
  reportCount: number;
  behavioral_analysis: string;
  recommended_actions: string[];
  analysis_type: "qris";
};
