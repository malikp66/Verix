'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, X, Loader2, AlertTriangle, Calendar, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LinearGlow } from './ui/linear-glow';
import { useAuth } from './FirebaseProvider';

interface Order {
  id: string;
  tier: string;
  credits: number;
  price: number;
  status: string;
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

  const fetchOrders = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Gagal memuat riwayat transaksi.');
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Fetch orders error:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchOrders();
    }
  }, [isOpen, user]);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'settlement' || s === 'capture' || s === 'success') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
          ✅ Berhasil
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          ⏳ Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20">
        ❌ Gagal
      </span>
    );
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
              'relative w-full max-w-[640px] rounded-2xl',
              'bg-neutral-950/95 backdrop-blur-2xl border border-neutral-800',
              'shadow-[0_0_60px_rgba(0,0,0,0.5)]',
              'flex flex-col overflow-hidden',
              'max-h-[85vh]'
            )}
          >
            {/* Linear glow top */}
            <LinearGlow position="top" color="emerald" opacity={35} />

            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-emerald-500/[0.03] blur-[100px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 p-6 sm:p-8 border-b border-neutral-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CreditCard className="w-4.5 h-4.5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-medium text-white tracking-tight">
                    Riwayat Transaksi
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Daftar riwayat pembelian kredit AI Anda
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchOrders}
                  disabled={isLoading}
                  className="w-8 h-8 rounded-lg bg-neutral-900/50 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-neutral-900/50 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="relative z-10 flex-1 overflow-y-auto scrollbar-custom p-6 sm:p-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                  <p className="text-sm text-neutral-500 font-mono">Memuat transaksi...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <AlertTriangle className="w-10 h-10 text-red-500/80" />
                  <h3 className="text-sm font-medium text-neutral-300">Gagal Mengambil Data</h3>
                  <p className="text-xs text-neutral-500 max-w-[280px] leading-relaxed">
                    {error}
                  </p>
                  <button
                    onClick={fetchOrders}
                    className="mt-2 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 rounded-lg cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300">Belum Ada Transaksi</h3>
                    <p className="text-xs text-neutral-500 max-w-[280px] leading-relaxed mt-1">
                      Kamu belum pernah melakukan pembelian kredit AI di Verix.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/20">
                  <table className="w-full border-collapse text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-neutral-800 bg-neutral-950/40 text-neutral-400 font-bold">
                        <th className="p-3.5">Tanggal</th>
                        <th className="p-3.5">Paket</th>
                        <th className="p-3.5 text-center">Kredit</th>
                        <th className="p-3.5 text-right">Harga</th>
                        <th className="p-3.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-neutral-900/30 transition-colors">
                          <td className="p-3.5 whitespace-nowrap text-neutral-300 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="p-3.5 font-sans font-medium text-white whitespace-nowrap">
                            {TIER_LABELS[order.tier] || order.tier}
                          </td>
                          <td className="p-3.5 text-center text-emerald-400 font-bold">
                            +{order.credits}
                          </td>
                          <td className="p-3.5 text-right font-bold text-neutral-200">
                            {formatPrice(order.price)}
                          </td>
                          <td className="p-3.5 text-center">
                            {getStatusBadge(order.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="relative z-10 p-5 bg-neutral-950/60 border-t border-neutral-800/50 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-white border border-neutral-800 rounded-lg cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
