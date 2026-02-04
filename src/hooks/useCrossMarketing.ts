import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
  id: string;
  app_id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: string[];
  is_active: boolean;
}

interface CrossSellTrigger {
  id: string;
  source_app_id: string;
  target_app_id: string;
  trigger_condition: string | null;
  headline: string;
  description: string;
  cta_text: string;
  cta_url: string | null;
  priority: number;
}

interface CrossMarketingState {
  products: Product[];
  triggers: CrossSellTrigger[];
  activeTrigger: CrossSellTrigger | null;
  loading: boolean;
  dismissed: boolean;
}

const CURRENT_APP_ID = 'nebenkosten';
const DISMISSED_KEY = 'cross_marketing_dismissed';

export function useCrossMarketing() {
  const { user } = useAuth();
  const [state, setState] = useState<CrossMarketingState>({
    products: [],
    triggers: [],
    activeTrigger: null,
    loading: true,
    dismissed: false,
  });

  useEffect(() => {
    // Check if banner was dismissed today
    const dismissedDate = localStorage.getItem(DISMISSED_KEY);
    if (dismissedDate === new Date().toDateString()) {
      setState(prev => ({ ...prev, dismissed: true, loading: false }));
      return;
    }

    const loadCrossMarketingData = async () => {
      try {
        // Load products and triggers in parallel
        const [productsRes, triggersRes, subscriptionsRes] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('is_active', true),
          supabase
            .from('ai_cross_sell_triggers')
            .select('*')
            .eq('source_app_id', CURRENT_APP_ID)
            .eq('is_active', true)
            .order('priority', { ascending: false }),
          user
            ? supabase
                .from('user_subscriptions')
                .select('app_id')
                .eq('user_id', user.id)
                .eq('status', 'active')
            : Promise.resolve({ data: [], error: null }),
        ]);

        const products = (productsRes.data || []).map(p => ({
          ...p,
          features: Array.isArray(p.features) ? p.features : JSON.parse(p.features as string || '[]'),
        }));

        const triggers = triggersRes.data || [];
        const activeSubscriptions = new Set(
          (subscriptionsRes.data || []).map(s => s.app_id)
        );

        // Find the first trigger for an app the user doesn't have
        const activeTrigger = triggers.find(
          t => !activeSubscriptions.has(t.target_app_id)
        ) || null;

        setState({
          products,
          triggers,
          activeTrigger,
          loading: false,
          dismissed: false,
        });
      } catch (error) {
        console.error('Error loading cross-marketing data:', error);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    loadCrossMarketingData();
  }, [user]);

  const dismissBanner = () => {
    localStorage.setItem(DISMISSED_KEY, new Date().toDateString());
    setState(prev => ({ ...prev, dismissed: true, activeTrigger: null }));
  };

  const getProductByAppId = (appId: string) => {
    return state.products.find(p => p.app_id === appId);
  };

  return {
    ...state,
    dismissBanner,
    getProductByAppId,
  };
}
