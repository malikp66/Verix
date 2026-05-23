const BANK_KEYWORDS = [
  "bca", "bri", "bni", "mandiri", "dana", "ovo", "gopay", "linkaja",
  "jenius", "permata", "cimb", "maybank", "danamon", "panin", "mega",
  "bukopin", "btn", "bsi", "syariah", "nobu", "bank",
];

const MALWARE_KEYWORDS = [
  "apk", ".apk", "install", "aplikasi berbahaya", "malware", "trojan",
  "spyware", "ransomware", "virus", "backdoor", "unduh aplikasi",
];

const URGENCY_KEYWORDS = [
  "segera", "darurat", "hari ini", "batas waktu", "terakhir",
  "jangan sampai", "wasap", "urgent", "penting", "perhatian",
  "warning", "alert", "critical", "immediately", "hurry",
];

const FINANCIAL_KEYWORDS = [
  "transfer", "saldo", "rekening", "pembayaran", "tagihan",
  "pin", "otp", "kartu kredit", "debit", "tarik tunai",
  "uang", "rupiah", "dana", "topup", "balance",
];

const SOCIAL_ENGINEERING_KEYWORDS = [
  "social engineering", "phishing", "manipulasi", "kedok",
  "mengatasnamakan", "mengelabui", "tipu", "penipuan",
  "scam", "hoax", "palsu", "fake", "fraud",
];

function countKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter(kw => lower.includes(kw)).length;
}

export type ScoreResult = {
  risk_score: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

export function scoreArticle(title: string, description: string = "", content: string = ""): ScoreResult {
  const combined = `${title} ${description} ${content}`.toLowerCase();

  let score = 0;

  // +30 Banking impersonation
  const bankHits = countKeywords(combined, BANK_KEYWORDS);
  if (bankHits >= 2) score += 30;
  else if (bankHits === 1) score += 15;

  // +25 Malware/APK
  if (countKeywords(combined, MALWARE_KEYWORDS) > 0) score += 25;

  // +20 Urgency language
  if (countKeywords(combined, URGENCY_KEYWORDS) > 0) score += 20;

  // +15 Financial request
  if (countKeywords(combined, FINANCIAL_KEYWORDS) > 0) score += 15;

  // +10 Social engineering pattern
  if (countKeywords(combined, SOCIAL_ENGINEERING_KEYWORDS) > 0) score += 10;

  // Cap at 100
  score = Math.min(100, score);

  // Map to severity
  let severity: ScoreResult["severity"];
  if (score >= 81) severity = "CRITICAL";
  else if (score >= 51) severity = "HIGH";
  else if (score >= 21) severity = "MEDIUM";
  else severity = "LOW";

  return { risk_score: score, severity };
}
