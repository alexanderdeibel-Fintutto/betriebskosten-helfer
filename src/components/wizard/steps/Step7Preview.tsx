import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle2 } from 'lucide-react';
import type { WizardData, Building } from '@/types/database';

interface Step7Props {
  data: WizardData;
  operatingCostId: string | null;
  building?: Building;
}

const CHECKLIST_ITEMS = [
  { id: 'period', label: 'Abrechnungszeitraum korrekt (max. 12 Monate)' },
  { id: 'costs', label: 'Alle Kostenarten sind umlagefähig nach BetrKV' },
  { id: 'keys', label: 'Umlageschlüssel sind nachvollziehbar dokumentiert' },
  { id: 'prepayments', label: 'Vorauszahlungen wurden korrekt verrechnet' },
  { id: 'deadline', label: 'Abrechnungsfrist eingehalten (12 Monate nach Abrechnungszeitraum)' },
];

export function Step7Preview({ data, building }: Step7Props) {
  const totalCosts = data.costItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalDirectCosts = data.directCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <FileText className="h-5 w-5 text-primary" />
        <span>Schritt 7: Vorschau & Prüfung</span>
      </div>
      <p className="text-muted-foreground">
        Überprüfen Sie die Abrechnung vor dem Versand.
      </p>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Zusammenfassung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Gebäude</p>
              <p className="font-medium">{building?.name || '-'}</p>
              <p className="text-sm text-muted-foreground">
                {building?.street} {building?.house_number}, {building?.postal_code} {building?.city}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Abrechnungszeitraum</p>
              <p className="font-medium">
                {data.periodStart ? new Date(data.periodStart).toLocaleDateString('de-DE') : '-'} bis{' '}
                {data.periodEnd ? new Date(data.periodEnd).toLocaleDateString('de-DE') : '-'}
              </p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Betriebskosten gesamt:</span>
              <span className="font-medium">
                {totalCosts.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Heizkosten gesamt:</span>
              <span className="font-medium">
                {data.heatingTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Direktkosten gesamt:</span>
              <span className="font-medium">
                {totalDirectCosts.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Gesamtkosten:</span>
              <span className="font-semibold">
                {(totalCosts + data.heatingTotal + totalDirectCosts).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </span>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">Ausgewählte Mietverträge</p>
            <p className="font-medium">{data.selectedLeaseIds.length} Mietverträge</p>
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Rechtliche Checkliste
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {CHECKLIST_ITEMS.map((item) => (
              <div key={item.id} className="flex items-center space-x-3">
                <Checkbox id={item.id} defaultChecked />
                <Label htmlFor={item.id} className="font-normal cursor-pointer">
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm">
          <strong>Hinweis:</strong> Die PDF-Abrechnung wird nach dem Versand erstellt und kann dann heruntergeladen werden.
        </p>
      </div>
    </div>
  );
}
