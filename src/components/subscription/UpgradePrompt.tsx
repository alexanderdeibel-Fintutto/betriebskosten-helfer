import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface UpgradePromptProps {
  feature?: string;
  requiredPlan?: 'basic' | 'pro' | 'profi';
  className?: string;
}

export function UpgradePrompt({ 
  feature = 'Diese Funktion', 
  requiredPlan = 'pro',
  className = '' 
}: UpgradePromptProps) {
  const navigate = useNavigate();

  const planNames: Record<string, string> = {
    basic: 'Basic',
    pro: 'Pro',
    profi: 'Profi',
  };

  return (
    <Card className={`border-dashed border-2 border-muted-foreground/25 ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{planNames[requiredPlan]}-Feature</h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          {feature} ist im {planNames[requiredPlan]}-Plan verfügbar.
        </p>
        <Button onClick={() => navigate('/pricing')}>
          Jetzt upgraden
        </Button>
      </CardContent>
    </Card>
  );
}
