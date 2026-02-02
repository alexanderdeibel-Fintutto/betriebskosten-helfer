import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionData {
  subscribed: boolean;
  plan_id: string;
  product_id: string | null;
  price_id: string | null;
  subscription_end: string | null;
}

// Vermietify Stripe Price IDs
export const PLANS = {
  free: {
    name: 'Starter',
    price_monthly: 0,
    price_yearly: 0,
    price_id_monthly: 'price_1Sr55p52lqSgjCzeX6tlI5tv',
    price_id_yearly: 'price_1Sr55p52lqSgjCzeX6tlI5tv',
    features: [
      'Bis zu 1 Gebäude',
      'Bis zu 3 Einheiten',
      'Basis NK-Abrechnung',
      'E-Mail Support',
    ],
  },
  basic: {
    name: 'Basic',
    price_monthly: 9.99,
    price_yearly: 95.90,
    price_id_monthly: 'price_1StYO152lqSgjCze6P1GfT2G',
    price_id_yearly: 'price_1StYO152lqSgjCze6P1GfT2G',
    features: [
      'Bis zu 5 Gebäude',
      'Bis zu 20 Einheiten',
      'Vollständige NK-Abrechnung',
      'Mietermanagement',
      'PDF-Export',
      'Priority Support',
    ],
  },
  pro: {
    name: 'Pro',
    price_monthly: 24.99,
    price_yearly: 239.90,
    price_id_monthly: 'price_1StYOT52lqSgjCzeN0V0dLpA',
    price_id_yearly: 'price_1StYOT52lqSgjCzeN0V0dLpA',
    features: [
      'Unbegrenzte Gebäude',
      'Unbegrenzte Einheiten',
      'Alle Basic-Features',
      'Automatische Berechnungen',
      'Zählerstandsverwaltung',
      'Dokumentenmanagement',
      'API-Zugang',
      '24/7 Premium Support',
    ],
  },
  profi: {
    name: 'Enterprise',
    price_monthly: 79,
    price_yearly: 790,
    price_id_monthly: 'price_1Sr57E52lqSgjCze3iHixnBn',
    price_id_yearly: 'price_1Sr57E52lqSgjCze3iHixnBn',
    features: [
      'Alle Pro-Features',
      'Multi-User Zugang',
      'Vermietify Pro',
      'HausmeisterPro Starter',
      'Zählerstand Premium',
      'Formulare Komplett',
      'White-Label Option',
      'Dedizierter Account Manager',
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke('check-subscription');
      
      if (fnError) {
        throw new Error(fnError.message);
      }

      setSubscription(data as SubscriptionData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check subscription';
      setError(message);
      console.error('Subscription check error:', message);
      // Default to free on error
      setSubscription({
        subscribed: false,
        plan_id: 'free',
        product_id: null,
        price_id: null,
        subscription_end: null,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      checkSubscription();
    }
  }, [user, authLoading, checkSubscription]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const planId = (subscription?.plan_id || 'free') as PlanId;
  const currentPlan = PLANS[planId] || PLANS.free;

  return {
    subscription,
    loading: loading || authLoading,
    error,
    refresh: checkSubscription,
    plan: planId,
    currentPlan,
    isPro: ['pro', 'profi'].includes(planId),
    isBasic: planId === 'basic',
    isFree: planId === 'free',
    isActive: subscription?.subscribed || false,
    subscriptionEnd: subscription?.subscription_end 
      ? new Date(subscription.subscription_end) 
      : null,
  };
}
