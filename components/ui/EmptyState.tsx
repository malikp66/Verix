'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { LucideIcon, SatelliteDish, Radar, ShieldAlert, Activity } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  pulse?: boolean;
  className?: string;
}

const iconMap = {
  satellite: SatelliteDish,
  radar: Radar,
  shield: ShieldAlert,
  activity: Activity,
};

export function EmptyState({
  icon: Icon = SatelliteDish,
  title = 'Belum Ada Data',
  description = 'Memantau lanskap ancaman digital Indonesia secara real-time...',
  actionLabel,
  onAction,
  pulse = true,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
    >
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-center shadow-xl">
          <Icon className={cn('w-7 h-7 text-emerald-400/70', pulse && 'animate-pulse')} />
        </div>
        {pulse && (
          <>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </>
        )}
      </div>
      <h3 className="text-base font-display font-medium text-white/80 mb-2">
        {title}
      </h3>
      <p className="text-sm text-neutral-500 max-w-xs leading-relaxed font-sans">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/30 text-xs font-mono text-neutral-400 hover:text-emerald-400 rounded-xl transition-all duration-300"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
