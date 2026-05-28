'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { IntelligenceProvider } from '@/components/IntelligenceProvider';
import { SplashScreen } from '@/components/SplashScreen';
import { Footer } from '@/components/Footer';

const ScannerView = dynamic(() => import('@/components/ScannerView').then(m => ({ default: m.ScannerView })), { ssr: false });
const ThreatPulseView = dynamic(() => import('@/components/ThreatPulseView').then(m => ({ default: m.ThreatPulseView })), { ssr: false });
const SettingsView = dynamic(() => import('@/components/SettingsView').then(m => ({ default: m.SettingsView })), { ssr: false });

export default function Home() {
  const [activeTab, setActiveTabInner] = useState('dashboard');
  const setActiveTab = (tab: string) => {
    setActiveTabInner(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [showSplash, setShowSplash] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'scanner':
        return <ScannerView />;
      case 'threatpulse':
        return <ThreatPulseView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center h-screen flex-col text-neutral-500 bg-neutral-950">
            <h2 className="text-2xl font-medium text-white mb-2 font-display">Unknown View</h2>
          </div>
        );
    }
  };

  return (
    <IntelligenceProvider>
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      {!showSplash && (
        <motion.main 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="flex flex-col min-h-screen bg-neutral-950 overflow-x-hidden"
        >
          <Header activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="flex-1 w-full min-w-0 flex flex-col">
            {renderContent()}
          </div>
          {activeTab !== 'threatpulse' && <Footer setActiveTab={setActiveTab} />}
        </motion.main>
      )}
    </IntelligenceProvider>
  );
}
