import { z } from 'zod';

// Password validation with strong requirements
export const passwordSchema = z
  .string()
  .min(8, 'Passwort muss mindestens 8 Zeichen lang sein.')
  .regex(/[a-z]/, 'Passwort muss Kleinbuchstaben enthalten.')
  .regex(/[A-Z]/, 'Passwort muss Großbuchstaben enthalten.')
  .regex(/[0-9]/, 'Passwort muss Zahlen enthalten.');

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    return { valid: false, error: result.error.errors[0]?.message };
  }
  return { valid: true };
};

// Tenant validation schema
export const tenantSchema = z.object({
  first_name: z
    .string()
    .min(1, 'Vorname ist erforderlich.')
    .max(100, 'Vorname darf maximal 100 Zeichen lang sein.')
    .regex(/^[a-zA-ZäöüßÄÖÜéèêëàâîïôùûç\s\-']+$/, 'Vorname enthält ungültige Zeichen.'),
  last_name: z
    .string()
    .min(1, 'Nachname ist erforderlich.')
    .max(100, 'Nachname darf maximal 100 Zeichen lang sein.')
    .regex(/^[a-zA-ZäöüßÄÖÜéèêëàâîïôùûç\s\-']+$/, 'Nachname enthält ungültige Zeichen.'),
  email: z
    .string()
    .email('Ungültige E-Mail-Adresse.')
    .max(255, 'E-Mail darf maximal 255 Zeichen lang sein.')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(50, 'Telefonnummer darf maximal 50 Zeichen lang sein.')
    .optional()
    .or(z.literal('')),
  iban: z
    .string()
    .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/, 'Ungültiges IBAN-Format.')
    .optional()
    .or(z.literal('')),
  bic: z
    .string()
    .regex(/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Ungültiges BIC-Format.')
    .optional()
    .or(z.literal('')),
});

// Building validation schema
export const buildingSchema = z.object({
  name: z
    .string()
    .min(1, 'Name ist erforderlich.')
    .max(200, 'Name darf maximal 200 Zeichen lang sein.'),
  street: z
    .string()
    .min(1, 'Straße ist erforderlich.')
    .max(200, 'Straße darf maximal 200 Zeichen lang sein.'),
  house_number: z
    .string()
    .min(1, 'Hausnummer ist erforderlich.')
    .max(20, 'Hausnummer darf maximal 20 Zeichen lang sein.'),
  postal_code: z
    .string()
    .min(1, 'PLZ ist erforderlich.')
    .max(10, 'PLZ darf maximal 10 Zeichen lang sein.')
    .regex(/^[0-9]{4,10}$/, 'PLZ muss 4-10 Ziffern enthalten.'),
  city: z
    .string()
    .min(1, 'Stadt ist erforderlich.')
    .max(100, 'Stadt darf maximal 100 Zeichen lang sein.'),
  total_area: z
    .number()
    .positive('Gesamtfläche muss positiv sein.')
    .max(1000000, 'Gesamtfläche ist zu groß.'),
});

// Lease validation schema
export const leaseSchema = z.object({
  start_date: z.string().min(1, 'Startdatum ist erforderlich.'),
  end_date: z.string().optional().or(z.literal('')),
  tenant_id: z.string().uuid('Ungültige Mieter-ID.'),
  unit_id: z.string().uuid('Ungültige Einheits-ID.'),
  persons_count: z
    .number()
    .int('Personenzahl muss eine ganze Zahl sein.')
    .min(1, 'Mindestens 1 Person erforderlich.')
    .max(50, 'Personenzahl ist zu hoch.'),
  monthly_prepayment: z
    .number()
    .min(0, 'Vorauszahlung darf nicht negativ sein.')
    .max(100000, 'Vorauszahlung ist zu hoch.'),
}).refine(
  (data) => {
    if (data.end_date && data.start_date) {
      return new Date(data.end_date) >= new Date(data.start_date);
    }
    return true;
  },
  { message: 'Enddatum muss nach dem Startdatum liegen.', path: ['end_date'] }
);

// Unit validation schema
export const unitSchema = z.object({
  name: z
    .string()
    .min(1, 'Name ist erforderlich.')
    .max(100, 'Name darf maximal 100 Zeichen lang sein.'),
  building_id: z.string().uuid('Ungültige Gebäude-ID.'),
  area: z
    .number()
    .positive('Fläche muss positiv sein.')
    .max(10000, 'Fläche ist zu groß.'),
  floor: z
    .number()
    .int('Stockwerk muss eine ganze Zahl sein.')
    .min(-10, 'Stockwerk ist zu niedrig.')
    .max(200, 'Stockwerk ist zu hoch.')
    .optional()
    .nullable(),
  rooms: z
    .number()
    .positive('Zimmeranzahl muss positiv sein.')
    .max(100, 'Zimmeranzahl ist zu hoch.')
    .optional()
    .nullable(),
  has_heating_meter: z.boolean().optional(),
});

// Profile validation schema
export const profileSchema = z.object({
  company_name: z
    .string()
    .max(200, 'Firmenname darf maximal 200 Zeichen lang sein.')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(500, 'Adresse darf maximal 500 Zeichen lang sein.')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(50, 'Telefonnummer darf maximal 50 Zeichen lang sein.')
    .optional()
    .or(z.literal('')),
});

// Helper to format validation errors
export const formatValidationErrors = (error: z.ZodError): string => {
  return error.errors.map((e) => e.message).join(' ');
};

// Operating cost item validation schema
const VALID_COST_TYPES = [
  'public_charges', 'water_supply', 'sewage', 'heating_central', 'hot_water_central',
  'elevator', 'street_cleaning_waste', 'building_cleaning', 'garden_maintenance',
  'lighting', 'chimney_cleaning', 'insurance', 'caretaker', 'antenna_cable',
  'laundry_facilities', 'other_operating_costs', 'reserve'
] as const;

const VALID_ALLOCATION_KEYS = ['area', 'persons', 'units', 'consumption', 'direct'] as const;

export const operatingCostItemSchema = z.object({
  operating_cost_id: z.string().uuid('Ungültige Betriebskosten-ID.'),
  cost_type: z.enum(VALID_COST_TYPES, {
    errorMap: () => ({ message: 'Ungültiger Kostentyp.' })
  }),
  amount: z
    .number()
    .min(0, 'Betrag darf nicht negativ sein.')
    .max(1000000, 'Betrag ist zu hoch.'),
  allocation_key: z.enum(VALID_ALLOCATION_KEYS, {
    errorMap: () => ({ message: 'Ungültiger Umlageschlüssel.' })
  }),
});

// Direct cost validation schema
export const directCostSchema = z.object({
  operating_cost_id: z.string().uuid('Ungültige Betriebskosten-ID.'),
  lease_id: z.string().uuid('Ungültige Mietvertrags-ID.'),
  description: z
    .string()
    .min(1, 'Beschreibung ist erforderlich.')
    .max(500, 'Beschreibung darf maximal 500 Zeichen lang sein.'),
  amount: z
    .number()
    .min(0, 'Betrag darf nicht negativ sein.')
    .max(1000000, 'Betrag ist zu hoch.'),
});

// Meter reading validation schema
export const meterReadingSchema = z.object({
  operating_cost_id: z.string().uuid('Ungültige Betriebskosten-ID.'),
  unit_id: z.string().uuid('Ungültige Einheits-ID.'),
  reading_start: z
    .number()
    .min(0, 'Anfangsstand darf nicht negativ sein.')
    .max(99999999, 'Anfangsstand ist zu hoch.'),
  reading_end: z
    .number()
    .min(0, 'Endstand darf nicht negativ sein.')
    .max(99999999, 'Endstand ist zu hoch.'),
}).refine(
  (data) => data.reading_end >= data.reading_start,
  { message: 'Endstand muss größer oder gleich dem Anfangsstand sein.', path: ['reading_end'] }
);

// Validation helper functions for wizard data
export const validateOperatingCostItems = (items: unknown[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  for (let i = 0; i < items.length; i++) {
    const result = operatingCostItemSchema.safeParse(items[i]);
    if (!result.success) {
      errors.push(`Kostenposition ${i + 1}: ${formatValidationErrors(result.error)}`);
    }
  }
  return { valid: errors.length === 0, errors };
};

export const validateDirectCosts = (costs: unknown[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  for (let i = 0; i < costs.length; i++) {
    const result = directCostSchema.safeParse(costs[i]);
    if (!result.success) {
      errors.push(`Direktkosten ${i + 1}: ${formatValidationErrors(result.error)}`);
    }
  }
  return { valid: errors.length === 0, errors };
};

export const validateMeterReadings = (readings: unknown[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  for (let i = 0; i < readings.length; i++) {
    const result = meterReadingSchema.safeParse(readings[i]);
    if (!result.success) {
      errors.push(`Zählerstand ${i + 1}: ${formatValidationErrors(result.error)}`);
    }
  }
  return { valid: errors.length === 0, errors };
};
