import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export interface AddressData {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  placeId?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  isVerified: boolean;
}

interface Prediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

interface AddressAutocompleteProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  disabled?: boolean;
}

export function AddressAutocomplete({ value, onChange, disabled }: AddressAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const sessionTokenRef = useRef<string>(crypto.randomUUID());
  const debounceRef = useRef<NodeJS.Timeout>();

  // Update input when external value changes
  useEffect(() => {
    if (value.isVerified && value.formattedAddress) {
      setInputValue(value.formattedAddress);
    }
  }, [value.isVerified, value.formattedAddress]);

  const searchPlaces = useCallback(async (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-places-autocomplete', {
        body: { input, sessionToken: sessionTokenRef.current },
      });

      if (error) throw error;
      setPredictions(data.predictions || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Clear verified status when user types
    if (value.isVerified) {
      onChange({ ...value, isVerified: false, placeId: undefined });
    }

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);

    if (newValue.length >= 3) {
      setOpen(true);
    }
  };

  const selectPlace = async (prediction: Prediction) => {
    setDetailsLoading(true);
    setOpen(false);

    try {
      const { data, error } = await supabase.functions.invoke('google-places-details', {
        body: { placeId: prediction.placeId, sessionToken: sessionTokenRef.current },
      });

      if (error) throw error;

      const address = data.address;
      
      if (address.isValid) {
        onChange({
          street: address.street,
          houseNumber: address.houseNumber,
          postalCode: address.postalCode,
          city: address.city,
          placeId: address.placeId,
          formattedAddress: address.formattedAddress,
          latitude: address.latitude,
          longitude: address.longitude,
          isVerified: true,
        });
        setInputValue(address.formattedAddress);
      } else {
        // Address not complete enough
        onChange({
          street: address.street || '',
          houseNumber: address.houseNumber || '',
          postalCode: address.postalCode || '',
          city: address.city || '',
          isVerified: false,
        });
        setInputValue(prediction.description);
      }

      // Generate new session token for next search
      sessionTokenRef.current = crypto.randomUUID();
      setPredictions([]);
    } catch (error) {
      console.error('Error fetching place details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address-search">
          Adresse suchen
          {value.isVerified && (
          <span className="ml-2 text-xs text-primary inline-flex items-center gap-1">
              <Check className="h-3 w-3" /> Verifiziert
            </span>
          )}
        </Label>
        <Popover open={open && predictions.length > 0} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="address-search"
                placeholder="Straße, Hausnummer, PLZ, Stadt eingeben..."
                value={inputValue}
                onChange={handleInputChange}
                disabled={disabled || detailsLoading}
                className={cn(
                  "pl-10",
              value.isVerified && "border-primary focus-visible:ring-primary"
                )}
              />
              {(loading || detailsLoading) && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
            <Command>
              <CommandList>
                <CommandEmpty>Keine Adressen gefunden</CommandEmpty>
                <CommandGroup>
                  {predictions.map((prediction) => (
                    <CommandItem
                      key={prediction.placeId}
                      value={prediction.placeId}
                      onSelect={() => selectPlace(prediction)}
                      className="cursor-pointer"
                    >
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium">{prediction.mainText}</span>
                        <span className="text-sm text-muted-foreground">{prediction.secondaryText}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Nur verifizierte Adressen können gespeichert werden
        </p>
      </div>

      {/* Show parsed address fields (read-only) */}
      {value.isVerified && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <Label className="text-xs text-muted-foreground">Straße</Label>
            <p className="font-medium">{value.street} {value.houseNumber}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">PLZ / Stadt</Label>
            <p className="font-medium">{value.postalCode} {value.city}</p>
          </div>
        </div>
      )}
    </div>
  );
}
