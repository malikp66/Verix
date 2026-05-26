'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Shield, Check, Loader2, AlertTriangle, Eye, Brain, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LinearGlow } from './ui/linear-glow';

interface Tier {
  id: string;
  credits: number;
  price: number;
  label: string;
  badge?: string;
  subBadge?: string;
  isPopular?: boolean;
}

const TIERS: Tier[] = [
  { id: 'starter', credits: 10, price: 10000, label: 'Starter' },
  {
    id: 'popular',
    credits: 50,
    price: 45000,
    label: 'Popular',
    badge: 'PALING POPULER',
    subBadge: 'Paling banyak dipilih',
    isPopular: true,
  },
  {
    id: 'pro',
    credits: 100,
    price: 80000,
    label: 'Pro',
    badge: 'HEMAT 20%',
  },
];

interface CreditTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Record<string, unknown> | null;
  topUpCredits: (amount: number) => Promise<boolean>;
  credits?: number | null;
  onLogin?: () => void;
}

export function CreditTopUpModal({
  isOpen,
  onClose,
  user,
  topUpCredits,
  credits,
  onLogin,
}: CreditTopUpModalProps) {
  const [selectedTier, setSelectedTier] = useState<string>('popular');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const selected = TIERS.find((t) => t.id === selectedTier)!;

  const handleSelectTier = (id: string) => {
    setSelectedTier(id);
    setTimeout(() => {
      actionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const handlePayment = useCallback(async () => {
    if (!user) return;
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const res = await fetch('/api/payment/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          userEmail: (user.email as string) || '',
          userName: (user.displayName as string) || undefined,
          userId: user.uid as string,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Payment gateway error');
      }

      const { snapToken } = data;

      if (!snapToken || typeof window === 'undefined' || !window.snap) {
        throw new Error('Midtrans SDK tidak tersedia. Silakan refresh halaman.');
      }

      window.snap.pay(snapToken, {
        onSuccess: async () => {
          await topUpCredits(selected.credits);
          setPaymentSuccess(true);
          setTimeout(() => {
            setPaymentSuccess(false);
            onClose();
          }, 2500);
        },
        onPending: () => {
          setIsProcessing(false);
        },
        onError: () => {
          setIsProcessing(false);
          setPaymentError('Pembayaran gagal. Silakan coba lagi.');
        },
        onClose: () => {
          setIsProcessing(false);
        },
      });
    } catch (err) {
      setIsProcessing(false);
      setPaymentError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    }
  }, [selectedTier, selected, user, topUpCredits, onClose]);

  const formatPrice = (price: number) =>
    `Rp ${price.toLocaleString('id-ID')}`;

  const lowCredits = credits !== null && credits !== undefined && credits < 5;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-950/80 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full max-w-[520px] rounded-2xl',
              'bg-neutral-950/95 backdrop-blur-2xl border border-neutral-800',
              'shadow-[0_0_60px_rgba(0,0,0,0.5)]',
              'flex flex-col overflow-hidden',
              'max-h-[90vh]'
            )}
          >
            {/* Linear glow top */}
            <LinearGlow position="top" color="emerald" opacity={35} />
            
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-emerald-500/[0.03] blur-[100px] rounded-full pointer-events-none" />

            <div ref={scrollRef} className="relative z-10 overflow-y-auto scrollbar-custom p-6 sm:p-8">
              {paymentSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                    >
                      <Check className="w-8 h-8 text-emerald-400" />
                    </motion.div>
                  </div>
                  <h3 className="text-lg font-display text-white font-medium">Pembayaran Berhasil!</h3>
                  <p className="text-sm text-neutral-400">
                    +{selected.credits} kredit telah ditambahkan ke akun kamu.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Sparkles className="w-4.5 h-4.5 text-emerald-400" />
                        </div>
                        <h2 className="text-3xl font-display font-medium tracking-tight">
                          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-neutral-500">
                            Top Up Kredit AI
                          </span>
                        </h2>
                      </div>
                      <p className="text-sm text-neutral-400/80 max-w-[340px] ml-12">
                        Pindai dasar selalu gratis.{' '}
                        <span className="text-emerald-400/80 font-medium">Penjelasan AI</span>{' '}
                        menggunakan kredit.
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="w-8 h-8 rounded-lg bg-neutral-800/50 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all shrink-0 cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  {/* Low Credits Warning */}
                  {user && lowCredits && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/15 mb-5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-xs font-mono text-amber-300/90">
                        Tersisa <span className="font-bold text-amber-300">{credits}</span> kredit
                      </span>
                    </motion.div>
                  )}

                  {/* Pricing Tiers */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    {TIERS.map((tier) => {
                      const isSelected = selectedTier === tier.id;

                      return (
                        <motion.button
                          key={tier.id}
                          onClick={() => handleSelectTier(tier.id)}
                          whileTap={{ scale: 0.96 }}
                          className={cn(
                            'relative flex flex-col items-center gap-2.5 p-4 rounded-xl transition-all duration-300 cursor-pointer',
                            tier.isPopular
                              ? cn(
                                  'sm:scale-105',
                                  isSelected
                                    ? 'bg-neutral-900 ring-1 ring-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                                    : 'bg-neutral-900/80 ring-1 ring-emerald-500/15 hover:ring-emerald-500/25 hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]'
                                )
                              : cn(
                                  isSelected
                                    ? 'bg-neutral-900 border border-neutral-700 shadow-[0_0_15px_rgba(255,255,255,0.03)]'
                                    : 'bg-neutral-900/50 border border-neutral-800/60 hover:border-neutral-700 hover:bg-neutral-900/70'
                                )
                          )}
                        >
                          {tier.badge && (
                            <motion.span
                              animate={tier.isPopular ? { y: [0, -2, 0] } : {}}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                              className={cn(
                                'absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[8px] font-mono font-bold border whitespace-nowrap backdrop-blur-md',
                                tier.isPopular
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/15'
                              )}
                            >
                              {tier.badge}
                            </motion.span>
                          )}

                          <div
                            className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300',
                              tier.isPopular
                                ? cn(
                                    'bg-emerald-500/10 border-emerald-500/20',
                                    isSelected && 'shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                  )
                                : cn(
                                    'bg-neutral-800/40 border-neutral-700/30',
                                    isSelected && 'bg-neutral-800/60'
                                  )
                            )}
                          >
                            {tier.isPopular ? (
                              <Zap
                                className={cn(
                                  'w-5 h-5 transition-all duration-300',
                                  isSelected ? 'text-emerald-400' : 'text-emerald-400/70'
                                )}
                              />
                            ) : (
                              <Sparkles
                                className={cn(
                                  'w-5 h-5 transition-all duration-300',
                                  isSelected ? 'text-neutral-200' : 'text-neutral-500'
                                )}
                              />
                            )}
                          </div>

                          <div className="text-center">
                            <p
                              className={cn(
                                'text-[10px] font-mono font-medium tracking-wide mb-0.5 transition-colors',
                                isSelected ? 'text-white' : 'text-neutral-400'
                              )}
                            >
                              {tier.label}
                            </p>
                            <p
                              className={cn(
                                'text-xl font-display font-bold tracking-tight transition-colors',
                                tier.isPopular
                                  ? isSelected
                                    ? 'text-white'
                                    : 'text-neutral-200'
                                  : isSelected
                                    ? 'text-white'
                                    : 'text-neutral-300'
                              )}
                            >
                              {tier.credits}
                            </p>
                            <p className="text-[10px] text-neutral-500 font-mono">kredit</p>
                          </div>

                          <p
                            className={cn(
                              'text-xs font-mono font-semibold transition-colors',
                              tier.isPopular
                                ? isSelected
                                  ? 'text-emerald-300'
                                  : 'text-emerald-400/70'
                                : isSelected
                                  ? 'text-white'
                                  : 'text-neutral-400'
                            )}
                          >
                            {formatPrice(tier.price)}
                          </p>

                          {tier.subBadge && (
                            <p className="text-[8px] font-mono text-neutral-500 tracking-wide text-center mt-0.5">
                              {tier.subBadge}
                            </p>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Credit Usage Guide */}
                  <div className="rounded-xl bg-neutral-900/50 border border-neutral-800/60 p-4 mb-6">
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-3">
                      Panduan Penggunaan Kredit
                    </p>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center shrink-0">
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-xs text-neutral-300">Penjelasan AI</span>
                          <span className="text-xs font-mono text-cyan-300 font-medium">1 kredit</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/15 flex items-center justify-center shrink-0">
                          <Brain className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-xs text-neutral-300">Analisis Screenshot</span>
                          <span className="text-xs font-mono text-purple-300 font-medium">2 kredit</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0">
                          <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-xs text-neutral-300">Pindai Dasar</span>
                          <span className="text-xs font-mono text-emerald-400 font-medium">GRATIS</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {paymentError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/15 text-red-400 text-xs font-mono"
                    >
                      {paymentError}
                    </motion.div>
                  )}

                  {/* Action Button */}
                  <div ref={actionRef}>
                  {!user ? (
                    <div className="text-center">
                      <div className="rounded-xl bg-neutral-900/50 border border-neutral-800 p-5 mb-3">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Lock className="w-4 h-4 text-neutral-500" />
                          <span className="text-sm font-display text-neutral-300 font-medium">
                            Aktifkan Kecerdasan AI
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 max-w-[300px] mx-auto leading-relaxed mb-4">
                          Login untuk mengaktifkan kredit dan menyimpan riwayat analisis kamu.
                        </p>
                        {onLogin && (
                          <button
                            onClick={onLogin}
                            className="w-full py-2.5 rounded-xl bg-white text-neutral-950 text-sm font-medium hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Image src="/logos/gemini.svg" width={16} height={16} alt="" className="opacity-40" />
                            Lanjutkan dengan Google
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-600">
                        Tamu mendapatkan 10 kredit gratis setiap bulan.
                      </p>
                      <p className="text-[9px] text-neutral-600 mt-2 leading-relaxed">
                        Dengan login, kamu menyetujui{' '}
                        <Link href="/terms" className="underline hover:text-neutral-400 transition-colors">Syarat & Ketentuan</Link>{' '}
                        dan{' '}
                        <Link href="/privacy" className="underline hover:text-neutral-400 transition-colors">Kebijakan Privasi</Link>.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className={cn(
                        'w-full py-3.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer',
                        'bg-emerald-500 text-neutral-950',
                        'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
                        'hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]',
                        'active:scale-[0.98]',
                        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                      )}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Lanjutkan Pembayaran &mdash; {formatPrice(selected.price)}
                        </>
                      )}
                    </button>
                  )}

                  </div>
                  {/* Trust Footer */}
                  <div className="mt-5 pt-4 border-t border-neutral-800 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-neutral-600" />
                      <span className="text-[10px] font-mono text-neutral-600 tracking-wide">
                        Diamankan oleh Midtrans
                      </span>
                    </div>
                    <p className="text-[9px] text-neutral-600">
                      Dengan melakukan pembayaran, kamu menyetujui{' '}
                      <Link href="/terms" className="underline hover:text-neutral-400 transition-colors">Syarat & Ketentuan</Link>{' '}
                      dan{' '}
                      <Link href="/privacy" className="underline hover:text-neutral-400 transition-colors">Kebijakan Privasi</Link>.
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
