import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';
import type { Lease, WizardData } from '@/types/database';

interface Step2Props {
  leases: Lease[];
  data: WizardData;
  onUpdate: (updates: Partial<WizardData>) => void;
}

export function Step2Leases({ leases, data, onUpdate }: Step2Props) {
  const toggleLease = (leaseId: string) => {
    const newSelected = data.selectedLeaseIds.includes(leaseId)
      ? data.selectedLeaseIds.filter((id) => id !== leaseId)
      : [...data.selectedLeaseIds, leaseId];
    onUpdate({ selectedLeaseIds: newSelected });
  };

  const toggleAll = () => {
    if (data.selectedLeaseIds.length === leases.length) {
      onUpdate({ selectedLeaseIds: [] });
    } else {
      onUpdate({ selectedLeaseIds: leases.map((l) => l.id) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Users className="h-5 w-5 text-primary" />
        <span>Schritt 2: Mietverträge auswählen</span>
      </div>
      <p className="text-muted-foreground">
        Wählen Sie die Mietverträge aus, die in diese Abrechnung einbezogen werden sollen.
      </p>

      {leases.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Keine Mietverträge im gewählten Zeitraum gefunden.</p>
          <p className="text-sm mt-2">
            Bitte wählen Sie in Schritt 1 ein Gebäude und einen Zeitraum aus, oder legen Sie zuerst Mietverträge an.
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={data.selectedLeaseIds.length === leases.length}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Mieter</TableHead>
                <TableHead>Wohneinheit</TableHead>
                <TableHead>Vertragszeitraum</TableHead>
                <TableHead className="text-right">Vorauszahlung/Monat</TableHead>
                <TableHead className="text-right">Personen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leases.map((lease) => (
                <TableRow key={lease.id}>
                  <TableCell>
                    <Checkbox
                      checked={data.selectedLeaseIds.includes(lease.id)}
                      onCheckedChange={() => toggleLease(lease.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {lease.tenant?.first_name} {lease.tenant?.last_name}
                  </TableCell>
                  <TableCell>{lease.unit?.name}</TableCell>
                  <TableCell>
                    {new Date(lease.start_date).toLocaleDateString('de-DE')} -{' '}
                    {lease.end_date ? new Date(lease.end_date).toLocaleDateString('de-DE') : 'unbefristet'}
                  </TableCell>
                  <TableCell className="text-right">
                    {lease.monthly_prepayment.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </TableCell>
                  <TableCell className="text-right">{lease.persons_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>{data.selectedLeaseIds.length}</strong> von <strong>{leases.length}</strong> Mietverträgen ausgewählt
            </p>
          </div>
        </>
      )}
    </div>
  );
}
