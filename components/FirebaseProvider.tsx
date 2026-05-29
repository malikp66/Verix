'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, database } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  credits: number | null;
  setCredits: React.Dispatch<React.SetStateAction<number | null>>;
  isCreditLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  credits: null,
  setCredits: () => {},
  isCreditLoading: true,
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [isCreditLoading, setIsCreditLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          // Ensure user document exists in Firestore BEFORE updating state
          // This prevents the credits hook from reading 0 credits
          await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });
        } catch (error) {
          console.error("Error syncing user to Firestore via API:", error);
        }
      }

      // Now set user state — downstream hooks (useAICredits) will see the correct Firestore data
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const stored = localStorage.getItem('verix_guest_credits');
      const lastReset = localStorage.getItem('verix_guest_reset_month');
      const currentMonth = new Date().toISOString().slice(0, 7);

      if (lastReset !== currentMonth || !stored) {
        localStorage.setItem('verix_guest_credits', '10');
        localStorage.setItem('verix_guest_reset_month', currentMonth);
        setCredits(10);
      } else {
        setCredits(parseInt(stored, 10));
      }
      setIsCreditLoading(false);
      return;
    }

    setIsCreditLoading(true);

    const creditRef = ref(database, `users/${user.uid}/credits`);
    const unsubscribe = onValue(
      creditRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val !== null) {
          setCredits(val);
        } else {
          // Fallback: If not in RTDB, fetch/init via API
          user.getIdToken().then(async (token) => {
            try {
              const res = await fetch('/api/credits', {
                headers: { authorization: `Bearer ${token}` },
              });
              const data = await res.json();
              if (data.credits !== undefined) {
                setCredits(data.credits);
              } else {
                setCredits(20);
              }
            } catch {
              setCredits(20);
            }
          });
        }
        setIsCreditLoading(false);
      },
      (error) => {
        console.error('RTDB credits listener error:', error);
        setIsCreditLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, loading]);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, credits, setCredits, isCreditLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
