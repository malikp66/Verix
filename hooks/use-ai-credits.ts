import { useState, useEffect } from 'react';
import { useAuth } from '@/components/FirebaseProvider';
import { doc, onSnapshot, setDoc, getDocFromServer, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const GUEST_MONTHLY_LIMIT = 10;
const USER_FREE_CREDITS = 20;
const FREE_MONTHLY_CREDITS = 10;

export function useAICredits() {
  const { user, loading } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [isCreditLoading, setIsCreditLoading] = useState(true);

  const maxCredits = user ? 999 : GUEST_MONTHLY_LIMIT;

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Guest logic using LocalStorage (monthly reset)
      const stored = localStorage.getItem('verix_guest_credits');
      const lastReset = localStorage.getItem('verix_guest_reset_month');
      const currentMonth = new Date().toISOString().slice(0, 7);

      if (lastReset !== currentMonth || !stored) {
        localStorage.setItem('verix_guest_credits', GUEST_MONTHLY_LIMIT.toString());
        localStorage.setItem('verix_guest_reset_month', currentMonth);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCredits(GUEST_MONTHLY_LIMIT);
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCredits(parseInt(stored, 10));
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCreditLoading(false);
      return;
    }

    // User logic using Firestore with monthly bonus
    setIsCreditLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();

        if (data.aiCredits === undefined) {
          // New user: initialize with free credits
          updateDoc(userRef, { aiCredits: USER_FREE_CREDITS, lastMonthlyReset: new Date().toISOString() }).catch(err => console.error(err));
          setCredits(USER_FREE_CREDITS);
        } else {
          // Check monthly bonus
          const now = Date.now();
          const lastReset = data.lastMonthlyReset
            ? (typeof data.lastMonthlyReset === 'string' ? new Date(data.lastMonthlyReset).getTime() : data.lastMonthlyReset.toMillis?.() || 0)
            : 0;

          if (!lastReset || now - lastReset > MONTH_MS) {
            const bonus = lastReset === 0 ? 0 : FREE_MONTHLY_CREDITS;
            const newCredits = data.aiCredits + bonus;
            updateDoc(userRef, { aiCredits: newCredits, lastMonthlyReset: new Date().toISOString() }).catch(err => console.error(err));
            // Set immediately so UI doesn't flash the old value
            setCredits(newCredits);
          } else {
            setCredits(data.aiCredits);
          }
        }
      }
      setIsCreditLoading(false);
    });

    return () => unsubscribe();
  }, [user, loading]);

  const consumeCredit = async (amount: number = 1): Promise<boolean> => {
    if (credits === null || credits < amount) return false;

    if (!user) {
      const newCredits = credits - amount;
      localStorage.setItem('verix_guest_credits', newCredits.toString());
      setCredits(newCredits);
      return true;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDocFromServer(userRef);
      if (snap.exists()) {
        const current = snap.data().aiCredits ?? USER_FREE_CREDITS;
        if (current >= amount) {
          await updateDoc(userRef, { aiCredits: current - amount });
          setCredits(current - amount);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Failed to consume credits:', e);
      return false;
    }
  };

  const topUpCredits = async (amount: number = 10): Promise<boolean> => {
    if (!user) {
      const current = credits ?? GUEST_MONTHLY_LIMIT;
      const newCredits = current + amount;
      localStorage.setItem('verix_guest_credits', newCredits.toString());
      setCredits(newCredits);
      return true;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      // Get the document from server to ensure accuracy
      const snap = await getDocFromServer(userRef);
      const current = snap.exists() ? (snap.data().aiCredits ?? USER_FREE_CREDITS) : USER_FREE_CREDITS;
      await setDoc(userRef, { aiCredits: current + amount }, { merge: true });
      setCredits(current + amount);
      return true;
    } catch (e) {
      console.error('Failed to top up credits in Firestore, falling back to local state:', e);
      setCredits(prev => (prev !== null ? prev + amount : amount));
      return false;
    }
  };

  return { credits, maxCredits, isCreditLoading, consumeCredit, topUpCredits };
}
