'use client';

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

interface MeteorsProps {
  number?: number;
  className?: string;
}

export function Meteors({ number = 12, className }: MeteorsProps) {
  const [meteorStyles, setMeteorStyles] = useState<Array<React.CSSProperties>>([]);

  useEffect(() => {
    const styles = Array.from({ length: number }).map(() => ({
      top: "-10px",
      left: Math.floor(Math.random() * 120 - 20) + "%",
      animationDelay: (Math.random() * 5).toFixed(2) + "s",
      animationDuration: (Math.random() * 3 + 2).toFixed(2) + "s",
    }));
    setMeteorStyles(styles);
  }, [number]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 rounded-[inherit]">
      <style>{`
        @keyframes meteor-slide {
          0% {
            transform: rotate(215deg) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: rotate(215deg) translateX(-600px);
            opacity: 0;
          }
        }
      `}</style>
      {meteorStyles.map((style, idx) => (
        <span
          key={"meteor" + idx}
          className={cn(
            "absolute h-0.5 w-0.5 rounded-[9999px] bg-emerald-400/80 shadow-[0_0_0_1px_rgba(16,185,129,0.3)] pointer-events-none",
            "before:content-[''] before:absolute before:top-1/2 before:-translate-y-1/2 before:w-[60px] before:h-[1.5px] before:bg-gradient-to-r before:from-emerald-400/60 before:to-transparent",
            className
          )}
          style={{
            ...style,
            animationName: "meteor-slide",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        />
      ))}
    </div>
  );
}
