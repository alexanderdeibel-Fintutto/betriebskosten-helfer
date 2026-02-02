import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Send, Mail, Download, Loader2 } from 'lucide-react';
import type { Lease, WizardData } from '@/types/database';
import { validateOperatingCostItems, validateDirectCosts, validateMeterReadings } from '@/lib/validations';

interface Step8Props {
  data: WizardData;
  leases: Lease[];
  operatingCostId: string | null;
  onComplete: () => void;
}

export function Step8Send({ data, leases, operatingCostId, onComplete }: Step8Props) {
  const { toast } = useToast();
  const [selectedLeases, setSelectedLeases] = useState<string[]>(leases.map((l) => l.id));
  const [sendMethod, setSendMethod] = useState<'email' | 'download'>('download');
  const [sending, setSending] = useState(false);

  const toggleLease = (leaseId: string) => {
    setSelectedLeases((prev) =>
      prev.includes(leaseId) ? prev.filter((id) => id !== leaseId) : [...prev, leaseId]
    );
  };

  const handleSend = async () => {
    if (!operatingCostId || selectedLeases.length === 0) return;
    
    setSending(true);

    try {
      // Prepare cost items for validation
      const costItemsToSave = data.costItems
        .filter((item) => (item.amount || 0) > 0)
        .map((item) => ({
          operating_cost_id: operatingCostId,
          cost_type: item.cost_type,
          amount: item.amount || 0,
          allocation_key: item.allocation_key,
        }));

      // Prepare direct costs for validation
      const directCostsToSave = data.directCosts.map((dc) => ({
        operating_cost_id: operatingCostId,
        lease_id: dc.lease_id,
        description: dc.description || '',
        amount: dc.amount || 0,
      }));

      // Prepare meter readings for validation
      const meterReadingsToSave = data.meterReadings
        .filter((r) => r.unit_id)
        .map((r) => ({
          operating_cost_id: operatingCostId,
          unit_id: r.unit_id!,
          reading_start: r.reading_start || 0,
          reading_end: r.reading_end || 0,
        }));

      // Validate all data before saving
      const costItemsValidation = validateOperatingCostItems(costItemsToSave);
      if (!costItemsValidation.valid) {
        toast({
          title: 'Validierungsfehler',
          description: costItemsValidation.errors.join(' '),
          variant: 'destructive',
        });
        setSending(false);
        return;
      }

      const directCostsValidation = validateDirectCosts(directCostsToSave);
      if (!directCostsValidation.valid) {
        toast({
          title: 'Validierungsfehler',
          description: directCostsValidation.errors.join(' '),
          variant: 'destructive',
        });
        setSending(false);
        return;
      }

      const meterReadingsValidation = validateMeterReadings(meterReadingsToSave);
      if (!meterReadingsValidation.valid) {
        toast({
          title: 'Validierungsfehler',
          description: meterReadingsValidation.errors.join(' '),
          variant: 'destructive',
        });
        setSending(false);
        return;
      }

      // Update operating cost status
      await supabase
        .from('operating_costs')
        .update({ status: 'sent' })
        .eq('id', operatingCostId);

      // Save validated cost items
      if (costItemsToSave.length > 0) {
        await supabase.from('operating_cost_items').insert(costItemsToSave);
      }

      // Save validated direct costs
      if (directCostsToSave.length > 0) {
        await supabase.from('direct_costs').insert(directCostsToSave);
      }

      // Save validated meter readings
      if (meterReadingsToSave.length > 0) {
        await supabase.from('meter_readings').insert(meterReadingsToSave);
      }

      // Update heating costs
      await supabase
        .from('operating_costs')
        .update({
          heating_total: data.heatingTotal,
          heating_area_percentage: data.heatingAreaPercentage,
        })
        .eq('id', operatingCostId);

      toast({
        title: 'Erfolg',
        description: sendMethod === 'email' 
          ? 'Abrechnungen wurden per E-Mail versendet.'
          : 'Abrechnungen wurden erstellt und können heruntergeladen werden.',
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Send className="h-5 w-5 text-primary" />
        <span>Schritt 8: Versand</span>
      </div>
      <p className="text-muted-foreground">
        Wählen Sie die Mieter aus und senden Sie die Abrechnungen.
      </p>

      {/* Send Method Selection */}
      <div className="flex gap-4">
        <Button
          variant={sendMethod === 'download' ? 'default' : 'outline'}
          onClick={() => setSendMethod('download')}
        >
          <Download className="mr-2 h-4 w-4" />
          PDF Download
        </Button>
        <Button
          variant={sendMethod === 'email' ? 'default' : 'outline'}
          onClick={() => setSendMethod('email')}
          disabled
        >
          <Mail className="mr-2 h-4 w-4" />
          Per E-Mail (bald verfügbar)
        </Button>
      </div>

      {/* Tenant Selection */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedLeases.length === leases.length}
                onCheckedChange={() => {
                  if (selectedLeases.length === leases.length) {
                    setSelectedLeases([]);
                  } else {
                    setSelectedLeases(leases.map((l) => l.id));
                  }
                }}
              />
            </TableHead>
            <TableHead>Mieter</TableHead>
            <TableHead>Wohneinheit</TableHead>
            <TableHead>E-Mail</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leases.map((lease) => (
            <TableRow key={lease.id}>
              <TableCell>
                <Checkbox
                  checked={selectedLeases.includes(lease.id)}
                  onCheckedChange={() => toggleLease(lease.id)}
                />
              </TableCell>
              <TableCell className="font-medium">
                {lease.tenant?.first_name} {lease.tenant?.last_name}
              </TableCell>
              <TableCell>{lease.unit?.name}</TableCell>
              <TableCell>{lease.tenant?.email || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm">
          <strong>{selectedLeases.length}</strong> von <strong>{leases.length}</strong> Mietern ausgewählt
        </p>
      </div>

      {/* Send Button */}
      <div className="flex justify-end">
        <Button 
          size="lg" 
          onClick={handleSend} 
          disabled={sending || selectedLeases.length === 0}
        >
          {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {sendMethod === 'email' ? 'Abrechnungen versenden' : 'Abrechnungen erstellen'}
        </Button>
      </div>
    </div>
  );
}
