'use client';

import { useState } from 'react';
import { Shield, Lock, CreditCard, Search, ArrowRight, Activity, Zap } from 'lucide-react';
import { useAuth } from '../components/FirebaseProvider';
import { SplashScreen } from '../components/SplashScreen';
import { AnimatePresence, motion } from 'motion/react';

export default function Home() {
  const { user, signIn, logOut, aiCredits, plan, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#0B0F14]">
         <div className="w-10 h-10 border-2 border-[#B6FF3B]/50 border-t-[#B6FF3B] rounded-full animate-spin mb-4" />
         <p className="text-neutral-400 font-mono text-sm">SYNCHRONIZING VERIX PROTOCOLS...</p>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      {!showSplash && (
        <motion.main 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="flex-1 flex flex-col min-h-screen bg-[#0B0F14]"
        >
          <header className="h-16 border-b border-neutral-900 bg-[#0B0F14]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
         <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-[#B6FF3B]/10 flex items-center justify-center border border-[#B6FF3B]/20">
             <Shield className="w-4 h-4 text-[#B6FF3B]" />
           </div>
           <span className="font-display font-medium text-lg tracking-tight">VERIX</span>
         </div>
         <div className="flex items-center gap-4">
           {user ? (
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800">
                 <Zap className="w-3.5 h-3.5 text-[#FFB547]" />
                 <span className="text-xs font-mono text-neutral-300">{aiCredits} AI Credits</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="text-xs text-neutral-400 hidden sm:block">{user.email}</span>
                 <button onClick={logOut} className="text-xs font-medium text-neutral-500 hover:text-white transition-colors">Log Out</button>
               </div>
             </div>
           ) : (
             <button onClick={signIn} className="text-xs font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-neutral-200 transition-colors">
               Connect Account
             </button>
           )}
         </div>
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col gap-8">
        
        <section className="mt-8 relative hidden sm:block">
           <div className="absolute inset-0 bg-gradient-to-br from-[#4DA8FF]/5 to-[#B6FF3B]/5 rounded-3xl -z-10" />
           <div className="p-8 border border-neutral-900 rounded-3xl bg-[#121821]/50 backdrop-blur-sm text-center flex flex-col items-center">
             <h1 className="text-4xl font-display font-medium text-white mb-4">Saring Sebelum Percaya.</h1>
             <p className="text-neutral-400 max-w-lg mb-8">
               Advanced AI intelligence platform for digital risks in Indonesia. Detect phishing, Whatsapp scams, and malware effortlessly.
             </p>
             
             <div className="w-full max-w-xl relative flex items-center">
               <Search className="absolute left-4 w-5 h-5 text-neutral-500" />
               <input 
                 type="text" 
                 placeholder="Paste suspicious URL, phone number, or text..."
                 className="w-full bg-[#0B0F14] border border-neutral-800 rounded-full py-4 pl-12 pr-32 text-sm text-neutral-200 focus:outline-none focus:border-[#4DA8FF]/50 transition-colors"
               />
               <button className="absolute right-2 top-2 bottom-2 bg-white text-black px-4 rounded-full text-xs font-medium flex items-center gap-1 hover:bg-neutral-200">
                 Analyze <ArrowRight className="w-3 h-3" />
               </button>
             </div>
           </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          
          <div className="border border-neutral-900 bg-[#121821] rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 bg-neutral-900 px-2 py-1 rounded">Universal Free</div>
            </div>
            
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center mb-6">
              <Activity className="w-5 h-5 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Public Protection</h3>
            <p className="text-sm text-neutral-500 mb-6">API-based detection and realtime community feeds always free to use.</p>
            
            <ul className="space-y-3 mb-8">
              {['URL Reputation Check', 'Live Threat Feed', 'QRIS Validation', 'Community Scam Reports'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-neutral-300">
                   <div className="w-4 h-4 rounded-full bg-[#B6FF3B]/20 flex items-center justify-center shrink-0">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#B6FF3B]" />
                   </div>
                   {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-[#4DA8FF]/20 bg-[#121821] rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#4DA8FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-0 right-0 p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#4DA8FF] bg-[#4DA8FF]/10 px-2 py-1 rounded">Uses AI Credits</div>
            </div>
            
            <div className="w-10 h-10 rounded-xl bg-[#4DA8FF]/10 flex items-center justify-center mb-6 relative">
              <Zap className="w-5 h-5 text-[#4DA8FF]" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">AI Intelligence Engine</h3>
            <p className="text-sm text-neutral-500 mb-6">
              Advanced reasoning for manipulation mechanics, deepfakes, and psychological profiling.
            </p>
            
            <ul className="space-y-3 mb-8">
              {['AI Screenshot Analysis', 'AI WhatsApp Scam Profiler', 'Deepfake Forensic Report'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-[#4DA8FF]">
                   <div className="w-4 h-4 rounded flex items-center justify-center border border-[#4DA8FF]/30 bg-[#4DA8FF]/10 shrink-0">
                     <Lock className="w-2 h-2 text-[#4DA8FF]" />
                   </div>
                   {item}
                </li>
              ))}
            </ul>

            <button className="w-full py-3 rounded-xl bg-[#4DA8FF]/10 text-[#4DA8FF] text-sm font-medium hover:bg-[#4DA8FF]/20 transition-colors border border-[#4DA8FF]/20">
              {plan === 'pro' || plan === 'plus' ? 'Manage AI Subscription' : 'Upgrade for more AI Credits'}
            </button>
          </div>

        </section>

      </div>
    </motion.main>
    )}
    </>
  );
}
