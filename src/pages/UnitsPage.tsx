import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Home, Loader2, ArrowLeft } from 'lucide-react';
import type { Unit, Building } from '@/types/database';

export default function UnitsPage() {
  const { buildingId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [building, setBuilding] = useState<Building | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    area: '',
    floor: '',
    rooms: '',
    has_heating_meter: true,
  });

  const fetchData = async () => {
    if (!buildingId) return;

    const [buildingRes, unitsRes] = await Promise.all([
      supabase.from('buildings').select('*').eq('id', buildingId).single(),
      supabase.from('units').select('*').eq('building_id', buildingId).order('name'),
    ]);

    if (buildingRes.error) {
      toast({ title: 'Fehler', description: buildingRes.error.message, variant: 'destructive' });
    } else {
      setBuilding(buildingRes.data);
    }

    if (unitsRes.error) {
      toast({ title: 'Fehler', description: unitsRes.error.message, variant: 'destructive' });
    } else {
      setUnits(unitsRes.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user && buildingId) fetchData();
  }, [user, buildingId]);

  const resetForm = () => {
    setFormData({ name: '', area: '', floor: '', rooms: '', has_heating_meter: true });
    setEditingUnit(null);
  };

  const openDialog = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        name: unit.name,
        area: unit.area.toString(),
        floor: unit.floor?.toString() || '',
        rooms: unit.rooms?.toString() || '',
        has_heating_meter: unit.has_heating_meter,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!buildingId) return;
    setSaving(true);

    const unitData = {
      building_id: buildingId,
      name: formData.name,
      area: parseFloat(formData.area) || 0,
      floor: formData.floor ? parseInt(formData.floor) : null,
      rooms: formData.rooms ? parseFloat(formData.rooms) : null,
      has_heating_meter: formData.has_heating_meter,
    };

    let error;
    if (editingUnit) {
      const { error: updateError } = await supabase
        .from('units')
        .update(unitData)
        .eq('id', editingUnit.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('units')
        .insert(unitData);
      error = insertError;
    }

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Erfolg', description: editingUnit ? 'Einheit aktualisiert.' : 'Einheit erstellt.' });
      setDialogOpen(false);
      resetForm();
      fetchData();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diese Einheit wirklich löschen?')) return;

    const { error } = await supabase.from('units').delete().eq('id', id);

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Erfolg', description: 'Einheit gelöscht.' });
      fetchData();
    }
  };

  const totalArea = units.reduce((sum, unit) => sum + unit.area, 0);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Link to="/gebaeude">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Wohneinheiten</h1>
            {building && (
              <p className="text-muted-foreground">
                {building.name} - {building.street} {building.house_number}, {building.city}
              </p>
            )}
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Neue Einheit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUnit ? 'Einheit bearbeiten' : 'Neue Einheit'}</DialogTitle>
                <DialogDescription>
                  Geben Sie die Daten der Wohneinheit ein.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Bezeichnung</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. Wohnung 1 EG links"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="area">Fläche (m²)</Label>
                    <Input
                      id="area"
                      type="number"
                      step="0.01"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      placeholder="75.50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floor">Etage</Label>
                    <Input
                      id="floor"
                      type="number"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rooms">Anzahl Zimmer</Label>
                  <Input
                    id="rooms"
                    type="number"
                    step="0.5"
                    value={formData.rooms}
                    onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                    placeholder="3.5"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_heating_meter"
                    checked={formData.has_heating_meter}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_heating_meter: !!checked })}
                  />
                  <Label htmlFor="has_heating_meter" className="font-normal">
                    Hat Heizkostenverteiler
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingUnit ? 'Speichern' : 'Erstellen'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alle Einheiten</CardTitle>
            <CardDescription>
              {units.length} Einheiten mit {totalArea.toLocaleString('de-DE')} m² Gesamtfläche
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Laden...</div>
            ) : units.length === 0 ? (
              <div className="text-center py-8">
                <Home className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Noch keine Einheiten vorhanden.</p>
                <Button onClick={() => openDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Erste Einheit anlegen
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bezeichnung</TableHead>
                    <TableHead className="text-right">Fläche (m²)</TableHead>
                    <TableHead className="text-right">Etage</TableHead>
                    <TableHead className="text-right">Zimmer</TableHead>
                    <TableHead className="text-center">Heizungszähler</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.name}</TableCell>
                      <TableCell className="text-right">{unit.area.toLocaleString('de-DE')}</TableCell>
                      <TableCell className="text-right">{unit.floor ?? '-'}</TableCell>
                      <TableCell className="text-right">{unit.rooms ?? '-'}</TableCell>
                      <TableCell className="text-center">{unit.has_heating_meter ? '✓' : '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(unit)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(unit.id)}>
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
