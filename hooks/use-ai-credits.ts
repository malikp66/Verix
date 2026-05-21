import { useState, useEffect } from 'react';
import { useAuth } from '@/components/FirebaseProvider';
import { doc, onSnapshot, setDoc, getDocFromServer, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const GUEST_DAILY_LIMIT = 3;
const USER_MONTHLY_LIMIT = 25;

export function useAICredits() {
  const { user, loading } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [isCreditLoading, setIsCreditLoading] = useState(true);

  const maxCredits = user ? USER_MONTHLY_LIMIT : GUEST_DAILY_LIMIT;

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Guest logic using LocalStorage
      const stored = localStorage.getItem('verix_guest_credits');
      const lastReset = localStorage.getItem('verix_guest_reset_date');
      const today = new Date().toDateString();

      if (lastReset !== today || !stored) {
        localStorage.setItem('verix_guest_credits', GUEST_DAILY_LIMIT.toString());
        localStorage.setItem('verix_guest_reset_date', today);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCredits(GUEST_DAILY_LIMIT);
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCredits(parseInt(stored, 10));
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCreditLoading(false);
      return;
    }

    // User logic using Firestore
    
    setIsCreditLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.aiCredits !== undefined) {
          setCredits(data.aiCredits);
        } else {
          // Initialize credits for new user
          updateDoc(userRef, { aiCredits: USER_MONTHLY_LIMIT }).catch(err => console.error(err));
          setCredits(USER_MONTHLY_LIMIT);
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
        const current = snap.data().aiCredits ?? USER_MONTHLY_LIMIT;
        if (current >= amount) {
          await updateDoc(userRef, { aiCredits: current - amount });
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return { credits, maxCredits, isCreditLoading, consumeCredit };
}
