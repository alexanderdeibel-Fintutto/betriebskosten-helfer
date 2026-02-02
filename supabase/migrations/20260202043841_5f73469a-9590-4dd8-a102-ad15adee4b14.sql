-- Enum for allocation keys (Umlageschlüssel)
CREATE TYPE public.allocation_key AS ENUM ('area', 'persons', 'units', 'consumption', 'direct');

-- Enum for cost types (BetrKV categories)
CREATE TYPE public.cost_type AS ENUM (
  'public_charges',
  'water_supply', 
  'sewage',
  'heating_central',
  'hot_water_central',
  'elevator',
  'street_cleaning_waste',
  'building_cleaning',
  'garden_maintenance',
  'lighting',
  'chimney_cleaning',
  'insurance',
  'caretaker',
  'antenna_cable',
  'laundry_facilities',
  'other_operating_costs',
  'reserve'
);

-- Enum for operating cost status
CREATE TYPE public.operating_cost_status AS ENUM ('draft', 'calculated', 'sent', 'completed');

-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  company_name TEXT,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Buildings table
CREATE TABLE public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  street TEXT NOT NULL,
  house_number TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  city TEXT NOT NULL,
  total_area DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Units table (Wohneinheiten)
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  area DECIMAL(10,2) NOT NULL DEFAULT 0,
  floor INTEGER,
  rooms DECIMAL(3,1),
  has_heating_meter BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tenants table (Mieter)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  iban TEXT,
  bic TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Leases table (Mietverträge)
CREATE TABLE public.leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_prepayment DECIMAL(10,2) NOT NULL DEFAULT 0,
  persons_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Operating costs (main billing record)
CREATE TABLE public.operating_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status operating_cost_status NOT NULL DEFAULT 'draft',
  heating_total DECIMAL(10,2) DEFAULT 0,
  heating_area_percentage INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Operating cost items (Kostenpositionen)
CREATE TABLE public.operating_cost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operating_cost_id UUID REFERENCES public.operating_costs(id) ON DELETE CASCADE NOT NULL,
  cost_type cost_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  allocation_key allocation_key NOT NULL DEFAULT 'area',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Direct costs (Mieter-spezifische Kosten)
CREATE TABLE public.direct_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operating_cost_id UUID REFERENCES public.operating_costs(id) ON DELETE CASCADE NOT NULL,
  lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Meter readings (Zählerstände)
CREATE TABLE public.meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operating_cost_id UUID REFERENCES public.operating_costs(id) ON DELETE CASCADE NOT NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  reading_start DECIMAL(10,2) NOT NULL DEFAULT 0,
  reading_end DECIMAL(10,2) NOT NULL DEFAULT 0,
  consumption DECIMAL(10,2) GENERATED ALWAYS AS (reading_end - reading_start) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Operating cost results (Berechnungsergebnisse pro Mieter)
CREATE TABLE public.operating_cost_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operating_cost_id UUID REFERENCES public.operating_costs(id) ON DELETE CASCADE NOT NULL,
  lease_id UUID REFERENCES public.leases(id) ON DELETE CASCADE NOT NULL,
  prepayment_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_share DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance DECIMAL(10,2) GENERATED ALWAYS AS (prepayment_total - cost_share) STORED,
  heating_cost DECIMAL(10,2) DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_cost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_cost_results ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Helper function to get building owner
CREATE OR REPLACE FUNCTION public.get_building_owner(building_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.buildings WHERE id = building_id
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies  
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Buildings policies
CREATE POLICY "Users can view own buildings" ON public.buildings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own buildings" ON public.buildings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own buildings" ON public.buildings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own buildings" ON public.buildings
  FOR DELETE USING (auth.uid() = user_id);

-- Units policies (access via building ownership)
CREATE POLICY "Users can view units of own buildings" ON public.units
  FOR SELECT USING (public.get_building_owner(building_id) = auth.uid());
CREATE POLICY "Users can insert units to own buildings" ON public.units
  FOR INSERT WITH CHECK (public.get_building_owner(building_id) = auth.uid());
CREATE POLICY "Users can update units of own buildings" ON public.units
  FOR UPDATE USING (public.get_building_owner(building_id) = auth.uid());
CREATE POLICY "Users can delete units of own buildings" ON public.units
  FOR DELETE USING (public.get_building_owner(building_id) = auth.uid());

-- Tenants policies
CREATE POLICY "Users can view own tenants" ON public.tenants
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tenants" ON public.tenants
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tenants" ON public.tenants
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tenants" ON public.tenants
  FOR DELETE USING (auth.uid() = user_id);

-- Leases policies (access via unit → building ownership)
CREATE OR REPLACE FUNCTION public.get_unit_owner(unit_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.user_id 
  FROM public.units u 
  JOIN public.buildings b ON u.building_id = b.id 
  WHERE u.id = unit_id
$$;

CREATE POLICY "Users can view leases of own units" ON public.leases
  FOR SELECT USING (public.get_unit_owner(unit_id) = auth.uid());
CREATE POLICY "Users can insert leases to own units" ON public.leases
  FOR INSERT WITH CHECK (public.get_unit_owner(unit_id) = auth.uid());
CREATE POLICY "Users can update leases of own units" ON public.leases
  FOR UPDATE USING (public.get_unit_owner(unit_id) = auth.uid());
CREATE POLICY "Users can delete leases of own units" ON public.leases
  FOR DELETE USING (public.get_unit_owner(unit_id) = auth.uid());

-- Operating costs policies
CREATE POLICY "Users can view own operating costs" ON public.operating_costs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own operating costs" ON public.operating_costs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own operating costs" ON public.operating_costs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own operating costs" ON public.operating_costs
  FOR DELETE USING (auth.uid() = user_id);

-- Operating cost items policies (via operating_cost ownership)
CREATE OR REPLACE FUNCTION public.get_operating_cost_owner(operating_cost_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.operating_costs WHERE id = operating_cost_id
$$;

CREATE POLICY "Users can view own operating cost items" ON public.operating_cost_items
  FOR SELECT USING (public.get_operating_cost_owner(operating_cost_id) = auth.uid());
CREATE POLICY "Users can insert own operating cost items" ON public.operating_cost_items
  FOR INSERT WITH CHECK (public.get_operating_cost_owner(operating_cost_id) = auth.uid());
CREATE POLICY "Users can update own operating cost items" ON public.operating_cost_items
  FOR UPDATE USING (public.get_operating_cost_owner(operating_cost_id) = auth.uid());
CREATE POLICY "Users can delete own operating cost items" ON public.operating_cost_items
  FOR DELETE USING (public.get_operating_cost_owner(operating_cost_id) = auth.uid());

-- Direct costs policies
CREATE POLICY "Users can view own direct costs" ON public.direct_costs
  FOR SELECT USING (public.get_operating_cost_owner(operating_cost_id) = auth.uid());
CREATE POLICY "Users can insert own direct costs" ON public.direct_costs
  FOR INSERT WITH CHECK (public.get_operating_cost_owner(operating_cost_id) = auth.uid());
CREATE POLICY "Users can update own direct costs" ON public.direct_costs
  FOR UPDATE USING (public.get_operating_cost_owner(operating_cost_id) = auth.uid());
CREATE POLICY "Users can delete own direct costs" ON public.direct_costs
  FOR DELETE USING (public.get_operating_cost_owner(operating_cost_id) = auth.uid());

-- Meter readings policies
CREATE POLICY "Users can view own meter readings" ON public.meter_readings
  FOR SELECT USING (public.get_operating_cost_owner(operating_cost_id) = auth.uid());
CREATE POLICY "Users can insert own meter readings" ON public.meter_readings
  FOR INSERT WITH CHECK (public.get_operating_cost_owner(operating_cost_id) = auth.uid());
CREATE POLICY "Users can update own meter readings" ON public.meter_readings
  FOR UPDATE USING (public.get_operating_cost_owner(operating_cost_id) = auth.uid());
CREATE POLICY "Users can delete own meter readings" ON public.meter_readings
  FOR DELETE USING (public.get_operating_cost_owner(operating_cost_id) = auth.uid());

-- Operating cost results policies
CREATE POLICY "Users can view own operating cost results" ON public.operating_cost_results
  FOR SELECT USING (public.get_operating_cost_owner(operating_cost_id) = auth.uid());
CREATE POLICY "Users can insert own operating cost results" ON public.operating_cost_results
  FOR INSERT WITH CHECK (public.get_operating_cost_owner(operating_cost_id) = auth.uid());
CREATE POLICY "Users can update own operating cost results" ON public.operating_cost_results
  FOR UPDATE USING (public.get_operating_cost_owner(operating_cost_id) = auth.uid());
CREATE POLICY "Users can delete own operating cost results" ON public.operating_cost_results
  FOR DELETE USING (public.get_operating_cost_owner(operating_cost_id) = auth.uid());

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON public.buildings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leases_updated_at BEFORE UPDATE ON public.leases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_operating_costs_updated_at BEFORE UPDATE ON public.operating_costs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_operating_cost_results_updated_at BEFORE UPDATE ON public.operating_cost_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();