import { NextRequest, NextResponse } from "next/server";
import { submitFile } from "@/lib/osint/vt-file";
import { enrichFileAnalysis } from "@/lib/ai/fileAnalysis";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File diperlukan." }, { status: 400 });
    }

    // Validate size (50MB max for APK)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File terlalu besar. Maksimum 50MB." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const result = await submitFile(buffer, file.name);

    const risk_score = result.verdict === "MALWARE" ? 85
      : result.verdict === "SUSPICIOUS" ? 55
      : result.verdict === "CLEAN" ? 10
      : result.verdict === "ERROR" ? 0
      : 30;

    const risk_level = risk_score >= 80 ? "CRITICAL"
      : risk_score >= 60 ? "HIGH"
      : risk_score >= 40 ? "MEDIUM"
      : risk_score >= 20 ? "LOW"
      : "SAFE";

    let behavioral_analysis: string;
    let recommended_actions: string[];

    const fileAi = await enrichFileAnalysis({
      file_name: file.name,
      verdict: result.verdict,
      malicious: result.malicious,
      suspicious: result.suspicious,
      total: result.total,
    });

    if (fileAi) {
      behavioral_analysis = fileAi.behavioral_analysis;
      recommended_actions = fileAi.recommended_actions;
    } else {
      behavioral_analysis = result.verdict === "MALWARE"
        ? `File "${file.name}" terdeteksi sebagai ${result.verdict} oleh ${result.malicious}/${result.total} engine VirusTotal. JANGAN install file ini.`
        : result.verdict === "SUSPICIOUS"
        ? `File "${file.name}" memiliki ${result.malicious} deteksi dari ${result.total} engine. Disarankan untuk tidak menginstall.`
        : result.verdict === "CLEAN"
        ? `File "${file.name}" aman — 0 deteksi dari ${result.total} engine VirusTotal.`
        : `File "${file.name}" tidak dapat dianalisis. ${result.error || ""}`;
      recommended_actions = result.verdict === "MALWARE" || result.verdict === "SUSPICIOUS"
        ? [
            "JANGAN install file ini di perangkat Anda.",
            "Hapus file dari penyimpanan Anda segera.",
            "Jika sudah terinstall, segera hapus aplikasi dan scan perangkat dengan antivirus.",
            "Laporkan file ini ke pihak berwenang.",
          ]
        : [
            "File ini aman digunakan.",
            "Namun tetap waspada terhadap file APK dari sumber tidak dikenal.",
          ];
    }

    const response = {
      analysis_type: "file",
      file_name: file.name,
      risk_score,
      risk_level,
      vt_result: result,
      behavioral_analysis,
      recommended_actions,
      external_intelligence: {
        virustotal: result.verdict === "MALWARE" ? `🚨 ${result.malicious}/${result.total} Engines Malicious`
          : result.verdict === "SUSPICIOUS" ? `⚠️ ${result.malicious}/${result.total} Detected`
          : "✅ AMAN",
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("File analyze API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
