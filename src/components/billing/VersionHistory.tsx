import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, TrendingUp, TrendingDown } from 'lucide-react';
import type { OperatingCostVersion } from '@/types/database';

interface VersionHistoryProps {
  operatingCostId: string;
}

export function VersionHistory({ operatingCostId }: VersionHistoryProps) {
  const [versions, setVersions] = useState<OperatingCostVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersions = async () => {
      const { data } = await supabase
        .from('operating_cost_versions')
        .select('*')
        .eq('operating_cost_id', operatingCostId)
        .order('version_number', { ascending: false });

      setVersions(data || []);
      setLoading(false);
    };

    if (operatingCostId) {
      fetchVersions();
    }
  }, [operatingCostId]);

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Lade Versionshistorie...</div>;
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Keine Versionshistorie vorhanden.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
        <History className="h-5 w-5 text-primary" />
        <span>Versionshistorie</span>
      </div>

      <div className="space-y-3">
        {versions.map((version, index) => {
          const prevVersion = versions[index + 1];
          const costChange = prevVersion ? version.total_costs - prevVersion.total_costs : 0;
          const prepaymentChange = prevVersion ? version.total_prepayments - prevVersion.total_prepayments : 0;

          return (
            <Card key={version.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium">
                    Version {version.version_number}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {new Date(version.created_at).toLocaleString('de-DE', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Gesamtkosten:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {version.total_costs.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </span>
                      {costChange !== 0 && (
                        <span className={`flex items-center text-xs ${costChange > 0 ? 'text-destructive' : 'text-success'}`}>
                          {costChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(costChange).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Gesamtvorauszahlungen:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {version.total_prepayments.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </span>
                      {prepaymentChange !== 0 && (
                        <span className={`flex items-center text-xs ${prepaymentChange > 0 ? 'text-success' : 'text-destructive'}`}>
                          {prepaymentChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(prepaymentChange).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        </span>
                      )}
                    </div>
                  </div>
                  {version.change_summary && (
                    <div className="pt-2 border-t">
                      <p className="text-muted-foreground text-xs">{version.change_summary}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
