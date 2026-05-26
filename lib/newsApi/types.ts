export type NewsArticle = {
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  content: string;
};

export const PRIMARY_QUERY = `("penipuan online" OR phishing OR scam OR "rekening palsu" OR "QRIS palsu" OR "APK berbahaya" OR "penipuan WhatsApp" OR "OTP fraud" OR deepfake OR "kejahatan siber" OR ransomware) AND (Indonesia OR Jawa OR Jakarta OR Surabaya) AND NOT (gaming OR sports OR entertainment OR movie OR music OR "sepak bola" OR "liga" OR film OR resep)`;

export const SECONDARY_QUERY = `(phishing OR scam OR "cyber fraud" OR "online fraud" OR malware OR ransomware OR deepfake) AND NOT (gaming OR sports OR entertainment)`;
