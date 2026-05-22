import { cn } from '@/lib/utils';

interface LinearGlowProps {
  position?: 'top' | 'bottom';
  color?: 'emerald' | 'cyan' | 'blue' | 'purple' | 'amber' | 'red' | 'teal' | 'white';
  opacity?: number;
  className?: string;
}

export function LinearGlow({
  position = 'top',
  color = 'emerald',
  opacity = 40,
  className,
}: LinearGlowProps) {
  const colorMap: Record<string, string> = {
    emerald: `via-emerald-500/${opacity}`,
    cyan: `via-cyan-500/${opacity}`,
    blue: `via-blue-500/${opacity}`,
    purple: `via-purple-500/${opacity}`,
    amber: `via-amber-500/${opacity}`,
    red: `via-red-500/${opacity}`,
    teal: `via-teal-500/${opacity}`,
    white: `via-white/${Math.round((opacity / 100) * 20)}`,
  };

  return (
    <div
      className={cn(
        'absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent to-transparent',
        colorMap[color],
        position === 'top' ? 'top-0' : 'bottom-0',
        className
      )}
    />
  );
}
