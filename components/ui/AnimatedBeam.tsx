'use client';

import React from "react";
import { MessageSquare, Shield, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedBeamProps {
  className?: string;
}

export function AnimatedBeam({ className }: AnimatedBeamProps) {
  return (
    <div className={cn("relative flex items-center justify-center w-full h-[180px] bg-neutral-950/40 rounded-2xl border border-neutral-900 overflow-hidden px-4 select-none", className)}>
      <style>{`
        @keyframes beam-flow-1 {
          0% {
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes beam-flow-2 {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 100;
          }
        }
        @keyframes pulse-glow {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 25px rgba(16, 185, 129, 0.5);
          }
        }
        .animate-glow-active {
          animation: pulse-glow 3s infinite ease-in-out;
        }
      `}</style>

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* SVG Connections */}
      <svg
        className="absolute inset-0 w-full h-full z-0 pointer-events-none"
        viewBox="0 0 300 120"
        fill="none"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="beam-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="beam-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="1" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Path 1: User WhatsApp -> VERIX Engine */}
        <path
          d="M 50 60 Q 100 25 150 60"
          stroke="url(#beam-grad-1)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="6 8"
          style={{
            animation: "beam-flow-1 4s linear infinite",
          }}
        />

        {/* Path 2: VERIX Engine -> Safe Report Output */}
        <path
          d="M 150 60 Q 200 95 250 60"
          stroke="url(#beam-grad-2)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="6 8"
          style={{
            animation: "beam-flow-2 4s linear infinite",
          }}
        />
      </svg>

      {/* Nodes Overlay */}
      <div className="relative z-10 flex w-full justify-between items-center px-4 sm:px-8">
        
        {/* User / WhatsApp Input */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-lg group-hover:border-blue-500/50 transition-colors duration-300">
            <MessageSquare className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">WhatsApp</span>
        </div>

        {/* Central Core: VERIX Security Engine */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-14 h-14 rounded-2xl bg-neutral-950 border border-emerald-500/60 flex items-center justify-center shadow-xl animate-glow-active transition-transform duration-300">
            <Shield className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-widest">VERIX Core</span>
        </div>

        {/* Output: Verdict Report */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-lg group-hover:border-purple-500/50 transition-colors duration-300">
            <CheckCircle2 className="w-5 h-5 text-purple-400" />
          </div>
          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Safety Scan</span>
        </div>

      </div>
    </div>
  );
}
