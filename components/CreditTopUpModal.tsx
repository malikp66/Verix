'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Zap, Shield, Check, CreditCard, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from './FirebaseProvider';
import { useAICredits } from '@/hooks/use-ai-credits';
import { BorderBeam } from './ui/BorderBeam';

interface CreditTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 10,
    price: 10000,
    priceLabel: 'Rp 10.000',
    perCredit: 'Rp 1.000/credit',
    badge: null,
    color: 'neutral',
    glowFrom: 'rgba(255,255,255,0.03)',
    glowTo: 'rgba(255,255,255,0.01)',
    borderColor: 'border-neutral-800',
    hoverBorder: 'hover:border-neutral-700',
    accentText: 'text-neutral-300',
    accentBg: 'bg-neutral-800',
  },
  {
    id: 'popular',
    name: 'Popular',
    credits: 50,
    price: 45000,
    priceLabel: 'Rp 45.000',
    perCredit: 'Rp 900/credit',
    badge: 'BEST VALUE',
    color: 'emerald',
    glowFrom: 'rgba(16,185,129,0.08)',
    glowTo: 'rgba(16,185,129,0.02)',
    borderColor: 'border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-400/50',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
  },
  {
    id: 'pro',
    name: 'Pro',
    credits: 100,
    price: 80000,
    priceLabel: 'Rp 80.000',
    perCredit: 'Rp 800/credit',
    badge: 'SAVE 20%',
    color: 'blue',
    glowFrom: 'rgba(59,130,246,0.06)',
    glowTo: 'rgba(59,130,246,0.02)',
    borderColor: 'border-blue-500/25',
    hoverBorder: 'hover:border-blue-400/40',
    accentText: 'text-blue-400',
    accentBg: 'bg-blue-500/10',
  },
];

const CREDIT_USAGE = [
  { action: 'AI Threat Explanation', cost: '1 credit', icon: Sparkles },
  { action: 'Screenshot OCR Analysis', cost: '2 credits', icon: Shield },
  { action: 'Basic Scan (URL/Text)', cost: 'FREE', icon: Check },
];

export function CreditTopUpModal({ isOpen, onClose }: CreditTopUpModalProps) {
  const { user, login } = useAuth();
  const { topUpCredits, credits } = useAICredits();
  const [selectedTier, setSelectedTier] = useState<string>('popular');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handlePayment = async () => {
    if (!user) {
      login();
      return;
    }

    const tier = TIERS.find(t => t.id === selectedTier);
    if (!tier) return;

    setIsProcessing(true);
    setPaymentStatus('idle');

    try {
      // Step 1: Create transaction on server
      const res = await fetch('/api/payment/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          userId: user.uid,
          userEmail: user.email,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.snapToken) {
        // If Midtrans isn't configured, do direct top-up for demo
        if (res.status === 503) {
          console.log('[CreditTopUp] Midtrans not configured, using direct top-up for demo');
          await topUpCredits(tier.credits);
          setPaymentStatus('success');
          setTimeout(() => {
            onClose();
            setPaymentStatus('idle');
          }, 2000);
          return;
        }
        throw new Error(data.error || 'Failed to create payment');
      }

      // Step 2: Open Midtrans Snap popup
      if (window.snap) {
        window.snap.pay(data.snapToken, {
          onSuccess: async () => {
            // Frontend fallback — credit Firestore immediately
            await topUpCredits(tier.credits);
            setPaymentStatus('success');
            setTimeout(() => {
              onClose();
              setPaymentStatus('idle');
            }, 2500);
          },
          onPending: () => {
            console.log('[CreditTopUp] Payment pending');
            setIsProcessing(false);
          },
          onError: () => {
            setPaymentStatus('error');
            setIsProcessing(false);
          },
          onClose: () => {
            setIsProcessing(false);
          },
        });
      } else {
        // Snap.js not loaded — direct top-up fallback for demo
        console.log('[CreditTopUp] Snap.js not loaded, using direct top-up for demo');
        await topUpCredits(tier.credits);
        setPaymentStatus('success');
        setTimeout(() => {
          onClose();
          setPaymentStatus('idle');
        }, 2000);
      }
    } catch (error) {
      console.error('[CreditTopUp] Payment error:', error);
      setPaymentStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const activeTier = TIERS.find(t => t.id === selectedTier);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Card */}
          <motion.div
            className="relative w-full max-w-lg bg-[#0C0C0E]/98 backdrop-blur-2xl border border-neutral-800/80 rounded-3xl shadow-[0_40px_120px_rgba(0,0,0,0.9),0_0_60px_rgba(16,185,129,0.04)] overflow-hidden"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.35, ease: [0.19, 1.0, 0.22, 1.0] }}
          >
            {/* Top glow line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
            
            {/* Ambient background orbs */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/[0.04] blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/[0.03] blur-[80px] rounded-full pointer-events-none" />

            {/* Success State Overlay */}
            <AnimatePresence>
              {paymentStatus === 'success' && (
                <motion.div
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0C0C0E]/95 backdrop-blur-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
                  >
                    <Check className="w-10 h-10 text-emerald-400" />
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl font-display font-medium text-white mb-2"
                  >
                    Credits Added!
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-neutral-400"
                  >
                    +{activeTier?.credits} credits successfully added to your account.
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="relative px-8 pt-8 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <Zap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-display font-medium text-white tracking-tight">Top Up AI Credits</h2>
                    <p className="text-[11px] text-neutral-500 font-mono tracking-wide">
                      {credits !== null ? `Current balance: ${credits} credits` : 'Loading...'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 flex items-center justify-center transition-all duration-200 cursor-pointer"
                >
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              </div>

              {/* Trust line — Stripe-style */}
              <div className="mt-4 flex items-center gap-2 bg-emerald-500/[0.04] border border-emerald-500/10 rounded-xl px-3.5 py-2.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <p className="text-[11px] text-emerald-400/80 leading-relaxed">
                  Basic detection is <strong className="text-emerald-300">always free</strong>. AI explanation uses credits.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-neutral-800 to-transparent mx-6" />

            {/* Pricing Tiers */}
            <div className="px-8 py-6">
              <div className="grid grid-cols-3 gap-3">
                {TIERS.map((tier) => {
                  const isSelected = selectedTier === tier.id;
                  const isPopular = tier.id === 'popular';

                  return (
                    <motion.button
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      whileTap={{ scale: 0.97 }}
                      className={`relative flex flex-col items-center text-center p-4 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                        isSelected
                          ? `${tier.borderColor} bg-gradient-to-b shadow-lg ${
                              tier.color === 'emerald'
                                ? 'from-emerald-500/[0.06] to-transparent shadow-emerald-500/10'
                                : tier.color === 'blue'
                                ? 'from-blue-500/[0.06] to-transparent shadow-blue-500/10'
                                : 'from-white/[0.02] to-transparent shadow-white/5'
                            }`
                          : 'border-neutral-900 bg-neutral-950/50 hover:bg-neutral-900/50 hover:border-neutral-800'
                      }`}
                    >
                      {/* BorderBeam for selected popular */}
                      {isSelected && isPopular && (
                        <BorderBeam colorFrom="#10b981" colorTo="#3b82f6" duration={6} borderWidth={1} />
                      )}

                      {/* Badge */}
                      {tier.badge && (
                        <span className={`absolute -top-0 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-b-lg ${
                          tier.color === 'emerald'
                            ? 'bg-emerald-500 text-neutral-950'
                            : 'bg-blue-500/80 text-white'
                        }`}>
                          {tier.badge}
                        </span>
                      )}

                      {/* Credits number */}
                      <div className={`text-3xl font-display font-semibold mt-3 mb-0.5 transition-colors ${
                        isSelected ? (tier.color === 'emerald' ? 'text-emerald-400' : tier.color === 'blue' ? 'text-blue-400' : 'text-white') : 'text-neutral-400'
                      }`}>
                        {tier.credits}
                      </div>
                      <span className={`text-[10px] font-mono uppercase tracking-wider mb-3 ${
                        isSelected ? 'text-neutral-300' : 'text-neutral-600'
                      }`}>
                        credits
                      </span>

                      {/* Price */}
                      <div className={`text-sm font-medium mb-1 ${isSelected ? 'text-white' : 'text-neutral-400'}`}>
                        {tier.priceLabel}
                      </div>
                      <span className={`text-[9px] font-mono ${isSelected ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        {tier.perCredit}
                      </span>

                      {/* Selection indicator */}
                      {isSelected && (
                        <motion.div
                          layoutId="tier-selected-dot"
                          className={`mt-3 w-5 h-5 rounded-full flex items-center justify-center ${
                            tier.color === 'emerald' ? 'bg-emerald-500' : tier.color === 'blue' ? 'bg-blue-500' : 'bg-white'
                          }`}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <Check className="w-3 h-3 text-neutral-950" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Credit Usage Guide — minimals-style */}
            <div className="px-8 pb-4">
              <div className="bg-neutral-950/60 border border-neutral-900 rounded-xl p-3.5">
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block mb-2.5">Credit Usage</span>
                <div className="space-y-2">
                  {CREDIT_USAGE.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className={`w-3 h-3 ${item.cost === 'FREE' ? 'text-emerald-500' : 'text-neutral-500'}`} />
                        <span className="text-[11px] text-neutral-400">{item.action}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-medium ${
                        item.cost === 'FREE' ? 'text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded' : 'text-neutral-500'
                      }`}>
                        {item.cost}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA + Trust Footer */}
            <div className="px-8 pb-8 pt-2">
              {/* Payment CTA */}
              <motion.button
                onClick={handlePayment}
                disabled={isProcessing}
                whileHover={{ scale: isProcessing ? 1 : 1.01 }}
                whileTap={{ scale: isProcessing ? 1 : 0.98 }}
                className={`w-full relative py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer overflow-hidden ${
                  isProcessing
                    ? 'bg-neutral-800 text-neutral-500 border border-neutral-800'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]'
                }`}
              >
                {/* Shimmer effect */}
                {!isProcessing && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
                )}

                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-neutral-600 border-t-neutral-400 rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : !user ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span className="font-bold">Login to Purchase</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span className="font-bold relative z-10">
                      Continue to Payment — {activeTier?.priceLabel}
                    </span>
                    <ChevronRight className="w-4 h-4 relative z-10" />
                  </>
                )}
              </motion.button>

              {/* Error state */}
              <AnimatePresence>
                {paymentStatus === 'error' && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-red-400 text-center mt-3"
                  >
                    Payment failed. Please try again.
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-neutral-900">
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-600 font-mono">
                  <Lock className="w-3 h-3" />
                  <span>Secured by Midtrans</span>
                </div>
                <span className="text-neutral-800">·</span>
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-600 font-mono">
                  <CreditCard className="w-3 h-3" />
                  <span>256-bit SSL</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
