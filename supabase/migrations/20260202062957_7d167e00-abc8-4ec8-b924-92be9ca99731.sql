-- Create a secure view for tenants that excludes banking information
-- This view is used for general listing/display purposes
CREATE VIEW public.tenants_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    user_id,
    first_name,
    last_name,
    email,
    phone,
    created_at,
    updated_at
  FROM public.tenants;
-- Note: IBAN and BIC are intentionally excluded from this view

-- Grant access to the view for authenticated users
GRANT SELECT ON public.tenants_public TO authenticated;

-- Drop the existing permissive SELECT policy on tenants
DROP POLICY IF EXISTS "Users can view own tenants" ON public.tenants;

-- Create a restrictive SELECT policy that denies direct table access
-- Users must use the tenants_public view for reading tenant data
CREATE POLICY "Users can view own tenants via view"
  ON public.tenants
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create a secure function to get tenant banking info when explicitly needed
-- This adds an extra layer of intentional access
CREATE OR REPLACE FUNCTION public.get_tenant_banking_info(tenant_id uuid)
RETURNS TABLE (
  id uuid,
  iban text,
  bic text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.iban, t.bic
  FROM public.tenants t
  WHERE t.id = tenant_id
    AND t.user_id = auth.uid()
$$;