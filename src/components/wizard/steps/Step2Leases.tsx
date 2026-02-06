import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Info } from 'lucide-react';
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 text-base sm:text-lg font-semibold">
        <Users className="h-5 w-5 text-primary flex-shrink-0" />
        <span>Schritt 2: Mietverträge auswählen</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Wählen Sie die Mietverträge aus, die in diese Abrechnung einbezogen werden sollen.
      </p>

      {leases.length === 0 ? (
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Keine Mietverträge im gewählten Zeitraum gefunden. Sie können trotzdem fortfahren und die Abrechnung für ein leerstehendes Gebäude erstellen. Mietverträge können später hinzugefügt werden.
            </AlertDescription>
          </Alert>
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">
              Tipp: Sie können im Menü unter "Mieter" und "Mietverträge" neue Einträge anlegen.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Checkbox
                checked={data.selectedLeaseIds.length === leases.length && leases.length > 0}
                onCheckedChange={toggleAll}
              />
              <span className="text-sm font-medium">Alle auswählen</span>
            </div>
            
            {leases.map((lease) => (
              <div 
                key={lease.id} 
                className="p-3 border rounded-lg space-y-2"
                onClick={() => toggleLease(lease.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={data.selectedLeaseIds.includes(lease.id)}
                    onCheckedChange={() => toggleLease(lease.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {lease.tenant?.first_name} {lease.tenant?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {lease.unit?.name}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between text-sm pl-7">
                  <span className="text-muted-foreground">
                    {new Date(lease.start_date).toLocaleDateString('de-DE')} - {lease.end_date ? new Date(lease.end_date).toLocaleDateString('de-DE') : 'unbefristet'}
                  </span>
                </div>
                <div className="flex justify-between text-sm pl-7">
                  <span>{lease.monthly_prepayment.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/Monat</span>
                  <span>{lease.persons_count} Person(en)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={data.selectedLeaseIds.length === leases.length && leases.length > 0}
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
          </div>

          <div className="p-3 sm:p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>{data.selectedLeaseIds.length}</strong> von <strong>{leases.length}</strong> Mietverträgen ausgewählt
            </p>
          </div>
        </>
      )}
    </div>
  );
}
