export interface ThreatReport {
  score: number;
  riskLevel: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  redFlags: string[];
  triggers: string[];
}

// Lists of keywords and domains for deterministic heuristic check
const URGENCY_KEYWORDS = [
  'segera', 'cepat', '1x24', '24 jam', 'batas waktu', 'blokir', 
  'ditangguhkan', 'suspend', 'darurat', 'ancaman', 'denda', 'pinalti',
  'terkunci', 'konfirmasi sekarang', 'sebelum terlambat',
  'akun akan diambil alih'
];

const FRAUD_KEYWORDS = [
  'salah transfer', 'menang undian', 'hadiah shopee', 'pinjol', 
  'kurir paket', 'surat tilang', 'undian bri', 'bca mobile',
  'dana kaget', 'saldo gratis', 'investasi untung', 'giveaway',
  'tarif transfer', 'biaya admin baru', 'penyesuaian biaya', 
  'upgrade rekening', 'kode verifikasi', 'jangan bagikan kode', 'otp'
];

const BRAND_VERIFICATIONS: { brand: string; keywords: string[]; officialDomains: string[] }[] = [
  {
    brand: 'BCA',
    keywords: ['bca', 'klikbca', 'mybca'],
    officialDomains: ['bca.co.id', 'klikbca.com', 'mybca.bca.co.id']
  },
  {
    brand: 'BRI',
    keywords: ['bri', 'brimo'],
    officialDomains: ['bri.co.id', 'promo.bri.co.id']
  },
  {
    brand: 'Mandiri',
    keywords: ['mandiri', 'livin'],
    officialDomains: ['bankmandiri.co.id', 'livinbymandiri.co.id']
  },
  {
    brand: 'BNI',
    keywords: ['bni', 'bni mobile'],
    officialDomains: ['bni.co.id']
  },
  {
    brand: 'J&T Express',
    keywords: ['j&t', 'jnt', 'kurir j&t'],
    officialDomains: ['jet.co.id', 'jnt.co.id']
  },
  {
    brand: 'JNE',
    keywords: ['jne', 'kurir jne'],
    officialDomains: ['jne.co.id']
  },
  {
    brand: 'Shopee',
    keywords: ['shopee', 'spay', 'shopeepay'],
    officialDomains: ['shopee.co.id', 'shopee.com']
  },
  {
    brand: 'Tokopedia',
    keywords: ['tokopedia', 'tokoped', 'toko pedia'],
    officialDomains: ['tokopedia.com']
  },
  {
    brand: 'Gojek',
    keywords: ['gojek', 'gopay'],
    officialDomains: ['gojek.com']
  },
  {
    brand: 'Grab',
    keywords: ['grab', 'grabpay'],
    officialDomains: ['grab.com']
  },
  {
    brand: 'DANA',
    keywords: ['dana.id', 'dompet dana', 'akun dana'],
    officialDomains: ['dana.id', 'dana.co.id']
  },
  {
    brand: 'OVO',
    keywords: ['ovo.id', 'ovo payment', 'ovo pay'],
    officialDomains: ['ovo.id']
  },
  {
    brand: 'WhatsApp',
    keywords: ['whatsapp', 'wa-security', 'wa-protect', 'wa-update'],
    officialDomains: ['whatsapp.com', 'wa.me']
  },
  {
    brand: 'Kominfo',
    keywords: ['kominfo'],
    officialDomains: ['kominfo.go.id']
  }
];

const SUSPICIOUS_TLDS = [
  '.xyz', '.top', '.icu', '.cf', '.ga', '.gq', '.ml', '.tk', 
  '.site', '.online', '.click', '.link', '.win', '.loan', '.download'
];

const SHORTENED_DOMAINS = [
  'bit.ly', 's.id', 'cutt.ly', 'tinyurl.com', 't.co', 
  'rebrand.ly', 'tiny.cc', 'shorturl.at'
];

const KNOWN_SAFE_DOMAINS = [
  'google.com', 'youtube.com', 'facebook.com', 'instagram.com',
  'twitter.com', 'x.com', 'linkedin.com', 'wikipedia.org',
  'whatsapp.com', 'wa.me', 'apple.com', 'microsoft.com',
  'github.com', 'stackoverflow.com', 'amazon.com',
  'tokopedia.com', 'shopee.co.id', 'shopee.com', 'bukalapak.com',
  'gojek.com', 'grab.com', 'dana.id', 'ovo.id',
  'bca.co.id', 'bri.co.id', 'bni.co.id', 'bankmandiri.co.id',
  'bi.go.id', 'ojk.go.id', 'kominfo.go.id',
  'detik.com', 'kompas.com', 'tribunnews.com', 'cnnindonesia.com',
  'kemenkes.go.id', 'pajak.go.id', 'pln.co.id', 'telkomsel.com'
];

const ESTABLISHED_TLDS = [
  '.go.id', '.ac.id', '.mil.id'
];

export function calculateThreatScore(
  text: string,
  urls: string[],
  osintResults: {
    safe_browsing?: { malicious: boolean; source: string };
    virustotal?: { malicious_votes: number; suspicious_votes: number; total_engines: number; status: string };
    urlscan?: { dom_score?: number; flags?: string[] };
  }
): ThreatReport {
  let score = 0;
  const redFlags: string[] = [];
  const triggers: string[] = [];
  let hasBrandImpersonation = false;
  
  const textLower = text.toLowerCase();

  // --- 1. OSINT Signals ---
  
  // Google Safe Browsing
  if (osintResults.safe_browsing?.malicious) {
    score += 45;
    redFlags.push('Terdeteksi berbahaya oleh database Google Safe Browsing.');
    triggers.push('google_safe_browsing_hit');
  }

  // VirusTotal — Proportional scoring based on detection ratio
  if (osintResults.virustotal) {
    const malicious = osintResults.virustotal.malicious_votes;
    const suspicious = osintResults.virustotal.suspicious_votes;
    const total = osintResults.virustotal.total_engines || 1;
    const maliciousRatio = malicious / total;

    if (maliciousRatio >= 0.3) {
      // 30%+ engines flagged = extremely dangerous
      score += 45;
      redFlags.push(`Sistem VirusTotal: ${malicious}/${total} engine (${Math.round(maliciousRatio * 100)}%) mendeteksi ancaman kritis.`);
      triggers.push('virustotal_malicious_critical');
    } else if (malicious >= 3) {
      // 3+ engines but < 30% ratio
      score += Math.min(40, malicious * 4);
      redFlags.push(`Sistem VirusTotal melaporkan link dideteksi malicious oleh ${malicious}/${total} engine.`);
      triggers.push('virustotal_malicious_moderate');
    } else if (malicious >= 1) {
      score += Math.min(25, malicious * 8);
      redFlags.push(`Sistem VirusTotal melaporkan deteksi ancaman malicious ringan (${malicious}/${total} engine).`);
      triggers.push('virustotal_malicious_low');
    } else if (suspicious >= 2) {
      score += Math.min(15, suspicious * 3);
      redFlags.push(`Sistem VirusTotal menandai link sebagai suspicious oleh ${suspicious} engine.`);
      triggers.push('virustotal_suspicious');
    }
  }

  // URLScan / Reputation scoring
  if (osintResults.urlscan) {
    const domScore = osintResults.urlscan.dom_score;
    const flags = osintResults.urlscan.flags || [];
    
    if (domScore !== undefined && domScore < 40) {
      score += 20;
      redFlags.push('Domain memiliki reputasi web yang sangat rendah berdasarkan analisis URLScan.');
      triggers.push('urlscan_low_score');
    }
    
    if (flags.includes('phishing_heuristic') || flags.includes('suspicious_login_page')) {
      score += 15;
      redFlags.push('Halaman web memiliki indikator phishing atau form login palsu.');
      triggers.push('urlscan_phishing_heuristic');
    }
    if (flags.includes('malware_download') || flags.includes('suspicious_apk')) {
      score += 25;
      redFlags.push('Terdeteksi upaya pengunduhan berkas berbahaya / APK dari situs.');
      triggers.push('urlscan_malware_heuristic');
    }
  }

  // --- 2. URL and Domain Heuristics ---
  
  for (const urlStr of urls) {
    try {
      const url = new URL(urlStr.startsWith('http') ? urlStr : `http://${urlStr}`);
      const hostname = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();

      // Check direct IP address usage
      const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
      if (ipRegex.test(hostname)) {
        score += 25;
        redFlags.push(`Tautan menggunakan alamat IP langsung (${hostname}) bukannya nama domain resmi.`);
        triggers.push('direct_ip_host');
      }

      // Check shortened URL
      if (SHORTENED_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))) {
        score += 10;
        redFlags.push(`Tautan menggunakan pemendek URL (${hostname}) untuk menyembunyikan alamat asli.`);
        triggers.push('shortened_url');
      }

      // Check suspicious TLDs
      if (SUSPICIOUS_TLDS.some(tld => hostname.endsWith(tld))) {
        score += 15;
        redFlags.push(`Tautan menggunakan TLD tidak umum/murah (${hostname.slice(hostname.lastIndexOf('.'))}) yang sering disalahgunakan.`);
        triggers.push('suspicious_tld');
      }

      // Check APK extension download
      if (path.endsWith('.apk') || path.includes('/apk/') || path.includes('download-apk')) {
        score += 25;
        redFlags.push('Tautan mengarah langsung ke unduhan berkas instalasi Android (.apk).');
        triggers.push('apk_download_path');
      }

      // Check brand impersonation
      for (const brandCheck of BRAND_VERIFICATIONS) {
        // If domain mentions brand name keyword
        const mentionsBrand = brandCheck.keywords.some(kw => hostname.includes(kw));
        if (mentionsBrand) {
          // Check if domain is official
          const isOfficial = brandCheck.officialDomains.some(official => 
            hostname === official || hostname.endsWith(`.${official}`)
          );
          if (!isOfficial) {
            score += 40;
            hasBrandImpersonation = true;
            redFlags.push(`Impersonasi Merek: Domain mencantumkan kata "${brandCheck.brand}" tetapi bukan merupakan domain resmi ${brandCheck.brand}.`);
            triggers.push(`impersonation_${brandCheck.brand.toLowerCase().replace(/\s+/g, '_')}`);
          }
        }
      }
    } catch (e) {
      // Invalid URL format, skip detailed parts but score default
      if (urlStr.includes('.apk')) {
        score += 20;
        redFlags.push('Tautan mencurigakan mengandung berkas APK.');
        triggers.push('invalid_url_apk');
      }
    }
  }

  // --- 3. Text content heuristics ---
  
  // Urgency check
  const matchedUrgency = URGENCY_KEYWORDS.filter(kw => textLower.includes(kw));
  if (matchedUrgency.length >= 2) {
    score += 15;
    redFlags.push(`Pesan menggunakan taktik manipulasi urgensi (e.g., "${matchedUrgency.slice(0, 2).join('", "')}").`);
    triggers.push('urgency_manipulation');
  }

  // Fraud keywords check
  const matchedFraud = FRAUD_KEYWORDS.filter(kw => textLower.includes(kw));
  if (matchedFraud.length >= 1) {
    score += 15;
    redFlags.push(`Pesan menyebutkan topik sensitif penipuan digital (e.g., "${matchedFraud.slice(0, 2).join('", "')}").`);
    triggers.push('fraud_keywords');
  }

  // Fake authority mention without official verification context
  const hasAuthorityKeyword = ['polisi', 'kepolisian', 'dirjen pajak', 'bea cukai', 'kominfo', 'petugas', 'customer service', 'helpdesk', 'halo bca', 'layanan bantuan'].some(kw => textLower.includes(kw));
  if (hasAuthorityKeyword && textLower.includes('klik') || textLower.includes('link') || textLower.includes('tautan') || textLower.includes('.apk') || textLower.includes('form') || textLower.includes('tarif')) {
    score += 15;
    redFlags.push('Pesan mengatasnamakan otoritas resmi atau layanan pelanggan dengan arahan tindakan mencurigakan.');
    triggers.push('fake_authority_cues');
  }

  // APK mentions in chat
  if (textLower.includes('.apk') || textLower.includes('file apk') || textLower.includes('unduh aplikasi')) {
    score += 15;
    redFlags.push('Pesan mengarahkan penerima untuk mengunduh aplikasi (.apk).');
    triggers.push('apk_mention');
  }

  // --- 4. Negative Signals (score reduction for safe indicators) ---
  
  if (!hasBrandImpersonation && score < 60) {
    for (const urlStr of urls) {
      try {
        const url = new URL(urlStr.startsWith('http') ? urlStr : `http://${urlStr}`);
        const hostname = url.hostname.toLowerCase();

        // HTTPS bonus
        if (url.protocol === 'https:') {
          score -= 5;
          triggers.push('https_positive');
        }

        // Known safe domain bonus
        if (KNOWN_SAFE_DOMAINS.some(safe => hostname === safe || hostname.endsWith(`.${safe}`))) {
          score -= 15;
          triggers.push('known_safe_domain');
        }

        // Established TLD bonus (only strict official TLDs now)
        if (!triggers.includes('suspicious_tld') && ESTABLISHED_TLDS.some(tld => hostname.endsWith(tld))) {
          score -= 5;
          triggers.push('established_tld');
        }
      } catch (e) {
        // Invalid URL, skip negative checks
      }
    }
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine risk level
  let riskLevel: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'SAFE';
  if (score >= 80) {
    riskLevel = 'CRITICAL';
  } else if (score >= 60) {
    riskLevel = 'HIGH';
  } else if (score >= 40) {
    riskLevel = 'MEDIUM';
  } else if (score >= 20) {
    riskLevel = 'LOW';
  }

  return {
    score,
    riskLevel,
    redFlags: Array.from(new Set(redFlags)), // Unique red flags
    triggers
  };
}
