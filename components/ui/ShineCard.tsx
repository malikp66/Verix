'use client';

import React from "react";
import { cn } from "@/lib/utils";

interface ShineCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function ShineCard({ children, className, glowColor = "rgba(16, 185, 129, 0.12)", ...props }: ShineCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-3xl border border-neutral-800/80 bg-[#0c0c0c] hover:bg-[#111111]/80 hover:border-neutral-700/80 transition-all duration-500 overflow-hidden shadow-2xl p-8 flex flex-col justify-between cursor-default",
        className
      )}
      {...props}
    >
      <style>{`
        @keyframes shine-sweep-effect {
          0% {
            left: -150%;
          }
          100% {
            left: 250%;
          }
        }
        .shine-trigger:hover .shine-effect-layer {
          animation: shine-sweep-effect 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Glow corner highlight */}
      <div 
        className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${glowColor}, transparent 60%)`,
        }}
      />

      {/* Sweep shine light effect */}
      <div 
        className="shine-effect-layer absolute top-0 -inset-y-0 w-2/3 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 z-10 pointer-events-none"
        style={{ left: "-150%" }}
      />
      
      <div className="relative z-10 h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}
export function ShineCardContainer({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div className={cn("shine-trigger relative rounded-3xl", className)} {...props}>
      {children}
    </div>
  );
}
