// Types for Fintutto Nebenkosten

export type AllocationKey = 'area' | 'persons' | 'units' | 'consumption' | 'direct';

export type CostType = 
  | 'public_charges'
  | 'water_supply'
  | 'sewage'
  | 'heating_central'
  | 'hot_water_central'
  | 'elevator'
  | 'street_cleaning_waste'
  | 'building_cleaning'
  | 'garden_maintenance'
  | 'lighting'
  | 'chimney_cleaning'
  | 'insurance'
  | 'caretaker'
  | 'antenna_cable'
  | 'laundry_facilities'
  | 'other_operating_costs'
  | 'reserve';

export type OperatingCostStatus = 'draft' | 'calculated' | 'sent' | 'completed';

export const COST_TYPE_LABELS: Record<CostType, string> = {
  public_charges: '1. Laufende öffentliche Lasten',
  water_supply: '2. Wasserversorgung',
  sewage: '3. Entwässerung',
  heating_central: '4. Heizung (zentral)',
  hot_water_central: '5. Warmwasser (zentral)',
  elevator: '6. Aufzug',
  street_cleaning_waste: '7. Straßenreinigung und Müllabfuhr',
  building_cleaning: '8. Gebäudereinigung',
  garden_maintenance: '9. Gartenpflege',
  lighting: '10. Beleuchtung',
  chimney_cleaning: '11. Schornsteinreinigung',
  insurance: '12. Versicherungen',
  caretaker: '13. Hauswart',
  antenna_cable: '14. Gemeinschafts-Antennenanlage/Kabel',
  laundry_facilities: '15. Wascheinrichtungen',
  other_operating_costs: '16. Sonstige Betriebskosten',
  reserve: '17. Reserve',
};

export const ALLOCATION_KEY_LABELS: Record<AllocationKey, string> = {
  area: 'Nach Fläche (m²)',
  persons: 'Nach Personen',
  units: 'Nach Einheiten',
  consumption: 'Nach Verbrauch',
  direct: 'Direkt zugeordnet',
};

export const STATUS_LABELS: Record<OperatingCostStatus, string> = {
  draft: 'Entwurf',
  calculated: 'Berechnet',
  sent: 'Versendet',
  completed: 'Abgeschlossen',
};

export interface Building {
  id: string;
  user_id: string;
  name: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  total_area: number;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  building_id: string;
  name: string;
  area: number;
  floor?: number;
  rooms?: number;
  has_heating_meter: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  iban?: string;
  bic?: string;
  created_at: string;
  updated_at: string;
}

export interface Lease {
  id: string;
  unit_id: string;
  tenant_id: string;
  start_date: string;
  end_date?: string;
  monthly_prepayment: number;
  persons_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  tenant?: Tenant;
  unit?: Unit & { building?: Building };
}

export interface OperatingCost {
  id: string;
  user_id: string;
  building_id: string;
  period_start: string;
  period_end: string;
  status: OperatingCostStatus;
  heating_total: number;
  heating_area_percentage: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  building?: Building;
}

export interface OperatingCostItem {
  id: string;
  operating_cost_id: string;
  cost_type: CostType;
  amount: number;
  allocation_key: AllocationKey;
  description?: string;
  created_at: string;
}

export interface DirectCost {
  id: string;
  operating_cost_id: string;
  lease_id: string;
  description: string;
  amount: number;
  created_at: string;
}

export interface MeterReading {
  id: string;
  operating_cost_id: string;
  unit_id: string;
  reading_start: number;
  reading_end: number;
  consumption: number;
  created_at: string;
}

export interface OperatingCostResult {
  id: string;
  operating_cost_id: string;
  lease_id: string;
  prepayment_total: number;
  cost_share: number;
  balance: number;
  heating_cost: number;
  sent_at?: string;
  sent_method?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  lease?: Lease;
}

export interface WizardData {
  buildingId?: string;
  periodStart?: string;
  periodEnd?: string;
  selectedLeaseIds: string[];
  costItems: Partial<OperatingCostItem>[];
  directCosts: Partial<DirectCost>[];
  heatingTotal: number;
  heatingAreaPercentage: number;
  meterReadings: Partial<MeterReading>[];
}
