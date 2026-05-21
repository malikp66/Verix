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
    
    // Pseudo-realtime polling (10s) creates active dashboard feel
    // Hits efficient server-side cache, keeping costs near absolute zero.
    const timer = setInterval(fetchIntel, 10000); 
    
    return () => {
      isMounted = false;
      clearInterval(timer);
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
