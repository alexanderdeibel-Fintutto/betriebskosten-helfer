import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import confetti from 'canvas-confetti';

export default function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh, currentPlan, loading } = useSubscription();
  const [refreshed, setRefreshed] = useState(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 0,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 0,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Refresh subscription status after successful payment
    if (sessionId && !refreshed) {
      const timer = setTimeout(() => {
        refresh();
        setRefreshed(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sessionId, refresh, refreshed]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex items-center justify-center">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <PartyPopper className="h-6 w-6 text-accent-foreground" />
            Willkommen bei {currentPlan.name}!
            <PartyPopper className="h-6 w-6 text-accent-foreground" />
          </CardTitle>
          <CardDescription className="text-lg">
            Ihre Zahlung war erfolgreich
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Vielen Dank für Ihr Vertrauen! Sie haben jetzt Zugriff auf alle {currentPlan.name}-Features.
          </p>

          {loading && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Aktualisiere Abonnement...</span>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              Zur App
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/pricing')}
            >
              Preise ansehen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
