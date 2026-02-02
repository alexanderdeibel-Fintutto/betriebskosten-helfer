import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Building2, Loader2, Home } from 'lucide-react';
import type { Building } from '@/types/database';
import { buildingSchema, formatValidationErrors } from '@/lib/validations';

export default function BuildingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    house_number: '',
    postal_code: '',
    city: '',
    total_area: '',
  });

  const fetchBuildings = async () => {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .order('name');

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      setBuildings(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchBuildings();
  }, [user]);

  const resetForm = () => {
    setFormData({ name: '', street: '', house_number: '', postal_code: '', city: '', total_area: '' });
    setEditingBuilding(null);
  };

  const openDialog = (building?: Building) => {
    if (building) {
      setEditingBuilding(building);
      setFormData({
        name: building.name,
        street: building.street,
        house_number: building.house_number,
        postal_code: building.postal_code,
        city: building.city,
        total_area: building.total_area.toString(),
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Validate form data using the building schema
    const validationData = {
      name: formData.name.trim(),
      street: formData.street.trim(),
      house_number: formData.house_number.trim(),
      postal_code: formData.postal_code.trim(),
      city: formData.city.trim(),
      total_area: parseFloat(formData.total_area) || 0,
    };

    const validation = buildingSchema.safeParse(validationData);
    
    if (!validation.success) {
      toast({ 
        title: 'Validierungsfehler', 
        description: formatValidationErrors(validation.error), 
        variant: 'destructive' 
      });
      return;
    }

    setSaving(true);

    const buildingData = {
      name: validation.data.name,
      street: validation.data.street,
      house_number: validation.data.house_number,
      postal_code: validation.data.postal_code,
      city: validation.data.city,
      total_area: validation.data.total_area,
      user_id: user.id,
    };

    let error;
    if (editingBuilding) {
      const { error: updateError } = await supabase
        .from('buildings')
        .update(buildingData)
        .eq('id', editingBuilding.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('buildings')
        .insert(buildingData);
      error = insertError;
    }

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Erfolg', description: editingBuilding ? 'Gebäude aktualisiert.' : 'Gebäude erstellt.' });
      setDialogOpen(false);
      resetForm();
      fetchBuildings();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie dieses Gebäude wirklich löschen?')) return;

    const { error } = await supabase.from('buildings').delete().eq('id', id);

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Erfolg', description: 'Gebäude gelöscht.' });
      fetchBuildings();
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gebäude</h1>
            <p className="text-muted-foreground">Verwalten Sie Ihre Immobilien</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Neues Gebäude
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBuilding ? 'Gebäude bearbeiten' : 'Neues Gebäude'}</DialogTitle>
                <DialogDescription>
                  Geben Sie die Gebäudedaten ein.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Bezeichnung</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. Musterhaus 1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Straße</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="Musterstraße"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="house_number">Hausnummer</Label>
                    <Input
                      id="house_number"
                      value={formData.house_number}
                      onChange={(e) => setFormData({ ...formData, house_number: e.target.value })}
                      placeholder="1a"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">PLZ</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      placeholder="12345"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Stadt</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Musterstadt"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_area">Gesamtfläche (m²)</Label>
                  <Input
                    id="total_area"
                    type="number"
                    step="0.01"
                    value={formData.total_area}
                    onChange={(e) => setFormData({ ...formData, total_area: e.target.value })}
                    placeholder="500.00"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingBuilding ? 'Speichern' : 'Erstellen'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alle Gebäude</CardTitle>
            <CardDescription>{buildings.length} Gebäude insgesamt</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Laden...</div>
            ) : buildings.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Noch keine Gebäude vorhanden.</p>
                <Button onClick={() => openDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Erstes Gebäude anlegen
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bezeichnung</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead className="text-right">Fläche (m²)</TableHead>
                    <TableHead className="text-right">Einheiten</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buildings.map((building) => (
                    <TableRow key={building.id}>
                      <TableCell className="font-medium">{building.name}</TableCell>
                      <TableCell>
                        {building.street} {building.house_number}, {building.postal_code} {building.city}
                      </TableCell>
                      <TableCell className="text-right">{building.total_area.toLocaleString('de-DE')}</TableCell>
                      <TableCell className="text-right">
                        <Link to={`/gebaeude/${building.id}/einheiten`}>
                          <Button variant="outline" size="sm">
                            <Home className="mr-2 h-3 w-3" />
                            Einheiten
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(building)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(building.id)}>
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
