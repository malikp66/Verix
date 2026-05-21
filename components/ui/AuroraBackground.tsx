'use client';

import React from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export function AuroraBackground({ className, children }: AuroraBackgroundProps) {
  return (
    <div className={cn("relative w-full overflow-hidden bg-transparent", className)}>
      <style>{`
        @keyframes aurora-gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
      <div 
        className="absolute inset-0 pointer-events-none z-0 mix-blend-screen select-none opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 15% 15%, rgba(16, 185, 129, 0.18) 0%, transparent 45%),
            radial-gradient(circle at 85% 85%, rgba(59, 130, 246, 0.18) 0%, transparent 45%),
            radial-gradient(circle at 50% 40%, rgba(168, 85, 247, 0.08) 0%, transparent 40%)
          `,
          backgroundSize: "200% 200%",
          animation: "aurora-gradient 20s ease-in-out infinite",
          filter: "blur(70px)",
        }}
      />
      {children}
    </div>
  );
}
