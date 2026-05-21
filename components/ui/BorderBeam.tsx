'use client';

import React from "react";
import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
}

export function BorderBeam({
  className,
  duration = 8,
  borderWidth = 1.5,
  colorFrom = "#10b981", // Emerald-500
  colorTo = "#3b82f6",   // Blue-500
}: BorderBeamProps) {
  return (
    <div 
      className={cn("absolute inset-0 pointer-events-none rounded-[inherit] z-20", className)}
      style={{
        padding: `${borderWidth}px`,
      }}
    >
      <style>{`
        @keyframes border-beam-rotate {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
      `}</style>
      <div className="absolute inset-0 rounded-[inherit] overflow-hidden">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250%] h-[250%] origin-center"
          style={{
            background: `conic-gradient(from 0deg, transparent 50%, ${colorFrom} 70%, ${colorTo} 90%, transparent 100%)`,
            animation: `border-beam-rotate ${duration}s linear infinite`,
          }}
        />
      </div>
      {/* Standard CSS Mask to crop out the inside, leaving only the thin border width */}
      <div 
        className="absolute inset-0 rounded-[inherit] border border-transparent pointer-events-none"
        style={{
          background: "clip-box",
          WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "destination-out",
          maskComposite: "exclude",
        }}
      />
    </div>
  );
}
