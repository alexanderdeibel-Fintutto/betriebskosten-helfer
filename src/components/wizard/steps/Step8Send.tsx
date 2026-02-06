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
    if (!operatingCostId) return;
    
    setSending(true);

    try {
      // Prepare standard cost items for saving (filter out 'custom' type for DB enum compatibility)
      const standardCostItems = data.costItems
        .filter((item) => (item.amount || 0) > 0 && item.cost_type !== 'custom')
        .map((item) => ({
          operating_cost_id: operatingCostId,
          cost_type: item.cost_type as Exclude<typeof item.cost_type, 'custom'>,
          amount: item.amount || 0,
          allocation_key: item.allocation_key,
        }));

      // Prepare custom cost items (use 'other_operating_costs' as the DB type with custom_label)
      const customCostItems = (data.customCostItems || [])
        .filter((item) => (item.amount || 0) > 0)
        .map((item) => ({
          operating_cost_id: operatingCostId,
          cost_type: 'other_operating_costs' as const,
          amount: item.amount || 0,
          allocation_key: item.allocation_key || 'area',
          custom_label: item.custom_label,
          is_custom_category: true,
        }));

      const costItemsToSave = [...standardCostItems, ...customCostItems];

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

      // Determine status based on leases selection
      const newStatus = selectedLeases.length > 0 ? 'calculated' : 'draft';

      // Update operating cost status
      await supabase
        .from('operating_costs')
        .update({ 
          status: newStatus,
          heating_total: data.heatingTotal,
          heating_area_percentage: data.heatingAreaPercentage,
        })
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

      // Calculate totals for version history
      const totalCosts = costItemsToSave.reduce((sum, item) => sum + (item.amount || 0), 0) + 
        data.heatingTotal + 
        directCostsToSave.reduce((sum, dc) => sum + (dc.amount || 0), 0);
      
      // Get existing version count
      const { data: existingVersions } = await supabase
        .from('operating_cost_versions')
        .select('version_number')
        .eq('operating_cost_id', operatingCostId)
        .order('version_number', { ascending: false })
        .limit(1);
      
      const nextVersion = (existingVersions?.[0]?.version_number || 0) + 1;

      // Calculate total prepayments from selected leases
      const totalPrepayments = leases
        .filter(l => selectedLeases.includes(l.id))
        .reduce((sum, lease) => {
          const periodStart = new Date(data.periodStart || '');
          const periodEnd = new Date(data.periodEnd || '');
          const months = Math.max(1, Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24 * 30)));
          return sum + (lease.monthly_prepayment * months);
        }, 0);

      // Create version history entry
      await supabase.from('operating_cost_versions').insert({
        operating_cost_id: operatingCostId,
        version_number: nextVersion,
        total_costs: totalCosts,
        total_prepayments: totalPrepayments,
        change_summary: nextVersion === 1 ? 'Erstmalige Erstellung' : 'Aktualisierung der Abrechnung',
      });

      toast({
        title: 'Erfolg',
        description: selectedLeases.length > 0
          ? (sendMethod === 'email' ? 'Abrechnungen wurden per E-Mail versendet.' : 'Abrechnungen wurden erstellt und können heruntergeladen werden.')
          : 'Abrechnung wurde als Entwurf gespeichert.',
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

  const hasLeases = leases.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
        <Send className="h-5 w-5 text-primary flex-shrink-0" />
        <span>Schritt 8: Versand</span>
      </div>
      <p className="text-sm text-muted-foreground">
        {hasLeases 
          ? 'Wählen Sie die Mieter aus und senden Sie die Abrechnungen.'
          : 'Speichern Sie die Abrechnung. Mieter können später hinzugefügt werden.'}
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

      {/* Tenant Selection - only show if there are leases */}
      {hasLeases ? (
        <>
          <div className="overflow-x-auto">
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
                  <TableHead className="hidden sm:table-cell">Wohneinheit</TableHead>
                  <TableHead className="hidden sm:table-cell">E-Mail</TableHead>
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
                      <div>
                        {lease.tenant?.first_name} {lease.tenant?.last_name}
                      </div>
                      <div className="sm:hidden text-xs text-muted-foreground">
                        {lease.unit?.name}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{lease.unit?.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{lease.tenant?.email || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="p-3 sm:p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>{selectedLeases.length}</strong> von <strong>{leases.length}</strong> Mietern ausgewählt
            </p>
          </div>
        </>
      ) : (
        <div className="p-4 bg-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            Keine Mieter vorhanden. Die Abrechnung wird als Entwurf gespeichert.
          </p>
        </div>
      )}

      {/* Send Button */}
      <div className="flex justify-end">
        <Button 
          size="lg" 
          onClick={handleSend} 
          disabled={sending}
        >
          {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {hasLeases 
            ? (sendMethod === 'email' ? 'Abrechnungen versenden' : 'Abrechnungen erstellen')
            : 'Abrechnung speichern'}
        </Button>
      </div>
    </div>
  );
}
