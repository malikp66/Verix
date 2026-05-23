export type NewsArticle = {
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  content: string;
};

export const PRIMARY_QUERY = `("penipuan online" OR phishing OR scam OR "rekening palsu" OR "QRIS palsu" OR "APK berbahaya" OR "penipuan WhatsApp" OR "OTP fraud" OR deepfake) AND (Indonesia OR Jawa OR Jakarta OR Surabaya)`;

export const SECONDARY_QUERY = `(phishing OR scam OR "cyber fraud" OR "online fraud" OR malware OR ransomware OR deepfake) AND NOT (gaming OR sports OR entertainment)`;
