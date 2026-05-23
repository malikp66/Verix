interface ScanResult {
  severity_score: number;
  risk_level: string;
  red_flags: string[];
  behavioral_analysis: string;
  recommended_actions: string[];
  external_intelligence?: {
    virustotal?: string;
    safe_browsing?: string;
    urlscan?: string;
  };
}

/**
 * Formats a threat engine scan result into a WhatsApp-friendly premium markdown structure.
 */
export function formatScanResult(result: ScanResult, url?: string): string {
  const risk = result.risk_level ? result.risk_level.toUpperCase() : 'UNKNOWN';
  
  let riskEmoji = '🟢 SAFE';
  if (risk === 'CRITICAL') riskEmoji = '🔴 CRITICAL RISK';
  else if (risk === 'HIGH') riskEmoji = '🟠 HIGH RISK';
  else if (risk === 'MEDIUM') riskEmoji = '🟡 MEDIUM RISK';

  let text = `🛡️ *VERIX Security Scan*\n\n`;

  if (url) {
    text += `🔗 *URL:*\n${url}\n\n`;
  }

  text += `⚠️ *Status:*\n${riskEmoji}\n\n`;
  text += `📊 *Risk Score:*\n${result.severity_score} / 100\n\n`;

  if (result.red_flags && result.red_flags.length > 0) {
    text += `🚩 *Red Flags:*\n`;
    // Show top 5 red flags
    result.red_flags.slice(0, 5).forEach((flag) => {
      text += `• ${flag}\n`;
    });
    text += `\n`;
  }

  text += `🧠 *Analisis:*\n${result.behavioral_analysis || 'Tidak ada detail analisis.'}\n\n`;

  if (result.recommended_actions && result.recommended_actions.length > 0) {
    text += `✅ *Rekomendasi:*\n`;
    result.recommended_actions.slice(0, 4).forEach((action) => {
      text += `• ${action}\n`;
    });
    text += `\n`;
  }

  if (result.external_intelligence) {
    const { virustotal, safe_browsing, urlscan } = result.external_intelligence;
    if (virustotal || safe_browsing || urlscan) {
      text += `🌐 *OSINT Signals:*\n`;
      if (safe_browsing) text += `• Google Safe Browsing: ${safe_browsing}\n`;
      if (virustotal) text += `• VirusTotal: ${virustotal}\n`;
      if (urlscan) text += `• URLScan: ${urlscan}\n`;
      text += `\n`;
    }
  }

  text += `\n*Powered by VERIX AI*`;
  return text;
}

/**
 * Returns the educational help menu formatting.
 */
export function formatHelpMessage(): string {
  return `🛡️ *VERIX AI - Panduan Keamanan*

Halo! Saya adalah bot asisten keamanan VERIX. Kirimkan pesan teks mencurigakan, link (URL), atau screenshot untuk saya analisis secara real-time.

*Cara Menggunakan:*
1. *Cek Tautan:* Kirim chat berisi link. Contoh: "cek ini http://bca-login.xyz"
2. *Cek Screenshot:* Kirim screenshot SMS, WA chat, atau tampilan web yang mencurigakan.
3. *Cek Pesan Teks:* Copas pesan tawaran hadiah, undian, atau kurir paket langsung ke chat ini.

💡 *Tips Menghindari Phishing & Scam:*
• *Jangan terburu-buru:* Penipu sering menggunakan taktik kepanikan/urgensi (misal: "rekening diblokir dalam 1 jam").
• *Periksa domain:* Bank/Layanan resmi tidak akan menggunakan domain gratis atau aneh (seperti .xyz, .top, .site, .apk).
• *Jangan unduh file .APK:* File undangan pernikahan palsu atau resi paket (.apk) adalah malware pencuri OTP.
• *Jangan bagikan OTP/PIN:* Bank tidak pernah meminta kode OTP atau PIN Anda untuk alasan apa pun.


*Powered by VERIX AI*`;
}

/**
 * Returns the response when a scam is reported.
 */
export function formatReportScamMessage(): string {
  return `🛡️ *VERIX - Laporan Scam Diterima*

Terima kasih atas laporan Anda! Konten mencurigakan yang Anda kirimkan telah dicatat ke dalam database ancaman kami untuk melindungi pengguna lain.

*Mitigasi Segera:*
• Jangan klik tautan apa pun dari pengirim tersebut.
• Blokir nomor pengirim di WhatsApp Anda.
• Jika Anda sudah terlanjur memasukkan data perbankan/PIN, segera hubungi call center resmi Bank Anda untuk memblokir rekening.

Tetap waspada! 🛡️`;
}

/**
 * Returns the response when the user exceeds rate limits.
 */
export function formatRateLimitMessage(remainingSeconds: number): string {
  return `⚠️ *Batas Permintaan Terlampaui*

Mohon tunggu sekitar *${remainingSeconds} detik* sebelum mengirim pesan analisis berikutnya. Ini untuk mencegah spam pada sistem kami. Terima kasih!`;
}

/**
 * Returns the general error fallback message.
 */
export function formatErrorMessage(): string {
  return `🚨 *Analisis Gagal*

Maaf, analisis tidak dapat diselesaikan saat ini karena gangguan koneksi ke mesin pendeteksi ancaman VERIX. Silakan coba beberapa saat lagi.`;
}
