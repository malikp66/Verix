'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDocFromServer, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  aiCredits: number;
  plan: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  logOut: async () => {},
  aiCredits: 0,
  plan: 'free'
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiCredits, setAiCredits] = useState(5); // Default 5 credits for free
  const [plan, setPlan] = useState('free');

  useEffect(() => {
    // Initial connection test
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch or create user profile
        try {
          const userDoc = await getDocFromServer(doc(db, 'users', currentUser.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', currentUser.uid), {
              email: currentUser.email,
              plan: 'free',
              aiCredits: 5,
              createdAt: serverTimestamp()
            });
            setPlan('free');
            setAiCredits(5);
          } else {
            const data = userDoc.data();
            setPlan(data.plan || 'free');
            setAiCredits(data.aiCredits ?? 0);
          }
        } catch (error) {
           console.error("Error fetching user profile:", error);
        }
      } else {
        setPlan('free');
        setAiCredits(0);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Authentication Error", error);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Log out error", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logOut, aiCredits, plan }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
