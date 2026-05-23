"use client"

import { cn } from "@/lib/utils"
import type { ComponentPropsWithoutRef } from "react"

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  reverse?: boolean
  pauseOnHover?: boolean
  vertical?: boolean
}

export function Marquee({
  className,
  reverse,
  pauseOnHover = false,
  vertical,
  children,
  ...props
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "flex w-max",
        vertical ? "animate-marquee-vertical flex-col" : "animate-marquee-custom",
        reverse && "[animation-direction:reverse]",
        pauseOnHover && "hover:[animation-play-state:paused]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
