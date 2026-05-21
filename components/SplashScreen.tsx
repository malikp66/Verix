'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield } from 'lucide-react';
import { DiaTextReveal } from './ui/dia-text-reveal';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [loadingText, setLoadingText] = useState('Initializing Threat Intelligence...');
  const [progress, setProgress] = useState(0);

  const texts = [
    'Initializing Threat Intelligence...',
    'Syncing Scam Database...',
    'Verifying Security Channels...',
    'Activating AI Analysis Engine...',
    'Connecting to Threat Network...',
    'Monitoring Digital Threats...'
  ];

  useEffect(() => {
    let currentTextIndex = 0;
    const textInterval = setInterval(() => {
      currentTextIndex++;
      if (currentTextIndex < texts.length) {
         setLoadingText(texts[currentTextIndex]);
      }
    }, 450);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(textInterval);
          setTimeout(onComplete, 400);
          return 100;
        }
        return prev + Math.random() * 5;
      });
    }, 80);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-neutral-950 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Background Cinematic Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_0%,_rgba(182,255,59,0.05)_0%,_rgba(3,3,3,1)_80%)] -z-10" />
      <div className="absolute inset-0 opacity-10 -z-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]" />

      {/* Floating threat nodes simulated with gradients */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#B6FF3B]/10 rounded-full blur-[120px] -z-10 mix-blend-screen" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.05, 0.15, 0.05]
        }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/3 right-1/4 w-[30rem] h-[30rem] bg-[#4DA8FF]/10 rounded-full blur-[150px] -z-10 mix-blend-screen" 
      />

      {/* Scan Line */}
      <motion.div
        className="absolute inset-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#B6FF3B]/50 to-transparent -z-10"
        animate={{ y: ['-10vh', '110vh'] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
      />
      
      {/* Central Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Radar/Shield Icon */}
        <div className="relative mb-8">
           <motion.div
             animate={{ rotate: 360 }}
             transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
             className="absolute -inset-8 rounded-full border border-dashed border-[#B6FF3B]/20 pointer-events-none"
           />
           <motion.div
             animate={{ rotate: -360 }}
             transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
             className="absolute -inset-12 rounded-full border border-[#4DA8FF]/10 pointer-events-none"
           />
           <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ duration: 1, ease: "easeOut" }}
             className="w-20 h-20 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(182,255,59,0.15)] relative overflow-hidden"
           >
              <div className="absolute inset-0 bg-gradient-to-br from-[#B6FF3B]/10 to-transparent opacity-50" />
              <Shield className="w-10 h-10 text-[#B6FF3B] relative z-10 drop-shadow-[0_0_15px_rgba(182,255,59,0.8)]" />
           </motion.div>
        </div>

        {/* Brand */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center"
        >
          <h1 className="text-5xl font-display font-medium tracking-tight text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
            <DiaTextReveal text="VERIX" duration={1.5} delay={0.2} colors={['#b6ff3b', '#4da8ff', '#b6ff3b']} textColor="#ffffff" />
          </h1>
          <p className="text-[10px] font-mono tracking-[0.3em] text-[#4DA8FF] uppercase mb-4 opacity-80 pl-1">
            Verifikasi Risiko Digital
          </p>
        </motion.div>

        {/* Action / Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-neutral-400 font-medium tracking-wide mb-16 text-sm"
        >
          &quot;Analisis Ancaman Siber Terkalibrasi.&quot;
        </motion.p>

        {/* Loading Module */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col items-center w-full max-w-xs"
        >
          <div className="flex items-center justify-between w-full mb-3 px-1">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B6FF3B] animate-pulse" />
              {loadingText}
            </span>
            <span className="text-[10px] font-mono text-[#4DA8FF]">{Math.min(100, Math.floor(progress))}%</span>
          </div>
          
          <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden relative border border-neutral-800/50">
            <motion.div 
               className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-[#4DA8FF] to-[#B6FF3B] shadow-[0_0_10px_rgba(182,255,59,0.5)]"
               initial={{ width: "0%" }}
               animate={{ width: `${Math.min(100, progress)}%` }}
               transition={{ ease: "easeOut", duration: 0.1 }}
            />
          </div>
        </motion.div>
      </div>

      {/* Tiny live feed ticker at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 w-full overflow-hidden flex justify-center opacity-60"
      >
         <div className="flex items-center gap-3 bg-neutral-900/50 backdrop-blur-md px-4 py-1.5 border border-neutral-800/50 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFB547] animate-pulse" />
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              key={loadingText}
              className="text-[9px] font-mono text-neutral-400 tracking-wider"
            >
              SIGNAL DETECTED / REALTIME FEED STANDBY...
            </motion.span>
         </div>
      </motion.div>
    </motion.div>
  );
}
