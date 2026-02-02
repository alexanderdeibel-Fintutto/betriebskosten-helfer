import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Flame } from 'lucide-react';
import type { Lease, WizardData, MeterReading } from '@/types/database';

interface Step5Props {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  leases: Lease[];
  operatingCostId: string | null;
}

const HEATING_SPLITS = [
  { value: '30', label: '30% Fläche / 70% Verbrauch (Standard)' },
  { value: '40', label: '40% Fläche / 60% Verbrauch' },
  { value: '50', label: '50% Fläche / 50% Verbrauch' },
];

export function Step5HeatingCosts({ data, onUpdate, leases }: Step5Props) {
  const getMeterReading = (unitId: string): Partial<MeterReading> => {
    return data.meterReadings.find((r) => r.unit_id === unitId) || { unit_id: unitId, reading_start: 0, reading_end: 0 };
  };

  const updateMeterReading = (unitId: string, updates: Partial<MeterReading>) => {
    const existing = data.meterReadings.find((r) => r.unit_id === unitId);
    let newReadings: Partial<MeterReading>[];
    
    if (existing) {
      newReadings = data.meterReadings.map((r) =>
        r.unit_id === unitId ? { ...r, ...updates } : r
      );
    } else {
      newReadings = [...data.meterReadings, { unit_id: unitId, reading_start: 0, reading_end: 0, ...updates }];
    }
    
    onUpdate({ meterReadings: newReadings });
  };

  const totalConsumption = data.meterReadings.reduce((sum, r) => sum + ((r.reading_end || 0) - (r.reading_start || 0)), 0);

  const areaCost = (data.heatingTotal * data.heatingAreaPercentage) / 100;
  const consumptionCost = data.heatingTotal - areaCost;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Flame className="h-5 w-5 text-primary" />
        <span>Schritt 5: Heizkostenabrechnung</span>
      </div>
      <p className="text-muted-foreground">
        Erfassen Sie die Heizkosten und Zählerstände für die verbrauchsabhängige Abrechnung.
      </p>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Gesamte Heizkosten (€)</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={data.heatingTotal || ''}
            onChange={(e) => onUpdate({ heatingTotal: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label>Aufteilungsschlüssel</Label>
          <Select 
            value={data.heatingAreaPercentage.toString()} 
            onValueChange={(v) => onUpdate({ heatingAreaPercentage: parseInt(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HEATING_SPLITS.map((split) => (
                <SelectItem key={split.value} value={split.value}>
                  {split.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {data.heatingTotal > 0 && (
        <div className="p-4 bg-muted rounded-lg grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Grundkosten (Fläche)</p>
            <p className="text-lg font-semibold">
              {areaCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Verbrauchskosten</p>
            <p className="text-lg font-semibold">
              {consumptionCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
        </div>
      )}

      {leases.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mt-6">Zählerstände erfassen</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mieter</TableHead>
                <TableHead>Wohneinheit</TableHead>
                <TableHead className="text-right">Stand Anfang</TableHead>
                <TableHead className="text-right">Stand Ende</TableHead>
                <TableHead className="text-right">Verbrauch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leases.map((lease) => {
                const reading = getMeterReading(lease.unit_id);
                const consumption = (reading.reading_end || 0) - (reading.reading_start || 0);
                return (
                  <TableRow key={lease.id}>
                    <TableCell className="font-medium">
                      {lease.tenant?.first_name} {lease.tenant?.last_name}
                    </TableCell>
                    <TableCell>{lease.unit?.name}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-24 ml-auto"
                        value={reading.reading_start || ''}
                        onChange={(e) => updateMeterReading(lease.unit_id, { reading_start: parseFloat(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-24 ml-auto"
                        value={reading.reading_end || ''}
                        onChange={(e) => updateMeterReading(lease.unit_id, { reading_end: parseFloat(e.target.value) || 0 })}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {consumption.toLocaleString('de-DE')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-lg font-semibold">
              Gesamtverbrauch: {totalConsumption.toLocaleString('de-DE')} Einheiten
            </p>
          </div>
        </>
      )}
    </div>
  );
}
