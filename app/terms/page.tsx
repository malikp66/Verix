'use client';

import { motion } from 'motion/react';
import { Shield, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    title: '1. Penerimaan Syarat',
    content: 'Dengan mengakses dan menggunakan platform VERIX ("Layanan"), Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari syarat ini, Anda tidak diperbolehkan menggunakan Layanan. Syarat dan Ketentuan ini berlaku untuk seluruh pengguna platform, termasuk pengguna terdaftar maupun pengguna tamu.'
  },
  {
    title: '2. Deskripsi Layanan',
    content: 'VERIX adalah platform deteksi risiko digital dan intelijen ancaman siber yang menyediakan: (a) analisis berbasis AI terhadap pesan, URL, gambar, dan file untuk mendeteksi indikasi penipuan, phishing, malware, dan deepfake; (b) pemantauan ancaman siber real-time dari berbagai sumber intelijen publik; (c) sistem skor risiko dan rekomendasi tindakan; serta (d) fitur-fitur keamanan lainnya yang dikembangkan secara berkala. Hasil analisis bersifat indikatif dan tidak boleh dijadikan satu-satunya dasar pengambilan keputusan.'
  },
  {
    title: '3. Akun Pengguna dan Autentikasi',
    content: 'Untuk mengakses fitur tertentu, Anda可能需要 membuat akun melalui autentikasi Google. Anda bertanggung jawab penuh atas kerahasiaan kredensial akun Anda dan segala aktivitas yang terjadi dalam akun tersebut. Anda wajib memberikan informasi yang akurat dan terkini. VERIX berhak menangguhkan atau menghentikan akun jika ditemukan pelanggaran terhadap syarat ini atau aktivitas mencurigakan.'
  },
  {
    title: '4. Sistem Kredit dan Pembayaran',
    content: 'VERIX menyediakan model freemium di mana analisis dasar tersedia gratis. Fitur analisis lanjutan, termasuk penjelasan AI mendalam, menggunakan sistem kredit. Kredit dapat dibeli melalui sistem pembayaran pihak ketiga yang terintegrasi (Midtrans). Pembayaran diproses oleh Midtrans dan VERIX tidak menyimpan informasi kartu kredit atau metode pembayaran Anda. Kredit yang telah dibeli bersifat final dan tidak dapat dikembalikan (non-refundable), kecuali ditentukan lain oleh peraturan perundang-undangan yang berlaku.'
  },
  {
    title: '5. Penggunaan yang Diperbolehkan',
    content: 'Anda setuju untuk menggunakan Layanan hanya untuk tujuan yang sah dan sesuai dengan hukum yang berlaku. Anda tidak diperbolehkan: (a) menyalahgunakan Layanan untuk mengirimkan konten ilegal, berbahaya, atau melanggar hak pihak lain; (b) mencoba merusak, meretas, atau mengganggu keamanan platform; (c) menggunakan Layanan untuk melecehkan, mengancam, atau merugikan orang lain; (d) melakukan reverse engineering, decompiling, atau mengekstrak kode sumber Layanan; (e) menggunakan bot, script, atau alat otomatis lainnya untuk mengakses Layanan tanpa izin tertulis.'
  },
  {
    title: '6. Disclaimer Hasil Analisis AI',
    content: 'Hasil analisis yang diberikan oleh VERIX dihasilkan oleh model kecerdasan buatan (AI) dan sumber intelijen publik. Hasil ini bersifat indikatif dan tidak dimaksudkan sebagai bukti hukum atau dasar keputusan finansial. VERIX tidak menjamin akurasi, kelengkapan, atau keandalan hasil analisis. Pengguna bertanggung jawab untuk melakukan verifikasi independen terhadap informasi penting. VERIX tidak bertanggung jawab atas kerugian yang timbul dari keputusan yang diambil berdasarkan hasil analisis platform.'
  },
  {
    title: '7. Kekayaan Intelektual',
    content: 'Seluruh konten, fitur, desain, logo, dan kode sumber platform VERIX dilindungi oleh hak kekayaan intelektual yang berlaku. Anda tidak diperbolehkan menyalin, memodifikasi, mendistribusikan, atau membuat karya turunan dari Layanan tanpa izin tertulis dari pemilik platform. Nama merek dan logo pihak ketiga yang muncul di platform adalah milik masing-masing pemiliknya.'
  },
  {
    title: '8. Batasan Tanggung Jawab',
    content: 'Sepanjang diizinkan oleh hukum yang berlaku, VERIX dan pengembangnya tidak bertanggung jawab atas kerugian langsung, tidak langsung, insidental, konsekuensial, atau hukuman yang timbul dari penggunaan atau ketidakmampuan menggunakan Layanan. Ini termasuk, namun tidak terbatas pada, kerugian akibat keputusan yang diambil berdasarkan hasil analisis, kehilangan data, atau gangguan layanan. Tanggung jawab total VERIX kepada Anda tidak melebihi jumlah yang telah Anda bayarkan untuk Layanan dalam 6 bulan terakhir.'
  },
  {
    title: '9. Layanan Pihak Ketiga',
    content: 'VERIX mengintegrasikan layanan pihak ketiga untuk menyediakan fungsionalitasnya, termasuk namun tidak terbatas pada: Google Gemini AI untuk analisis konten, VirusTotal untuk intelijen malware, Google Safe Browsing untuk deteksi URL berbahaya, URLScan.io untuk pemindaian URL, Abuse.ch URLhaus untuk data ancaman, Midtrans untuk pemrosesan pembayaran, dan Firebase untuk penyimpanan data dan autentikasi. VERIX tidak bertanggung jawab atas ketersediaan, keakuratan, atau kebijakan privasi layanan pihak ketiga tersebut.'
  },
  {
    title: '10. Penghentian Layanan',
    content: 'VERIX berhak untuk menangguhkan, membatasi, atau menghentikan akses Anda ke Layanan kapan saja, dengan atau tanpa pemberitahuan, jika kami meyakini Anda telah melanggar Syarat dan Ketentuan ini atau terlibat dalam aktivitas yang merugikan platform atau pengguna lain. Anda juga dapat menghentikan penggunaan Layanan kapan saja dengan berhenti mengakses platform dan, jika berlaku, menghapus akun Anda.'
  },
  {
    title: '11. Perubahan Syarat dan Ketentuan',
    content: 'VERIX berhak untuk memperbarui atau mengubah Syarat dan Ketentuan ini kapan saja. Perubahan akan diberlakukan segera setelah dipublikasikan di halaman ini. Pengguna disarankan untuk meninjau halaman ini secara berkala. Penggunaan Layanan yang berkelanjutan setelah perubahan merupakan penerimaan Anda terhadap syarat yang diperbarui. Jika Anda tidak setuju dengan perubahan, Anda harus berhenti menggunakan Layanan.'
  },
  {
    title: '12. Hukum yang Berlaku',
    content: 'Syarat dan Ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia. Setiap perselisihan yang timbul dari atau terkait dengan Syarat dan Ketentuan ini akan diselesaikan melalui musyawarah untuk mufakat, dan jika tidak tercapai, akan diselesaikan di pengadilan yang berwenang di wilayah hukum Indonesia.'
  },
  {
    title: '13. Kontak',
    content: 'Jika Anda memiliki pertanyaan, keluhan, atau masukan mengenai Syarat dan Ketentuan ini, silakan hubungi kami melalui email yang tercantum di halaman Kebijakan Privasi atau melalui formulir kontak yang tersedia di platform.'
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/[0.02] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(8,30,55,0.1)_0%,_transparent_70%)] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 py-24 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-neutral-500 hover:text-emerald-400 transition-colors mb-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Beranda
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-semibold text-white tracking-tight">
              Syarat dan Ketentuan
            </h1>
            <p className="text-sm text-neutral-500 font-mono mt-1">
              Terms of Service &mdash; Berlaku sejak 1 Januari 2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-12 text-[10px] font-mono text-neutral-600 border-b border-neutral-900 pb-4">
          <Shield className="w-3.5 h-3.5 text-emerald-500/60" />
          <span>VERIX &mdash; Platform Deteksi Risiko Digital</span>
        </div>

        <div className="flex flex-col gap-8">
          {sections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="border-l-2 border-neutral-800/60 pl-5 hover:border-emerald-500/30 transition-colors"
            >
              <h2 className="text-base font-display font-medium text-white mb-2">
                {section.title}
              </h2>
              <p className="text-sm text-neutral-400 leading-relaxed font-sans">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-neutral-900 text-center text-[11px] font-mono text-neutral-600">
          &copy; {new Date().getFullYear()} VERIX. All Rights Reserved.
        </div>
      </div>
    </div>
  );
}
