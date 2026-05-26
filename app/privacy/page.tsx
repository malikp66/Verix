'use client';

import { motion } from 'motion/react';
import { Shield, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    title: '1. Pendahuluan',
    content: 'VERIX ("kami", "kita", atau "platform") berkomitmen untuk melindungi privasi pengguna. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi pribadi Anda saat menggunakan platform deteksi risiko digital dan intelijen ancaman siber kami. Dengan menggunakan Layanan, Anda menyetujui praktik pengumpulan dan penggunaan data sebagaimana dijelaskan dalam kebijakan ini.'
  },
  {
    title: '2. Informasi yang Kami Kumpulkan',
    content: 'Kami mengumpulkan beberapa jenis informasi untuk menyediakan dan meningkatkan Layanan: (a) Informasi Akun: saat Anda login menggunakan Google, kami mengumpulkan nama, alamat email, dan foto profil Anda dari akun Google; (b) Data Analisis: konten yang Anda kirimkan untuk dianalisis, termasuk teks, URL, gambar, dan file, beserta hasil analisisnya; (c) Data Penggunaan: informasi tentang cara Anda berinteraksi dengan platform, termasuk fitur yang digunakan, waktu akses, dan durasi sesi; (d) Data Teknis: alamat IP, jenis browser, sistem operasi, dan informasi perangkat lainnya yang dikumpulkan secara otomatis.'
  },
  {
    title: '3. Bagaimana Kami Menggunakan Informasi',
    content: 'Informasi yang kami kumpulkan digunakan untuk: (a) menyediakan, memelihara, dan meningkatkan Layanan analisis deteksi risiko; (b) memproses pembayaran dan mengelola kredit akun Anda; (c) menyimpan riwayat analisis Anda untuk referensi dan pengalaman pengguna yang lebih baik; (d) mengembangkan dan melatih model AI untuk meningkatkan akurasi deteksi; (e) menganalisis pola ancaman siber secara agregat untuk kepentingan intelijen keamanan; (f) mematuhi kewajiban hukum dan peraturan yang berlaku; (g) mengirimkan pemberitahuan terkait layanan, pembaruan, atau informasi keamanan penting.'
  },
  {
    title: '4. Berbagi Data dengan Pihak Ketiga',
    content: 'Kami tidak menjual data pribadi Anda kepada pihak ketiga. Namun, kami membagikan data tertentu dengan pihak ketiga tepercaya yang diperlukan untuk menyediakan Layanan: (a) Google Gemini AI: konten yang Anda kirimkan dikirim ke Gemini API untuk analisis AI; (b) VirusTotal: URL dan file dapat dikirim untuk verifikasi ancaman malware; (c) Google Safe Browsing: URL diperiksa terhadap database ancaman Google; (d) URLScan.io: URL dapat dikirim untuk pemindaian screenshot dan reputasi; (e) Abuse.ch URLhaus: data ancaman yang diterima dari sumber publik; (f) Firebase (Google): data pengguna, autentikasi, dan penyimpanan scan di Firestore; (g) Midtrans: data pembayaran diproses oleh Midtrans sesuai kebijakan privasi mereka. Data yang dibagikan terbatas pada apa yang diperlukan untuk menjalankan fungsi tersebut.'
  },
  {
    title: '5. Penyimpanan dan Retensi Data',
    content: 'Data analisis (hasil scan) disimpan di Firebase Firestore dengan masa retensi default 30 hari untuk pengguna tidak terdaftar dan hingga 1 tahun untuk pengguna terdaftar, kecuali Anda menghapusnya secara manual. Data akun pengguna disimpan selama akun Anda aktif. Data pembayaran tidak disimpan oleh VERIX melainkan dikelola sepenuhnya oleh Midtrans sesuai kebijakan mereka. Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang wajar untuk melindungi data Anda dari akses tidak sah, perubahan, pengungkapan, atau penghancuran.'
  },
  {
    title: '6. Hak Pengguna',
    content: 'Anda memiliki hak-hak berikut terkait data pribadi Anda: (a) Hak Akses: Anda dapat meminta informasi tentang data pribadi yang kami simpan; (b) Hak Koreksi: Anda dapat memperbarui atau memperbaiki data akun Anda; (c) Hak Penghapusan: Anda dapat meminta penghapusan data analisis Anda atau akun Anda kapan saja; (d) Hak Portabilitas: Anda dapat meminta salinan data Anda dalam format yang dapat dibaca mesin; (e) Hak Membatasi Pemrosesan: Anda dapat meminta agar data Anda tidak digunakan untuk tujuan tertentu. Untuk menggunakan hak-hak ini, silakan hubungi kami melalui kontak yang tersedia.'
  },
  {
    title: '7. Penggunaan Cookie dan Teknologi Pelacakan',
    content: 'VERIX menggunakan cookie dan teknologi serupa untuk meningkatkan pengalaman pengguna, menganalisis tren, dan mengelola platform. Cookie yang kami gunakan termasuk cookie sesi (session cookies) untuk menjaga status login Anda. Kami juga menggunakan layanan analitik pihak ketiga yang mungkin menggunakan cookie untuk mengumpulkan informasi agregat tentang penggunaan platform. Anda dapat mengatur preferensi cookie melalui pengaturan browser Anda.'
  },
  {
    title: '8. Keamanan Data',
    content: 'Kami menerapkan langkah-langkah keamanan yang sesuai dengan standar industri untuk melindungi data Anda, termasuk: enkripsi data dalam transit (TLS/SSL) dan data yang disimpan (Firebase encryption at rest), akses terbatas ke data berdasarkan prinsip need-to-know, audit keamanan berkala, dan kepatuhan terhadap praktik keamanan Firebase dan Google Cloud Platform. Meskipun demikian, tidak ada metode transmisi atau penyimpanan data yang 100% aman. Kami tidak dapat menjamin keamanan absolut data Anda.'
  },
  {
    title: '9. Privasi Anak-Anak',
    content: 'Layanan VERIX tidak ditujukan untuk anak-anak di bawah usia 13 tahun (atau usia minimum yang ditetapkan oleh hukum yang berlaku di Indonesia). Kami tidak dengan sengaja mengumpulkan informasi pribadi dari anak-anak. Jika kami mengetahui bahwa kami telah mengumpulkan data dari anak di bawah usia minimum tanpa persetujuan orang tua, kami akan mengambil langkah-langkah untuk menghapus informasi tersebut.'
  },
  {
    title: '10. Perubahan Kebijakan Privasi',
    content: 'Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan akan diberlakukan segera setelah dipublikasikan di halaman ini. Kami akan memberitahukan perubahan material melalui email atau pemberitahuan di platform. Kami mendorong Anda untuk meninjau halaman ini secara berkala untuk tetap mendapatkan informasi tentang bagaimana kami melindungi data Anda. Penggunaan Layanan yang berkelanjutan setelah perubahan merupakan penerimaan Anda terhadap kebijakan yang diperbarui.'
  },
  {
    title: '11. Transfer Data Internasional',
    content: 'Data Anda dapat ditransfer dan diproses di server yang berlokasi di luar Indonesia, termasuk namun tidak terbatas pada Amerika Serikat (Google Cloud Platform, Firebase) dan Singapura. Kami memastikan bahwa transfer data tersebut dilakukan sesuai dengan hukum perlindungan data yang berlaku dan dengan langkah-langkah perlindungan yang memadai.'
  },
  {
    title: '12. Kontak',
    content: 'Jika Anda memiliki pertanyaan, kekhawatiran, atau permintaan terkait Kebijakan Privasi ini atau praktik data kami, silakan hubungi kami melalui: (a) Email: privacy@verix.id; (b) Melalui formulir kontak yang tersedia di platform; (c) Melalui GitHub Issues di repositori publik kami. Kami akan merespon permintaan Anda dalam waktu 14 hari kerja.'
  },
];

export default function PrivacyPage() {
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
            <Lock className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-semibold text-white tracking-tight">
              Kebijakan Privasi
            </h1>
            <p className="text-sm text-neutral-500 font-mono mt-1">
              Privacy Notice &mdash; Berlaku sejak 1 Januari 2026
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
