import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { AddressAutocomplete, AddressData } from '@/components/address/AddressAutocomplete';
import type { Building } from '@/types/database';

interface BuildingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building?: Building | null;
  onSave: (data: {
    name: string;
    street: string;
    house_number: string;
    postal_code: string;
    city: string;
    total_area: number;
    place_id?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;
  saving: boolean;
}

export function BuildingFormDialog({ open, onOpenChange, building, onSave, saving }: BuildingFormDialogProps) {
  const [name, setName] = useState('');
  const [totalArea, setTotalArea] = useState('');
  const [addressData, setAddressData] = useState<AddressData>({
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    isVerified: false,
  });

  // Reset form when dialog opens/closes or building changes
  useEffect(() => {
    if (open) {
      if (building) {
        setName(building.name);
        setTotalArea(building.total_area.toString());
        setAddressData({
          street: building.street,
          houseNumber: building.house_number,
          postalCode: building.postal_code,
          city: building.city,
          formattedAddress: `${building.street} ${building.house_number}, ${building.postal_code} ${building.city}`,
          isVerified: true, // Existing buildings are considered verified
        });
      } else {
        setName('');
        setTotalArea('');
        setAddressData({
          street: '',
          houseNumber: '',
          postalCode: '',
          city: '',
          isVerified: false,
        });
      }
    }
  }, [open, building]);

  const handleSave = async () => {
    if (!addressData.isVerified) return;

    await onSave({
      name: name.trim(),
      street: addressData.street,
      house_number: addressData.houseNumber,
      postal_code: addressData.postalCode,
      city: addressData.city,
      total_area: parseFloat(totalArea) || 0,
      place_id: addressData.placeId,
      latitude: addressData.latitude,
      longitude: addressData.longitude,
    });
  };

  const canSave = name.trim() && addressData.isVerified && parseFloat(totalArea) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{building ? 'Gebäude bearbeiten' : 'Neues Gebäude'}</DialogTitle>
          <DialogDescription>
            Geben Sie die Gebäudedaten ein. Die Adresse muss über Google Maps verifiziert werden.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Bezeichnung</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Musterhaus 1"
            />
          </div>

          <AddressAutocomplete
            value={addressData}
            onChange={setAddressData}
            disabled={saving}
          />

          <div className="space-y-2">
            <Label htmlFor="total_area">Gesamtfläche (m²)</Label>
            <Input
              id="total_area"
              type="number"
              step="0.01"
              value={totalArea}
              onChange={(e) => setTotalArea(e.target.value)}
              placeholder="500.00"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving || !canSave}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {building ? 'Speichern' : 'Erstellen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
