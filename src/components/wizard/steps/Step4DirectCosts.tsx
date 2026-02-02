import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, UserCog } from 'lucide-react';
import type { Lease, WizardData, DirectCost } from '@/types/database';

interface Step4Props {
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
  leases: Lease[];
  operatingCostId: string | null;
}

export function Step4DirectCosts({ data, onUpdate, leases }: Step4Props) {
  const [newCost, setNewCost] = useState<Partial<DirectCost>>({
    lease_id: '',
    description: '',
    amount: 0,
  });

  const addDirectCost = () => {
    if (!newCost.lease_id || !newCost.description || !newCost.amount) return;
    
    onUpdate({
      directCosts: [...data.directCosts, { ...newCost, id: crypto.randomUUID() }],
    });
    
    setNewCost({ lease_id: '', description: '', amount: 0 });
  };

  const removeDirectCost = (index: number) => {
    const newCosts = [...data.directCosts];
    newCosts.splice(index, 1);
    onUpdate({ directCosts: newCosts });
  };

  const getTenantName = (leaseId: string) => {
    const lease = leases.find((l) => l.id === leaseId);
    return lease?.tenant ? `${lease.tenant.first_name} ${lease.tenant.last_name}` : 'Unbekannt';
  };

  const totalDirectCosts = data.directCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <UserCog className="h-5 w-5 text-primary" />
        <span>Schritt 4: Direktkosten zuordnen</span>
      </div>
      <p className="text-muted-foreground">
        Erfassen Sie mieter-spezifische Kosten, die direkt einem Mieter zugeordnet werden (z.B. Schlüsseldienst, individuelle Reparaturen).
      </p>

      {leases.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Keine Mietverträge ausgewählt. Bitte wählen Sie zuerst Mietverträge in Schritt 2 aus.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Mieter</Label>
              <Select value={newCost.lease_id || ''} onValueChange={(v) => setNewCost({ ...newCost, lease_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Mieter wählen" />
                </SelectTrigger>
                <SelectContent>
                  {leases.map((lease) => (
                    <SelectItem key={lease.id} value={lease.id}>
                      {lease.tenant?.first_name} {lease.tenant?.last_name} ({lease.unit?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Input
                value={newCost.description || ''}
                onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                placeholder="z.B. Schlüsseldienst"
              />
            </div>
            <div className="space-y-2">
              <Label>Betrag (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={newCost.amount || ''}
                onChange={(e) => setNewCost({ ...newCost, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <Button onClick={addDirectCost} disabled={!newCost.lease_id || !newCost.description || !newCost.amount}>
              <Plus className="mr-2 h-4 w-4" />
              Hinzufügen
            </Button>
          </div>

          {data.directCosts.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mieter</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.directCosts.map((cost, index) => (
                  <TableRow key={index}>
                    <TableCell>{getTenantName(cost.lease_id || '')}</TableCell>
                    <TableCell>{cost.description}</TableCell>
                    <TableCell className="text-right">
                      {(cost.amount || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => removeDirectCost(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-lg font-semibold">
              Direktkosten gesamt: {totalDirectCosts.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
