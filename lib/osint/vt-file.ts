const VT_API_KEY = process.env.VIRUSTOTAL_API_KEY || "";
const VT_BASE = "https://www.virustotal.com/api/v3";

export type VtFileResult = {
  malicious: number;
  suspicious: number;
  undetected: number;
  harmless: number;
  total: number;
  verdict: "MALWARE" | "SUSPICIOUS" | "CLEAN" | "UNKNOWN" | "ERROR";
  engineResults: { engine: string; category: string; result: string }[];
  analysisId: string;
  error?: string;
};

export async function submitFile(buffer: ArrayBuffer, filename: string): Promise<VtFileResult> {
  try {
    const file = new File([buffer], filename, { type: "application/octet-stream" });
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch(`${VT_BASE}/files`, {
      method: "POST",
      headers: { "x-apikey": VT_API_KEY },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return { malicious: 0, suspicious: 0, undetected: 0, harmless: 0, total: 0, verdict: "ERROR", engineResults: [], analysisId: "", error: `Upload failed: ${uploadRes.status} ${errText}` };
    }

    const uploadData = await uploadRes.json();
    const analysisId = uploadData.data?.id;
    if (!analysisId) {
      return { malicious: 0, suspicious: 0, undetected: 0, harmless: 0, total: 0, verdict: "ERROR", engineResults: [], analysisId: "", error: "No analysis ID returned" };
    }

    let attempts = 0;
    const maxAttempts = 10;
    let result: VtFileResult | null = null;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 3000));
      attempts++;

      const pollRes = await fetch(`${VT_BASE}/analyses/${analysisId}`, {
        headers: { "x-apikey": VT_API_KEY },
      });

      if (!pollRes.ok) continue;

      const pollData = await pollRes.json();
      const stats = pollData.data?.attributes?.stats;
      const results = pollData.data?.attributes?.results;

      if (stats) {
        const malicious = stats.malicious || 0;
        const suspicious = stats.suspicious || 0;
        const undetected = stats.undetected || 0;
        const harmless = stats.harmless || 0;
        const total = malicious + suspicious + undetected + harmless;

        const engineResults = results
          ? Object.entries(results).map(([engine, data]: [string, any]) => ({
              engine,
              category: data.category || "undetected",
              result: data.result || "",
            }))
          : [];

        const verdict: VtFileResult["verdict"] = malicious >= 5 ? "MALWARE"
          : malicious >= 1 ? "SUSPICIOUS"
          : total > 0 ? "CLEAN"
          : "UNKNOWN";

        result = { malicious, suspicious, undetected, harmless, total, verdict, engineResults, analysisId };

        if (pollData.data?.attributes?.status === "completed") break;
      }
    }

    return result || { malicious: 0, suspicious: 0, undetected: 0, harmless: 0, total: 0, verdict: "UNKNOWN", engineResults: [], analysisId, error: "Polling timed out" };
  } catch (err: any) {
    return { malicious: 0, suspicious: 0, undetected: 0, harmless: 0, total: 0, verdict: "ERROR", engineResults: [], analysisId: "", error: err.message };
  }
}
