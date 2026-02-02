-- ═══════════════════════════════════════════════════════════════════
-- 1. ORGANISATIONEN
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('vermieter', 'hausverwaltung', 'makler')),
  stripe_customer_id TEXT,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
-- 2. PROFILE ERWEITERN
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ═══════════════════════════════════════════════════════════════════
-- 3. APP_ROLE ENUM ERWEITERN
-- ═══════════════════════════════════════════════════════════════════

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vermieter';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mieter';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hausmeister';

-- ═══════════════════════════════════════════════════════════════════
-- 4. ZÄHLER-TABELLE
-- ═══════════════════════════════════════════════════════════════════

CREATE TYPE public.meter_type AS ENUM ('electricity', 'gas', 'water_cold', 'water_hot', 'heating');

CREATE TABLE IF NOT EXISTS public.meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  meter_number TEXT NOT NULL,
  meter_type public.meter_type NOT NULL,
  installation_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.meters ENABLE ROW LEVEL SECURITY;

-- Add meter_id to meter_readings if not exists
ALTER TABLE public.meter_readings 
ADD COLUMN IF NOT EXISTS meter_id UUID REFERENCES public.meters(id),
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ocr', 'api')),
ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- ═══════════════════════════════════════════════════════════════════
-- 5. AUFGABEN-TABELLE
-- ═══════════════════════════════════════════════════════════════════

CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.task_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.task_category AS ENUM ('repair', 'maintenance', 'inspection', 'other');

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  category public.task_category DEFAULT 'other',
  priority public.task_priority DEFAULT 'medium',
  status public.task_status DEFAULT 'open',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
-- 6. DOKUMENTE-TABELLE
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  document_type TEXT,
  file_url TEXT,
  file_size INTEGER,
  content_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
-- 7. NACHRICHTEN-TABELLE
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
-- 8. HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════

-- Get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization(user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE profiles.user_id = user_id
$$;

-- Check if users are in same organization
CREATE OR REPLACE FUNCTION public.same_organization(user_id_a UUID, user_id_b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.user_id = user_id_a 
      AND p2.user_id = user_id_b
      AND p1.organization_id = p2.organization_id
      AND p1.organization_id IS NOT NULL
  )
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 9. RLS POLICIES - ORGANIZATIONS
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own organization"
ON public.organizations FOR SELECT
USING (id = public.get_user_organization(auth.uid()));

CREATE POLICY "Admins can update own organization"
ON public.organizations FOR UPDATE
USING (id = public.get_user_organization(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════════════════════════════════
-- 10. RLS POLICIES - METERS
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "Users can view meters of own units"
ON public.meters FOR SELECT
USING (public.get_unit_owner(unit_id) = auth.uid());

CREATE POLICY "Users can insert meters to own units"
ON public.meters FOR INSERT
WITH CHECK (public.get_unit_owner(unit_id) = auth.uid());

CREATE POLICY "Users can update meters of own units"
ON public.meters FOR UPDATE
USING (public.get_unit_owner(unit_id) = auth.uid());

CREATE POLICY "Users can delete meters of own units"
ON public.meters FOR DELETE
USING (public.get_unit_owner(unit_id) = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- 11. RLS POLICIES - TASKS
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "Users can view tasks they created or are assigned to"
ON public.tasks FOR SELECT
USING (
  created_by = auth.uid() 
  OR assigned_to = auth.uid()
  OR (building_id IS NOT NULL AND public.get_building_owner(building_id) = auth.uid())
);

CREATE POLICY "Users can create tasks for own buildings"
ON public.tasks FOR INSERT
WITH CHECK (
  created_by = auth.uid() 
  AND (building_id IS NULL OR public.get_building_owner(building_id) = auth.uid())
);

CREATE POLICY "Users can update own or assigned tasks"
ON public.tasks FOR UPDATE
USING (
  created_by = auth.uid() 
  OR assigned_to = auth.uid()
  OR (building_id IS NOT NULL AND public.get_building_owner(building_id) = auth.uid())
);

CREATE POLICY "Owners can delete tasks"
ON public.tasks FOR DELETE
USING (
  created_by = auth.uid()
  OR (building_id IS NOT NULL AND public.get_building_owner(building_id) = auth.uid())
);

-- ═══════════════════════════════════════════════════════════════════
-- 12. RLS POLICIES - DOCUMENTS
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own documents"
ON public.documents FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own documents"
ON public.documents FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own documents"
ON public.documents FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own documents"
ON public.documents FOR DELETE
USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- 13. RLS POLICIES - MESSAGES
-- ═══════════════════════════════════════════════════════════════════

CREATE POLICY "Users can view own messages"
ON public.messages FOR SELECT
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients can mark messages as read"
ON public.messages FOR UPDATE
USING (recipient_id = auth.uid());

CREATE POLICY "Senders can delete own messages"
ON public.messages FOR DELETE
USING (sender_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- 14. UPDATED_AT TRIGGERS
-- ═══════════════════════════════════════════════════════════════════

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meters_updated_at
  BEFORE UPDATE ON public.meters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();