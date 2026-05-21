'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { ScannerView } from '@/components/ScannerView';
import { IntelligenceProvider } from '@/components/IntelligenceProvider';
import { SplashScreen } from '@/components/SplashScreen';
import { ThreatPulseView } from '@/components/ThreatPulseView';
import { SettingsView } from '@/components/SettingsView';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
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
          <div className="flex-1 flex items-center justify-center h-screen flex-col text-neutral-500 bg-[#0A0E13]">
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
          className="flex flex-col min-h-screen bg-[#0A0E13]"
        >
          <Header activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="flex-1 w-full min-w-0 flex flex-col">
            {renderContent()}
          </div>
        </motion.main>
      )}
    </IntelligenceProvider>
  );
}
