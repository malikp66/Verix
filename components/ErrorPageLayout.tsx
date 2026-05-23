'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowLeft, Terminal, Radio } from 'lucide-react';
import Link from 'next/link';
import { BorderBeam } from './ui/border-beam';

const GLITCH_CHARS = '!<>-_\\/[]{}=+*^?#________';

function GlitchText({ text, className }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);
  const [isGlitching, setIsGlitching] = useState(true);

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(
        text
          .split('')
          .map((char, index) => {
            if (index < iteration) return text[index];
            if (char === ' ') return ' ';
            return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          })
          .join('')
      );
      iteration += 1 / 2;
      if (iteration >= text.length) {
        clearInterval(interval);
        setIsGlitching(false);
        setDisplay(text);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <motion.span
      className={className}
      animate={isGlitching ? { opacity: [1, 0.8, 1] } : {}}
      transition={{ duration: 0.1, repeat: Infinity }}
    >
      {display}
    </motion.span>
  );
}

const ERROR_CONFIG: Record<string, { icon: React.ReactNode; title: string; desc: string; accent: string }> = {
  '404': {
    icon: <Radio className="w-5 h-5" />,
    title: 'Target Tidak Ditemukan',
    desc: 'Sinyal yang Anda cari tidak terdeteksi dalam jaringan intelijen kami. Halaman mungkin telah dipindahkan atau tidak pernah ada.',
    accent: 'emerald',
  },
  '429': {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Rate Limit Tercapai',
    desc: 'Terlalu banyak permintaan dalam waktu singkat. Sistem keamanan kami melakukan throttling untuk mencegah overflow.',
    accent: 'amber',
  },
  '500': {
    icon: <Terminal className="w-5 h-5" />,
    title: 'Sistem Terganggu',
    desc: 'Anomali terdeteksi pada core analysis engine. Tim teknik sedang melakukan diagnostik.',
    accent: 'red',
  },
};

interface ErrorPageLayoutProps {
  statusCode: number;
  digest?: string;
  onReset?: () => void;
}

export function ErrorPageLayout({ statusCode, digest, onReset }: ErrorPageLayoutProps) {
  const [matrixChars, setMatrixChars] = useState<any[]>([]);
  const config = ERROR_CONFIG[String(statusCode)] || ERROR_CONFIG['500'];

  useEffect(() => {
    const chars = Array.from({ length: 20 }, () => ({
      char: ['0', '1', '█', '▓', '▒', '░', '╱', '╲'][Math.floor(Math.random() * 8)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: 0.5 + Math.random() * 1.5,
    }));
    setMatrixChars(chars as any);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden flex items-center justify-center">
      {/* Matrix rain particles */}
      <div className="absolute inset-0 pointer-events-none">
        {matrixChars.map((c: any, i) => (
          <motion.div
            key={i}
            className="absolute text-emerald-500/10 font-mono text-[10px]"
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
            animate={{ y: [-20, 20], opacity: [0, 0.3, 0] }}
            transition={{ duration: c.speed * 3, repeat: Infinity, repeatType: 'loop' }}
          >
            {c.char}
          </motion.div>
        ))}
      </div>

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/[0.02] blur-[120px] rounded-full pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto px-6">
        {/* Console header */}
        <div className="w-full mb-8 flex items-center gap-2 text-[10px] font-mono text-neutral-600">
          <Terminal className="w-3.5 h-3.5" />
          <span>VERIX_ERROR_HANDLER // {new Date().toISOString()}</span>
        </div>

        {/* Glitch error code */}
        <h1 className="text-8xl md:text-9xl font-mono font-bold mb-4">
          <GlitchText
            text={String(statusCode)}
            className="bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-300 to-neutral-600"
          />
        </h1>

        {/* Error badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase">System Anomaly</span>
        </div>

        {/* Glassmorphic card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full bg-neutral-900/50 backdrop-blur-xl border border-neutral-800/60 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
        >
          <BorderBeam duration={6} size={400} className="from-transparent via-emerald-500 to-transparent" />
          <div className="flex items-center justify-center gap-2 mb-4 text-neutral-300">
            {config.icon}
            <h2 className="text-xl font-display font-medium">{config.title}</h2>
          </div>
          <p className="text-sm text-neutral-400 leading-relaxed mb-6">{config.desc}</p>

          {digest && (
            <div className="mb-6 p-3 bg-black/40 rounded-lg border border-neutral-800/40">
              <code className="text-[9px] font-mono text-neutral-500 break-all">Trace ID: {digest}</code>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-neutral-950 rounded-xl text-sm font-medium hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.15)]"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Dashboard
            </Link>
            {onReset && (
              <button
                onClick={onReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 text-white rounded-xl text-sm font-medium hover:bg-neutral-700 transition-colors border border-neutral-700"
              >
                <Terminal className="w-4 h-4" />
                Coba Lagi
              </button>
            )}
          </div>
        </motion.div>

        {/* Decorative footer */}
        <p className="mt-8 text-[9px] font-mono text-white/20 tracking-widest uppercase">
          VERIX Digital Risk Verification // v1.0
        </p>
      </div>
    </div>
  );
}
