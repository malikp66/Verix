'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Loader2, Check, X, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from './FirebaseProvider';
import { cn } from '@/lib/utils';
import { LinearGlow } from './ui/linear-glow';
import { EmptyState } from './ui/EmptyState';

interface Order {
  id: string;
  tier: string;
  credits: number;
  price: number;
  status: string;
  processed: boolean;
  createdAt: string;
}

interface BillingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIER_LABELS: Record<string, string> = {
  starter: 'Starter',
  popular: 'Popular',
  pro: 'Pro',
};

export function BillingHistoryModal({ isOpen, onClose }: BillingHistoryModalProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !user) return;

    async function fetchOrders() {
      setIsLoading(true);
      setError(null);
      try {
        const token = await user!.getIdToken();
        const res = await fetch('/api/orders', {
          headers: { authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Gagal memuat riwayat');
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      }
      setIsLoading(false);
    }

    fetchOrders();
  }, [isOpen, user]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => `Rp ${price.toLocaleString('id-ID')}`;

  const statusInfo = (status: string, processed?: boolean) => {
    if (status === 'settlement' || processed) {
      return { label: 'Berhasil', color: 'text-emerald-400', icon: Check };
    }
    if (status === 'pending' || status === 'capture') {
      return { label: 'Pending', color: 'text-amber-400', icon: Clock };
    }
    return { label: 'Gagal', color: 'text-red-400', icon: AlertTriangle };
  };

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
              'relative w-full max-w-[600px] rounded-2xl',
              'bg-neutral-950/95 backdrop-blur-2xl border border-neutral-800',
              'shadow-[0_0_60px_rgba(0,0,0,0.5)]',
              'flex flex-col overflow-hidden',
              'max-h-[90vh]'
            )}
          >
            <LinearGlow position="top" color="emerald" opacity={35} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-emerald-500/[0.03] blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 overflow-y-auto scrollbar-custom p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CreditCard className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-medium tracking-tight">
                      <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-neutral-500">
                        Riwayat Transaksi
                      </span>
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">History pembelian kredit AI</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-neutral-800/50 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                  <span className="text-sm text-neutral-400 font-mono">Memuat riwayat...</span>
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 text-red-400 text-sm font-mono">
                  {error}
                </div>
              ) : orders.length === 0 ? (
                <EmptyState
                  icon={CreditCard}
                  title="Belum ada transaksi"
                  description="Riwayat pembelian kredit akan muncul di sini setelah kamu melakukan top up."
                  pulse={false}
                />
              ) : (
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-neutral-800/40 bg-neutral-950/30">
                        <th className="text-left px-4 py-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Tanggal</th>
                        <th className="text-left px-4 py-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Paket</th>
                        <th className="text-right px-4 py-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Kredit</th>
                        <th className="text-right px-4 py-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Harga</th>
                        <th className="text-right px-4 py-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const st = statusInfo(order.status, order.processed);
                        const StatusIcon = st.icon;
                        return (
                          <tr key={order.id} className="border-b border-neutral-800/20 hover:bg-neutral-800/20 transition-colors">
                            <td className="px-4 py-3 text-neutral-300">{formatDate(order.createdAt)}</td>
                            <td className="px-4 py-3 text-neutral-200 font-medium">{TIER_LABELS[order.tier] || order.tier}</td>
                            <td className="px-4 py-3 text-right text-cyan-300 font-medium">+{order.credits}</td>
                            <td className="px-4 py-3 text-right text-neutral-300">{formatPrice(order.price)}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={cn('inline-flex items-center gap-1.5', st.color)}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {st.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
