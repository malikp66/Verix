import { useCallback } from 'react';
import { useAuth } from '@/components/FirebaseProvider';

const GUEST_MONTHLY_LIMIT = 10;

export function useAICredits() {
  const { user, credits, setCredits, isCreditLoading } = useAuth();

  const maxCredits = user ? 999 : GUEST_MONTHLY_LIMIT;

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
  }, [credits, user, setCredits]);

  const topUpCredits = useCallback(async (amount: number = 10, orderId?: string): Promise<boolean> => {
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
        body: JSON.stringify({ action: 'topup', amount, orderId }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      setCredits(data.credits);
      return true;
    } catch (e) {
      console.error('Failed to top up credits:', e);
      return false;
    }
  }, [credits, user, setCredits]);

  return { credits, maxCredits, isCreditLoading, consumeCredit, topUpCredits };
}
