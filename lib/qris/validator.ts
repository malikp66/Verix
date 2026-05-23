import type { QrisData, QrisResult, QrisFlag } from "./types";

const GENERIC_MERCHANT_NAMES = [
  "payment", "transfer", "pembayaran", "topup", "isi ulang",
  "merchant", "toko", "store", "qris", "bayar", "scan",
];

const KNOWN_ACQUIRERS = [
  "BCA", "BRI", "BNI", "MANDIRI", "CIMB", "DANA", "OVO",
  "GOPAY", "SHOPEEPAY", "LINKAJA", "JENIUS", "PERMATA",
  "MAYBANK", "DANAMON", "PANIN", "MEGA", "BSI",
];

export function validateQris(
  data: QrisData,
  reportCount: number = 0,
): Omit<QrisResult, "analysis_type"> {
  const flags: QrisFlag[] = [];
  const flagLabels: string[] = [];
  let score = 0;

  const name = data.merchantName.toLowerCase().trim();
  const city = data.merchantCity.toLowerCase().trim();
  const acquirer = data.acquirer.toUpperCase().trim();

  // 1. Generic merchant name
  if (!name || GENERIC_MERCHANT_NAMES.some((g) => name === g || name.includes(g))) {
    flags.push("merchant_name_generic");
    flagLabels.push("Nama merchant terlalu umum atau tidak spesifik");
    score += 25;
  }

  // 2. Empty or invalid city
  if (!city || city.length < 3) {
    flags.push("city_empty");
    flagLabels.push("Kota merchant tidak terisi atau tidak valid");
    score += 15;
  }

  // 3. Unknown acquirer
  if (!acquirer || !KNOWN_ACQUIRERS.some((a) => acquirer.includes(a))) {
    flags.push("acquirer_mismatch");
    flagLabels.push("Acquirer/penyedia QRIS tidak dikenal");
    score += 20;
  }

  // 4. Reported multiple times
  if (reportCount >= 3) {
    flags.push("reported_multiple");
    flagLabels.push(`Merchant telah dilaporkan ${reportCount} kali oleh pengguna lain`);
    score += Math.min(30, reportCount * 8);
  } else if (reportCount > 0) {
    flags.push("merchant_not_verified");
    flagLabels.push("Merchant belum terverifikasi (pernah dilaporkan)");
    score += 10;
  }

  // 5. Brand impersonation (e.g. name contains "BCA" but acquirer is not BCA)
  const brandKeywords = ["bca", "bri", "bni", "mandiri", "dana", "ovo", "gopay", "shopee"];
  if (brandKeywords.some((b) => name.includes(b))) {
    const matchingBrand = brandKeywords.find((b) => name.includes(b));
    if (matchingBrand && acquirer && !acquirer.toLowerCase().includes(matchingBrand)) {
      flags.push("brand_impersonation");
      flagLabels.push(`Nama merchant mengandung "${matchingBrand.toUpperCase()}" tapi acquirer berbeda`);
      score += 30;
    }
  }

  // Normalize score
  score = Math.max(0, Math.min(100, score));

  const verdict = score >= 80 ? "CRITICAL" as const
    : score >= 60 ? "HIGH" as const
    : score >= 40 ? "MEDIUM" as const
    : score >= 20 ? "LOW" as const
    : "SAFE" as const;

  return {
    risk_score: score,
    verdict,
    merchant: data.merchantName || "Unknown",
    acquirer: data.acquirer || "Unknown",
    city: data.merchantCity || "Unknown",
    flags,
    flagLabels,
    reportCount,
    behavioral_analysis: buildQrisAnalysis(score, flags, flagLabels),
    recommended_actions: buildQrisActions(score, flags),
  };
}

function buildQrisAnalysis(score: number, flags: QrisFlag[], labels: string[]): string {
  if (score >= 60) {
    return `QRIS ini memiliki skor risiko ${score}/100 — ${labels.length} indikasi mencurigakan ditemukan. ${labels.join(". ")}. Sebaiknya jangan melanjutkan transaksi sebelum diverifikasi.`;
  }
  if (score >= 20) {
    return `QRIS ini memiliki skor risiko ${score}/100 dengan beberapa catatan: ${labels.join(". ")}. Disarankan verifikasi ulang sebelum bertransaksi.`;
  }
  return `QRIS ini memiliki skor risiko ${score}/100 — tidak ditemukan indikasi mencurigakan yang signifikan. Namun tetap waspada terhadap modus penipuan QRIS.`;
}

function buildQrisActions(score: number, flags: QrisFlag[]): string[] {
  const actions: string[] = [
    "Verifikasi nama merchant melalui aplikasi resmi bank atau dompet digital Anda.",
  ];

  if (score >= 40) {
    actions.push("Jangan scan QRIS ini sebelum dipastikan kebenarannya.");
    actions.push("Laporkan QRIS mencurigakan ke pihak berwenang.");
  }

  if (flags.includes("brand_impersonation")) {
    actions.push("Hati-hati terhadap impersonasi brand — selalu cek kesesuaian nama merchant dengan aplikasi resmi.");
  }

  if (flags.includes("reported_multiple")) {
    actions.push("QRIS ini sudah dilaporkan berkali-kali oleh pengguna lain. Hindari transaksi.");
  }

  actions.push("Gunakan aplikasi perbankan resmi untuk scan QRIS, bukan aplikasi tidak dikenal.");
  return actions;
}
