'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const IntelContext = createContext<any>(null);

export function IntelligenceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchIntel = async () => {
      try {
        const res = await fetch('/api/intel');
        const json = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (e) {
        console.error('Intelligence Sync Failed:', e);
      }
    };

    fetchIntel();
    
    // Polling interval of 90s (visibility-aware) keeps costs absolute zero
    // while maintaining a fresh experience when active.
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchIntel();
      }
    }, 90000); 
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        fetchIntel();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isMounted = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <IntelContext.Provider value={data}>
      {children}
    </IntelContext.Provider>
  );
}

export function useIntel() {
  return useContext(IntelContext);
}
