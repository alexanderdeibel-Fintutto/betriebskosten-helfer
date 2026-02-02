import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Building2 } from 'lucide-react';
import type { Building, WizardData } from '@/types/database';

interface Step1Props {
  buildings: Building[];
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
}

export function Step1BuildingPeriod({ buildings, data, onUpdate }: Step1Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Building2 className="h-5 w-5 text-primary" />
        <span>Schritt 1: Objekt & Zeitraum</span>
      </div>
      <p className="text-muted-foreground">
        Wählen Sie das Gebäude und den Abrechnungszeitraum aus.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="building">Gebäude</Label>
          <Select value={data.buildingId || ''} onValueChange={(v) => onUpdate({ buildingId: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Gebäude auswählen" />
            </SelectTrigger>
            <SelectContent>
              {buildings.map((building) => (
                <SelectItem key={building.id} value={building.id}>
                  {building.name} - {building.street} {building.house_number}, {building.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {buildings.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Sie haben noch keine Gebäude angelegt. Bitte erstellen Sie zuerst ein Gebäude.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="period_start">Abrechnungszeitraum von</Label>
            <Input
              id="period_start"
              type="date"
              value={data.periodStart || ''}
              onChange={(e) => onUpdate({ periodStart: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="period_end">Abrechnungszeitraum bis</Label>
            <Input
              id="period_end"
              type="date"
              value={data.periodEnd || ''}
              onChange={(e) => onUpdate({ periodEnd: e.target.value })}
            />
          </div>
        </div>

        {data.periodStart && data.periodEnd && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Abrechnungszeitraum:</strong>{' '}
              {new Date(data.periodStart).toLocaleDateString('de-DE')} bis{' '}
              {new Date(data.periodEnd).toLocaleDateString('de-DE')}
              {' '}
              ({Math.round((new Date(data.periodEnd).getTime() - new Date(data.periodStart).getTime()) / (1000 * 60 * 60 * 24 * 30))} Monate)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
