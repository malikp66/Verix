import { cn } from '@/lib/utils';

interface LinearGlowProps {
  position?: 'top' | 'bottom';
  color?: 'emerald' | 'cyan' | 'blue' | 'purple' | 'amber' | 'red' | 'teal' | 'white';
  opacity?: number;
  className?: string;
}

const colorToRgb: Record<string, string> = {
  emerald: '16,185,129',
  cyan: '6,182,212',
  blue: '59,130,246',
  purple: '168,85,247',
  amber: '245,158,11',
  red: '239,68,68',
  teal: '20,184,166',
  white: '255,255,255',
};

export function LinearGlow({
  position = 'top',
  color = 'emerald',
  opacity = 40,
  className,
}: LinearGlowProps) {
  const rgb = colorToRgb[color] || colorToRgb.emerald;
  const alpha = color === 'white' ? Math.round((opacity / 100) * 20) / 100 : opacity / 100;

  return (
    <div
      className={cn(
        'absolute left-0 right-0 h-[1.5px]',
        position === 'top' ? 'top-0' : 'bottom-0',
        className
      )}
      style={{
        background: `linear-gradient(to right, transparent, rgba(${rgb}, ${alpha}), transparent)`,
      }}
    />
  );
}
