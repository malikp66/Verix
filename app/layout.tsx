import type {Metadata} from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { FirebaseProvider } from '@/components/FirebaseProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'VERIX - Verifikasi Risiko Digital',
  description: 'AI Scam Intelligence Platform for Indonesia. VERIX membantu mendeteksi phishing, scam WhatsApp, QRIS palsu, deepfake, dan manipulasi digital.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" className={`dark ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-neutral-950 text-neutral-50 font-sans antialiased min-h-screen selection:bg-emerald-500/30 selection:text-emerald-200" suppressHydrationWarning>
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
