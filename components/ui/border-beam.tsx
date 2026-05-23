"use client"

import { cn } from "@/lib/utils"

interface BorderBeamProps {
  className?: string
  size?: number
  duration?: number
  borderWidth?: number
  anchor?: number
  colorFrom?: string
  colorTo?: string
  delay?: number
  reverse?: boolean
}

export function BorderBeam({
  className,
  size = 200,
  duration = 8,
  borderWidth = 1.5,
  anchor = 90,
  colorFrom = "#05F394",
  colorTo = "#00F59B",
  delay = 0,
  reverse,
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        "[border:calc(var(--border-width)*1px)_solid_transparent]",
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect]",
        "[mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "after:absolute after:aspect-square after:w-[calc(var(--size)*1px)]",
        "after:animate-border-beam",
        "after:[background:var(--color-beam)]",
        "after:[offset-anchor:calc(var(--anchor)*1%)_50%]",
        "after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]",
        reverse && "after:[animation-direction:reverse]",
        className
      )}
      style={{
        "--size": size,
        "--duration": `${duration}s`,
        "--anchor": anchor,
        "--border-width": borderWidth,
        "--delay": `-${delay}s`,
        "--color-beam": `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
      } as React.CSSProperties}
    />
  )
}
