import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/FirebaseProvider';

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
      const stored = localStorage.getItem('verix_guest_credits');
      const lastReset = localStorage.getItem('verix_guest_reset_month');
      const currentMonth = new Date().toISOString().slice(0, 7);

      if (lastReset !== currentMonth || !stored) {
        localStorage.setItem('verix_guest_credits', GUEST_MONTHLY_LIMIT.toString());
        localStorage.setItem('verix_guest_reset_month', currentMonth);
        setCredits(GUEST_MONTHLY_LIMIT);
      } else {
        setCredits(parseInt(stored, 10));
      }
      setIsCreditLoading(false);
      return;
    }

    setIsCreditLoading(true);

    user.getIdToken().then(async (token) => {
      try {
        const res = await fetch('/api/credits', {
          headers: { authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.credits !== undefined) {
          setCredits(data.credits);
        } else {
          setCredits(USER_FREE_CREDITS);
        }
      } catch {
        setCredits(USER_FREE_CREDITS);
      }
      setIsCreditLoading(false);
    });
  }, [user, loading]);

  const consumeCredit = useCallback(async (amount: number = 1): Promise<boolean> => {
    if (credits === null || credits < amount) return false;

    if (!user) {
      const newCredits = credits - amount;
      localStorage.setItem('verix_guest_credits', newCredits.toString());
      setCredits(newCredits);
      return true;
    }

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'consume', amount }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 429) {
          setCredits(0);
        }
        return false;
      }

      const data = await res.json();
      setCredits(data.credits);
      return true;
    } catch (e) {
      console.error('Failed to consume credits:', e);
      return false;
    }
  }, [credits, user]);

  const topUpCredits = useCallback(async (amount: number = 10): Promise<boolean> => {
    if (!user) {
      const current = credits ?? GUEST_MONTHLY_LIMIT;
      const newCredits = current + amount;
      localStorage.setItem('verix_guest_credits', newCredits.toString());
      setCredits(newCredits);
      return true;
    }

    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'topup', amount }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      setCredits(data.credits);
      return true;
    } catch (e) {
      console.error('Failed to top up credits:', e);
      setCredits(prev => (prev !== null ? prev + amount : amount));
      return false;
    }
  }, [credits, user]);

  return { credits, maxCredits, isCreditLoading, consumeCredit, topUpCredits };
}
