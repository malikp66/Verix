'use client';

import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert, ScanFace, Scan, Package, CheckCircle2,
  X, AlertTriangle, Activity,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type ToastResult = {
  severity_score: number;
  risk_level: string;
  analysis_type?: string;
  summary?: string;
  behavioral_analysis?: string;
  deepfake_score?: number;
};

const toastColorMap: Record<string, { ring: string; bg: string; border: string; icon: string }> = {
  deepfake: { ring: '#d946ef', bg: 'rgba(217,70,239,0.1)', border: 'rgba(217,70,239,0.25)', icon: '#d946ef' },
  qris:     { ring: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)', icon: '#a855f7' },
  file:     { ring: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: '#f59e0b' },
  default:  { ring: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', icon: '#10b981' },
};

export function ScanResultToast({
  result,
  visible,
  onClose,
}: {
  result: ToastResult | null;
  visible: boolean;
  onClose: () => void;
}) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible && result) {
      timerRef.current = setTimeout(onClose, 6000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, result, onClose]);

  if (!result) return null;

  const colors = toastColorMap[result.analysis_type || ''] || toastColorMap.default;
  const score = result.analysis_type === 'deepfake' ? (result.deepfake_score ?? result.severity_score) : result.severity_score;
  const summary = result.summary || result.behavioral_analysis || '';
  const truncated = summary.length > 80 ? summary.substring(0, 80) + '...' : summary;

  let Icon = Activity;
  if (result.analysis_type === 'deepfake') Icon = ScanFace;
  else if (result.analysis_type === 'qris') Icon = Scan;
  else if (result.analysis_type === 'file') Icon = Package;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 80, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 80, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed top-24 right-6 z-50 max-w-sm w-full"
        >
          <div
            className="rounded-2xl border backdrop-blur-xl p-4 shadow-2xl"
            style={{ backgroundColor: colors.bg, borderColor: colors.border }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                style={{ backgroundColor: `${colors.ring}15`, borderColor: `${colors.ring}30`, color: colors.icon }}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                    {result.risk_level} THREAT
                  </span>
                  {score >= 60 ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                </div>

                <p className="text-[11px] font-mono text-neutral-300 leading-relaxed line-clamp-2">
                  {truncated || 'Analysis complete.'}
                </p>

                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-bold"
                      style={{ backgroundColor: `${colors.ring}20`, color: colors.ring }}
                    >
                      {score}
                    </div>
                    <span className="text-[9px] font-mono text-neutral-500">SCORE</span>
                  </div>
                  <span className="text-[9px] font-mono text-neutral-600 uppercase tracking-wider">
                    {result.analysis_type || 'scan'}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
