'use client';

import Link from 'next/link';
import { 
  Shield, 
  Database, 
  ExternalLink, 
  Github, 
  Twitter, 
  Globe, 
  Activity, 
  FileText, 
  ShieldCheck, 
  AlertTriangle,
  Lock
} from 'lucide-react';

interface FooterProps {
  setActiveTab?: (tab: string) => void;
}

export function Footer({ setActiveTab }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#080809] border-t border-neutral-900/80 text-neutral-400 overflow-hidden">
      {/* Subtle Stripe-like ambient glow */}
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[250px] bg-emerald-500/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[400px] h-[200px] bg-indigo-500/[0.015] rounded-full blur-[100px] pointer-events-none" />

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 pt-20 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 pb-16 border-b border-neutral-900/60">
          
          {/* Column 1: Brand & Status */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-inner relative group-hover:border-emerald-500/30">
                <Shield className="w-5 h-5 text-emerald-400" />
                <div className="absolute inset-0 rounded-xl border border-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]" />
              </div>
              <span className="text-xl font-display font-medium text-white tracking-tight">VERIX</span>
            </div>
            
            <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
              Sistem deteksi risiko digital dan intelijen ancaman siber terpadu untuk Indonesia. Membedah narasi penipuan, malware, phishing, dan manipulasi digital secara real-time.
            </p>

            {/* Operational Status Dot (Stripe-inspired) */}
            <div className="flex items-center gap-2 bg-[#0E0E10] border border-neutral-900 px-3.5 py-1.5 rounded-full w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400/90 font-medium tracking-wide">
                VERIX Threat Engine: OPERATIONAL
              </span>
            </div>
          </div>

          {/* Column 2: Data Sources (Detail of feeds) */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-mono font-bold tracking-widest text-neutral-300 uppercase flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              DATA FEED SOURCES
            </h4>
            <ul className="flex flex-col gap-3 text-sm">
              <li>
                <a 
                  href="https://urlhaus.abuse.ch" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center justify-between group"
                >
                  <span>Abuse.ch URLhaus</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 group-hover:text-emerald-400" />
                </a>
              </li>
              <li>
                <span className="text-neutral-500 select-none">Google News Security RSS</span>
              </li>
              <li>
                <a 
                  href="https://gnews.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center justify-between group"
                >
                  <span>GNews API</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 group-hover:text-emerald-400" />
                </a>
              </li>
              <li>
                <a 
                  href="https://newsapi.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center justify-between group"
                >
                  <span>NewsAPI.org</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 group-hover:text-emerald-400" />
                </a>
              </li>
              <li>
                <a 
                  href="https://newsapi.ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center justify-between group"
                >
                  <span>NewsAPI.ai (EventRegistry)</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 group-hover:text-emerald-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform Sections */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-mono font-bold tracking-widest text-neutral-300 uppercase flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              PLATFORM NAVIGATION
            </h4>
            <ul className="flex flex-col gap-3 text-sm">
              {setActiveTab ? (
                <>
                  <li>
                    <button 
                      onClick={() => setActiveTab('dashboard')} 
                      className="hover:text-emerald-400 transition-colors text-left"
                    >
                      Dashboard Analitik
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveTab('scanner')} 
                      className="hover:text-emerald-400 transition-colors text-left"
                    >
                      Visual OCR Scanner
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveTab('threatpulse')} 
                      className="hover:text-emerald-400 transition-colors text-left"
                    >
                      Live Threat Pulse Map
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveTab('settings')} 
                      className="hover:text-emerald-400 transition-colors text-left"
                    >
                      Pengaturan & Privasi
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li><span className="text-neutral-500">Dashboard Analitik</span></li>
                  <li><span className="text-neutral-500">Visual OCR Scanner</span></li>
                  <li><span className="text-neutral-500">Live Threat Pulse Map</span></li>
                  <li><span className="text-neutral-500">Pengaturan & Privasi</span></li>
                </>
              )}
            </ul>
          </div>

          {/* Column 4: System Disclaimers */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-mono font-bold tracking-widest text-neutral-300 uppercase flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              SYSTEM & LEGAL
            </h4>
            <div className="flex flex-col gap-3 text-xs leading-relaxed text-neutral-500">
              <div className="flex items-start gap-1.5 bg-[#0A0A0C] border border-neutral-900 p-2.5 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500/80 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-neutral-400">Disclaimer:</strong> Risk verification results are processed automatically using AI heuristic models and public databases. Always verify important information independently.
                </p>
              </div>
              <div className="flex items-center gap-1.5 pl-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/60" />
                <span>Open-source security research tool.</span>
              </div>
              <div className="flex flex-col gap-2 mt-2 pl-1">
                <Link href="/terms" className="hover:text-emerald-400 transition-colors flex items-center gap-2 text-xs">
                  <FileText className="w-3 h-3 text-emerald-500/60" />
                  Syarat & Ketentuan
                </Link>
                <Link href="/privacy" className="hover:text-emerald-400 transition-colors flex items-center gap-2 text-xs">
                  <Lock className="w-3 h-3 text-emerald-500/60" />
                  Kebijakan Privasi
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Info */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono text-neutral-500">
          <div className="flex flex-wrap items-center gap-2.5">
            <span>&copy; {currentYear} VERIX. All Rights Reserved.</span>
            <span className="text-neutral-800">|</span>
            <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms</Link>
            <span className="text-neutral-800">|</span>
            <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</Link>
            <span className="text-neutral-800">|</span>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-neutral-600" />
              ID Portal (Jakarta/WIB)
            </span>
          </div>

          {/* Socials & Tech Info */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="GitHub Repository"
                className="hover:text-white transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                title="Twitter/X Profile"
                className="hover:text-white transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
            <span className="text-[10px] bg-[#111] border border-neutral-900 px-2 py-0.5 rounded text-neutral-500">
              v1.2.0-stable
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
