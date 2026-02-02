import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription, PLANS, PlanId } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';

export default function PricingPage() {
  const { user } = useAuth();
  const { plan: currentPlan, loading: subscriptionLoading, isActive } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: PlanId) => {
    if (!user) {
      navigate('/register');
      return;
    }

    if (planId === 'free') {
      toast({
        title: 'Free Plan',
        description: 'Sie nutzen bereits den kostenlosen Plan.',
      });
      return;
    }

    if (currentPlan === planId && isActive) {
      // Already on this plan, open customer portal
      await handleManageSubscription();
      return;
    }

    const plan = PLANS[planId];
    if (!('price_id_monthly' in plan)) return;

    const priceId = isYearly ? plan.price_id_yearly : plan.price_id_monthly;

    try {
      setLoadingPlan(planId);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout fehlgeschlagen';
      toast({
        title: 'Fehler',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoadingPlan('manage');
      
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Portal nicht verfügbar';
      toast({
        title: 'Fehler',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const getButtonText = (planId: PlanId) => {
    if (!user) return 'Registrieren';
    if (subscriptionLoading) return 'Laden...';
    if (planId === 'free') return 'Aktueller Plan';
    if (currentPlan === planId && isActive) return 'Verwalten';
    if (currentPlan !== 'free' && isActive) {
      const planOrder: PlanId[] = ['free', 'basic', 'pro', 'profi'];
      const currentIndex = planOrder.indexOf(currentPlan);
      const targetIndex = planOrder.indexOf(planId);
      return targetIndex > currentIndex ? 'Upgrade' : 'Downgrade';
    }
    return 'Jetzt starten';
  };

  const isCurrentPlan = (planId: PlanId) => {
    return currentPlan === planId && (planId === 'free' || isActive);
  };

  const planOrder: PlanId[] = ['free', 'basic', 'pro', 'profi'];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Wählen Sie Ihren Plan</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Finden Sie den perfekten Plan für Ihre Immobilienverwaltung
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Label htmlFor="billing-toggle" className={!isYearly ? 'font-semibold' : ''}>
              Monatlich
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle" className={isYearly ? 'font-semibold' : ''}>
              Jährlich
              <Badge variant="secondary" className="ml-2">20% sparen</Badge>
            </Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {planOrder.map((planId) => {
            const plan = PLANS[planId];
            const isCurrent = isCurrentPlan(planId);
            const isPopular = planId === 'pro';
            const price = planId === 'free' 
              ? 0 
              : isYearly 
                ? (plan.price_yearly / 12).toFixed(2)
                : plan.price_monthly.toFixed(2);
            const originalPrice = planId !== 'free' && isYearly
              ? plan.price_monthly.toFixed(2)
              : null;

            return (
              <Card 
                key={planId} 
                className={`relative flex flex-col ${isCurrent ? 'border-primary border-2' : ''} ${isPopular ? 'ring-2 ring-primary' : ''}`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Beliebt
                  </Badge>
                )}
                {isCurrent && (
                  <Badge variant="outline" className="absolute -top-3 right-4">
                    Aktueller Plan
                  </Badge>
                )}
                
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <div className="mt-2">
                      {originalPrice && (
                        <span className="text-sm line-through text-muted-foreground mr-2">
                          €{originalPrice}
                        </span>
                      )}
                      <span className="text-3xl font-bold">
                        €{price}
                      </span>
                      {planId !== 'free' && (
                        <span className="text-muted-foreground">/Monat</span>
                      )}
                    </div>
                    {isYearly && planId !== 'free' && (
                      <p className="text-sm text-primary mt-1">
                        Spare €{((plan.price_monthly * 12) - plan.price_yearly).toFixed(2)}/Jahr
                      </p>
                    )}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={isCurrent ? 'outline' : isPopular ? 'default' : 'secondary'}
                    disabled={loadingPlan !== null || (planId === 'free' && isCurrent)}
                    onClick={() => handleSelectPlan(planId)}
                  >
                    {loadingPlan === planId || loadingPlan === 'manage' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {getButtonText(planId)}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {user && isActive && currentPlan !== 'free' && (
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              onClick={handleManageSubscription}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === 'manage' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Abonnement verwalten
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
