import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, FileText, Loader2 } from 'lucide-react';
import type { Lease, Tenant, Unit, Building } from '@/types/database';

interface UnitWithBuilding extends Unit {
  building: Building;
}

export default function LeasesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [units, setUnits] = useState<UnitWithBuilding[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLease, setEditingLease] = useState<Lease | null>(null);
  const [formData, setFormData] = useState({
    unit_id: '',
    tenant_id: '',
    start_date: '',
    end_date: '',
    monthly_prepayment: '',
    persons_count: '1',
  });

  const fetchData = async () => {
    const [leasesRes, unitsRes, tenantsRes] = await Promise.all([
      supabase.from('leases').select(`
        *,
        tenant:tenants(*),
        unit:units(*, building:buildings(*))
      `).order('start_date', { ascending: false }),
      supabase.from('units').select('*, building:buildings(*)').order('name'),
      supabase.from('tenants').select('*').order('last_name'),
    ]);

    if (leasesRes.error) toast({ title: 'Fehler', description: leasesRes.error.message, variant: 'destructive' });
    else setLeases(leasesRes.data || []);

    if (unitsRes.error) toast({ title: 'Fehler', description: unitsRes.error.message, variant: 'destructive' });
    else setUnits(unitsRes.data as UnitWithBuilding[] || []);

    if (tenantsRes.error) toast({ title: 'Fehler', description: tenantsRes.error.message, variant: 'destructive' });
    else setTenants(tenantsRes.data || []);

    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const resetForm = () => {
    setFormData({
      unit_id: '',
      tenant_id: '',
      start_date: '',
      end_date: '',
      monthly_prepayment: '',
      persons_count: '1',
    });
    setEditingLease(null);
  };

  const openDialog = (lease?: Lease) => {
    if (lease) {
      setEditingLease(lease);
      setFormData({
        unit_id: lease.unit_id,
        tenant_id: lease.tenant_id,
        start_date: lease.start_date,
        end_date: lease.end_date || '',
        monthly_prepayment: lease.monthly_prepayment.toString(),
        persons_count: lease.persons_count.toString(),
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const leaseData = {
      unit_id: formData.unit_id,
      tenant_id: formData.tenant_id,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      monthly_prepayment: parseFloat(formData.monthly_prepayment) || 0,
      persons_count: parseInt(formData.persons_count) || 1,
    };

    let error;
    if (editingLease) {
      const { error: updateError } = await supabase
        .from('leases')
        .update(leaseData)
        .eq('id', editingLease.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('leases')
        .insert(leaseData);
      error = insertError;
    }

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Erfolg', description: editingLease ? 'Mietvertrag aktualisiert.' : 'Mietvertrag erstellt.' });
      setDialogOpen(false);
      resetForm();
      fetchData();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diesen Mietvertrag wirklich löschen?')) return;

    const { error } = await supabase.from('leases').delete().eq('id', id);

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Erfolg', description: 'Mietvertrag gelöscht.' });
      fetchData();
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mietverträge</h1>
            <p className="text-muted-foreground">Verwalten Sie Ihre Mietverträge</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()} disabled={units.length === 0 || tenants.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Neuer Mietvertrag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingLease ? 'Mietvertrag bearbeiten' : 'Neuer Mietvertrag'}</DialogTitle>
                <DialogDescription>
                  Geben Sie die Vertragsdaten ein.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_id">Wohneinheit</Label>
                  <Select value={formData.unit_id} onValueChange={(v) => setFormData({ ...formData, unit_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wohneinheit wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.building.name} - {unit.name} ({unit.area} m²)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tenant_id">Mieter</Label>
                  <Select value={formData.tenant_id} onValueChange={(v) => setFormData({ ...formData, tenant_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mieter wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.first_name} {tenant.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Vertragsbeginn</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Vertragsende (optional)</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthly_prepayment">Monatliche NK-Vorauszahlung (€)</Label>
                    <Input
                      id="monthly_prepayment"
                      type="number"
                      step="0.01"
                      value={formData.monthly_prepayment}
                      onChange={(e) => setFormData({ ...formData, monthly_prepayment: e.target.value })}
                      placeholder="150.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="persons_count">Personen im Haushalt</Label>
                    <Input
                      id="persons_count"
                      type="number"
                      min="1"
                      value={formData.persons_count}
                      onChange={(e) => setFormData({ ...formData, persons_count: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingLease ? 'Speichern' : 'Erstellen'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {(units.length === 0 || tenants.length === 0) && (
          <Card className="border-warning bg-warning/10">
            <CardContent className="pt-6">
              <p className="text-sm">
                {units.length === 0 && 'Sie müssen zuerst Gebäude und Wohneinheiten anlegen. '}
                {tenants.length === 0 && 'Sie müssen zuerst Mieter anlegen.'}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Alle Mietverträge</CardTitle>
            <CardDescription>{leases.length} Mietverträge insgesamt</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Laden...</div>
            ) : leases.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Noch keine Mietverträge vorhanden.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mieter</TableHead>
                    <TableHead>Wohneinheit</TableHead>
                    <TableHead>Zeitraum</TableHead>
                    <TableHead className="text-right">NK-Vorauszahlung</TableHead>
                    <TableHead className="text-right">Personen</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leases.map((lease) => (
                    <TableRow key={lease.id}>
                      <TableCell className="font-medium">
                        {lease.tenant?.first_name} {lease.tenant?.last_name}
                      </TableCell>
                      <TableCell>
                        {(lease.unit as any)?.building?.name} - {lease.unit?.name}
                      </TableCell>
                      <TableCell>
                        {new Date(lease.start_date).toLocaleDateString('de-DE')} - {lease.end_date ? new Date(lease.end_date).toLocaleDateString('de-DE') : 'unbefristet'}
                      </TableCell>
                      <TableCell className="text-right">
                        {lease.monthly_prepayment.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </TableCell>
                      <TableCell className="text-right">{lease.persons_count}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(lease)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(lease.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
