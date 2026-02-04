import { X, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCrossMarketing } from '@/hooks/useCrossMarketing';

export function CrossMarketingBanner() {
  const { activeTrigger, dismissed, loading, dismissBanner, getProductByAppId } = useCrossMarketing();

  if (loading || dismissed || !activeTrigger) {
    return null;
  }

  const targetProduct = getProductByAppId(activeTrigger.target_app_id);

  return (
    <div className="relative bg-gradient-to-r from-secondary/10 via-primary/10 to-secondary/10 border-b border-border/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">
                {activeTrigger.headline}
              </p>
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                {activeTrigger.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {targetProduct && (
              <span className="text-xs text-muted-foreground hidden md:inline">
                ab {targetProduct.price_monthly.toFixed(2)} €/Monat
              </span>
            )}
            <Button
              size="sm"
              variant="default"
              className="gap-1.5"
              asChild
            >
              <a 
                href={activeTrigger.cta_url || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {activeTrigger.cta_text}
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={dismissBanner}
              aria-label="Banner schließen"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
