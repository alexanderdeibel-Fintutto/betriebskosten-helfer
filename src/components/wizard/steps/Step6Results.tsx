import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lease, WizardData } from '@/types/database';

interface Step6Props {
  data: WizardData;
  leases: Lease[];
  operatingCostId: string | null;
}

interface TenantResult {
  lease: Lease;
  prepaymentTotal: number;
  operatingCostShare: number;
  heatingCostShare: number;
  directCosts: number;
  totalCostShare: number;
  balance: number;
}

export function Step6Results({ data, leases }: Step6Props) {
  // Calculate total costs for summary (even without leases)
  const totalOperatingCosts = data.costItems.reduce((sum, item) => sum + (item.amount || 0), 0) +
    (data.customCostItems || []).reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalDirectCosts = data.directCosts.reduce((sum, dc) => sum + (dc.amount || 0), 0);

  const results = useMemo(() => {
    if (leases.length === 0) return [];

    const totalArea = leases.reduce((sum, lease) => sum + (lease.unit?.area || 0), 0);
    const totalPersons = leases.reduce((sum, lease) => sum + lease.persons_count, 0);
    const totalConsumption = data.meterReadings.reduce((sum, r) => sum + ((r.reading_end || 0) - (r.reading_start || 0)), 0);

    // Calculate billing period in months
    const periodStart = new Date(data.periodStart || '');
    const periodEnd = new Date(data.periodEnd || '');
    const months = Math.max(1, Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24 * 30)));

    // Heating cost splits
    const heatingAreaCost = (data.heatingTotal * data.heatingAreaPercentage) / 100;
    const heatingConsumptionCost = data.heatingTotal - heatingAreaCost;

    // Combine standard and custom cost items
    const allCostItems = [...data.costItems, ...(data.customCostItems || [])];

    return leases.map((lease): TenantResult => {
      const unitArea = lease.unit?.area || 0;
      const persons = lease.persons_count;
      const reading = data.meterReadings.find((r) => r.unit_id === lease.unit_id);
      const consumption = reading ? (reading.reading_end || 0) - (reading.reading_start || 0) : 0;

      // Calculate operating cost share based on allocation keys
      let operatingCostShare = 0;
      allCostItems.forEach((item) => {
        if ((item.amount || 0) === 0) return;
        
        switch (item.allocation_key) {
          case 'area':
            operatingCostShare += totalArea > 0 ? (item.amount || 0) * (unitArea / totalArea) : 0;
            break;
          case 'persons':
            operatingCostShare += totalPersons > 0 ? (item.amount || 0) * (persons / totalPersons) : 0;
            break;
          case 'units':
            operatingCostShare += (item.amount || 0) / leases.length;
            break;
          case 'consumption':
            operatingCostShare += totalConsumption > 0 ? (item.amount || 0) * (consumption / totalConsumption) : 0;
            break;
        }
      });

      // Calculate heating cost share
      let heatingCostShare = 0;
      if (data.heatingTotal > 0) {
        // Area-based portion
        heatingCostShare += totalArea > 0 ? heatingAreaCost * (unitArea / totalArea) : 0;
        // Consumption-based portion
        heatingCostShare += totalConsumption > 0 ? heatingConsumptionCost * (consumption / totalConsumption) : 0;
      }

      // Direct costs for this tenant
      const directCosts = data.directCosts
        .filter((dc) => dc.lease_id === lease.id)
        .reduce((sum, dc) => sum + (dc.amount || 0), 0);

      // Total prepayments
      const prepaymentTotal = lease.monthly_prepayment * months;

      // Total cost share
      const totalCostShare = operatingCostShare + heatingCostShare + directCosts;

      // Balance: positive = tenant gets money back, negative = tenant owes money
      const balance = prepaymentTotal - totalCostShare;

      return {
        lease,
        prepaymentTotal,
        operatingCostShare,
        heatingCostShare,
        directCosts,
        totalCostShare,
        balance,
      };
    });
  }, [data, leases]);

  const totalBalance = results.reduce((sum, r) => sum + r.balance, 0);
  const totalPrepayments = results.reduce((sum, r) => sum + r.prepaymentTotal, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
        <Calculator className="h-5 w-5 text-primary flex-shrink-0" />
        <span>Schritt 6: Ergebnisse prüfen</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Überprüfen Sie die erfassten Kosten und berechneten Ergebnisse.
      </p>

      {/* Summary Cards - always show */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs sm:text-sm text-muted-foreground">Betriebskosten</p>
            <p className="text-base sm:text-lg font-semibold">
              {totalOperatingCosts.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs sm:text-sm text-muted-foreground">Heizkosten</p>
            <p className="text-base sm:text-lg font-semibold">
              {data.heatingTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs sm:text-sm text-muted-foreground">Direktkosten</p>
            <p className="text-base sm:text-lg font-semibold">
              {totalDirectCosts.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs sm:text-sm text-muted-foreground">Gesamtkosten</p>
            <p className="text-base sm:text-lg font-semibold">
              {(totalOperatingCosts + data.heatingTotal + totalDirectCosts).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </CardContent>
        </Card>
      </div>

      {results.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Keine Mietverträge vorhanden. Die Kosten wurden erfasst, aber es können noch keine Abrechnungen für Mieter erstellt werden. Sie können die Abrechnung speichern und später Mieter hinzufügen.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {results.map((result) => (
              <Card key={result.lease.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex justify-between items-start">
                    <span>{result.lease.tenant?.first_name} {result.lease.tenant?.last_name}</span>
                    <span className={cn(
                      'text-xs font-semibold px-2 py-1 rounded',
                      result.balance >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                    )}>
                      {result.balance >= 0 ? 'Guthaben' : 'Nachzahlung'}
                    </span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{result.lease.unit?.name}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vorauszahlungen:</span>
                      <span>{result.prepaymentTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Betriebskosten:</span>
                      <span>{result.operatingCostShare.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Heizkosten:</span>
                      <span>{result.heatingCostShare.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    {result.directCosts > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Direktkosten:</span>
                        <span>{result.directCosts.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Saldo:</span>
                      <span className={cn(
                        result.balance >= 0 ? 'text-success' : 'text-destructive'
                      )}>
                        {Math.abs(result.balance).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mieter</TableHead>
                  <TableHead>Wohneinheit</TableHead>
                  <TableHead className="text-right">Vorauszahlungen</TableHead>
                  <TableHead className="text-right">Kostenanteil</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.lease.id}>
                    <TableCell className="font-medium">
                      {result.lease.tenant?.first_name} {result.lease.tenant?.last_name}
                    </TableCell>
                    <TableCell>{result.lease.unit?.name}</TableCell>
                    <TableCell className="text-right">
                      {result.prepaymentTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </TableCell>
                    <TableCell className="text-right">
                      {result.totalCostShare.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        'font-semibold flex items-center justify-end gap-1',
                        result.balance >= 0 ? 'text-success' : 'text-destructive'
                      )}>
                        {result.balance >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {Math.abs(result.balance).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        {result.balance >= 0 ? ' Guthaben' : ' Nachzahlung'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Detailed Cards - Desktop only */}
          <div className="hidden sm:grid sm:grid-cols-2 gap-4">
            {results.map((result) => (
              <Card key={result.lease.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {result.lease.tenant?.first_name} {result.lease.tenant?.last_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Betriebskosten:</span>
                      <span>{result.operatingCostShare.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Heizkosten:</span>
                      <span>{result.heatingCostShare.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    {result.directCosts > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Direktkosten:</span>
                        <span>{result.directCosts.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Gesamt:</span>
                      <span>{result.totalCostShare.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
